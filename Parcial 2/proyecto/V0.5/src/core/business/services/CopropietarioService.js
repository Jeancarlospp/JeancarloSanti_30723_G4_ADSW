const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const copropietarioRepository = require('../../../data/repositories/copropietarioRepository');
const usuarioRepository = require('../../../data/repositories/usuarioRepository');
const pagoRepository = require('../../../data/repositories/pagoRepository');
const ExcelCopropietarioAdapter = require('../patterns/excelAdapter');
const Copropietario = require('../../domain/models/Copropietario');
const bcrypt = require('bcrypt');

class CopropietarioService {
    async importarMasivoDesdeExcel(buffer) {
        let workbook;
        try {
            workbook = xlsx.read(buffer, { type: 'buffer' });
        } catch {
            throw new Error("El archivo no es un archivo Excel válido (.xlsx o .xls).");
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = xlsx.utils.sheet_to_json(worksheet);

        if (rawRows.length === 0) {
            throw new Error("El archivo Excel está vacío.");
        }

        const exitosos = [];
        const errores = [];
        const cedulasEnLote = new Set();
        const casasEnLote = new Set();

        // 1. Fase de Validación del lote (Garantizar atomicidad: si uno falla, se cancela todo)
        for (let i = 0; i < rawRows.length; i++) {
            const rawRow = rawRows[i];
            const filaIndex = i + 1;

            try {
                const adapted = ExcelCopropietarioAdapter.adaptRow(rawRow);
                const copro = new Copropietario(adapted);
                copro.validarDatosFila();

                // Validar duplicados dentro del mismo archivo
                if (cedulasEnLote.has(copro.cedula)) {
                    throw new Error(`Cédula duplicada en el archivo (${copro.cedula}).`);
                }
                if (casasEnLote.has(copro.casa)) {
                    throw new Error(`Número de casa/villa duplicado en el archivo (${copro.casa}).`);
                }

                cedulasEnLote.add(copro.cedula);
                casasEnLote.add(copro.casa);

                // Validar contra base de datos
                const existeCedula = await copropietarioRepository.findByCedula(copro.cedula);
                if (existeCedula) {
                    throw new Error(`La cédula ${copro.cedula} ya está registrada en el sistema.`);
                }

                const existeCasa = await copropietarioRepository.findByCasa(copro.casa);
                if (existeCasa) {
                    throw new Error(`La casa/villa ${copro.casa} ya está asignada a otro copropietario.`);
                }

                exitosos.push(copro);
            } catch (err) {
                errores.push({
                    fila: filaIndex,
                    mensaje: err.message
                });
            }
        }

        // Si existe un solo error en el lote, rechazar toda la importación (REQ004 / Sprint 1)
        if (errores.length > 0) {
            const errorReport = errores.map(e => `Fila ${e.fila}: ${e.mensaje}`).join(' | ');
            throw new Error(`Importación cancelada por errores de validación: ${errorReport}`);
        }

        // 2. Fase de Persistencia e Inserción Atómica
        const importados = [];
        for (const copro of exitosos) {
            // Generar credenciales de acceso automáticas (RF-2.1)
            // Nombre de usuario = número de casa (ej: 'Casa 14')
            const username = copro.casa.replace(/\s+/g, '').toLowerCase(); 
            // Generar clave temporal
            const tempPassword = `Temp-${Math.floor(1000 + Math.random() * 9000)}!`;
            const hashed = await bcrypt.hash(tempPassword, 12);

            // Crear el perfil de usuario copropietario
            const createdUser = await usuarioRepository.create(username, copro.email, hashed, 'COPROPIETARIO', 1);
            
            // Asignar el ID de usuario recién creado
            copro.usuarioId = createdUser.id;

            // Guardar en la tabla de copropietarios
            const coproId = await copropietarioRepository.create(copro);
            copro.id = coproId;

            // Retornar credenciales temporales generadas para el PDF
            importados.push({
                id: copro.id,
                cedula: copro.cedula,
                nombre: copro.nombre,
                casa: copro.casa,
                telefono: copro.telefono,
                email: copro.email,
                saldo: copro.saldo,
                username,
                passwordTemporal: tempPassword
            });
        }

        return importados;
    }

    async obtenerTodos() {
        return await copropietarioRepository.findAll();
    }

    async obtenerPorId(id) {
        return await copropietarioRepository.findById(id);
    }

    async obtenerPorUsuarioId(usuarioId) {
        return await copropietarioRepository.findByUsuarioId(usuarioId);
    }

    async actualizarDatos(cedula, datos) {
        const copropietario = await copropietarioRepository.findByCedula(cedula);
        if (!copropietario) {
            throw new Error("Copropietario no encontrado.");
        }

        // Si se cambia de villa, verificar disponibilidad
        if (datos.casa && datos.casa !== copropietario.casa) {
            const existeCasa = await copropietarioRepository.findByCasa(datos.casa);
            if (existeCasa) {
                throw new Error(`La villa ${datos.casa} ya está registrada.`);
            }
        }

        const temp = new Copropietario({
            cedula: cedula,
            nombre: datos.nombre || copropietario.nombre,
            casa: datos.casa || copropietario.casa,
            telefono: datos.telefono || copropietario.telefono,
            email: datos.email || copropietario.email,
            saldo: datos.saldo !== undefined ? datos.saldo : copropietario.saldo,
            usuarioId: copropietario.usuario_id
        });
        temp.validarDatosFila();

        await copropietarioRepository.update(cedula, {
            nombre: temp.nombre,
            casa: temp.casa,
            telefono: temp.telefono,
            email: temp.email,
            saldo: temp.saldo
        });

        return temp;
    }

    async eliminarCopropietario(id) {
        const copropietario = await copropietarioRepository.findById(id);
        if (!copropietario) {
            throw new Error("El copropietario no existe.");
        }

        // Regla: No eliminar si tiene deudas pendientes
        const deudasPendientes = await pagoRepository.countPendingDeudas(id);
        if (deudasPendientes > 0) {
            throw new Error("No se permite eliminar un copropietario con deudas pendientes.");
        }

        // Si tiene historial financiero, la eliminación física se puede hacer sólo si se confirma (se procesa en el controller)
        // Pero el service realiza la eliminación física directa una vez invocado.
        if (copropietario.usuario_id) {
            await usuarioRepository.delete(copropietario.usuario_id);
        }
        await copropietarioRepository.delete(id);
        return { mensaje: "Copropietario eliminado del sistema con éxito." };
    }

    // Generar archivo PDF con la lista de residentes
    generarPdfLista(lista) {
        return new Promise((resolve) => {
            const doc = new PDFDocument({ margin: 40 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Cabecera Formal
            doc.fillColor('#1e3a8a').fontSize(22).text('ALIGEST CONDOMINIOS', { align: 'center', underline: true });
            doc.fillColor('#475569').fontSize(12).text('Reporte Oficial de Residentes - La Primavera', { align: 'center' });
            doc.moveDown(2);

            // Cabecera de Tabla
            doc.fillColor('#0f172a').fontSize(10).text('CASA', 40, doc.y, { bold: true });
            doc.text('NOMBRE', 110, doc.y);
            doc.text('CÉDULA', 280, doc.y);
            doc.text('TELÉFONO', 380, doc.y);
            doc.text('SALDO', 480, doc.y, { align: 'right' });
            doc.moveDown(0.5);
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            // Filas
            lista.forEach(c => {
                doc.fillColor('#334155').fontSize(9);
                doc.text(c.casa, 40, doc.y);
                doc.text(c.nombre.substring(0, 30), 110, doc.y);
                doc.text(c.cedula, 280, doc.y);
                doc.text(c.telefono, 380, doc.y);
                doc.text(`$${parseFloat(c.saldo).toFixed(2)}`, 480, doc.y, { align: 'right' });
                doc.moveDown(0.8);
            });

            doc.end();
        });
    }

    // Generar archivo Excel con la lista de residentes
    generarExcelLista(lista) {
        const wb = xlsx.utils.book_new();
        const formatData = lista.map(c => ({
            "Cédula": c.cedula,
            "Residente": c.nombre,
            "Villa / Casa": c.casa,
            "Celular": c.telefono,
            "Correo": c.email,
            "Saldo Pendiente": c.saldo
        }));
        const ws = xlsx.utils.json_to_sheet(formatData);
        xlsx.utils.book_append_sheet(wb, ws, "Residentes");
        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    // Generar reporte en PDF del resumen de importación masiva (RF-2.1)
    generarPdfResumenImportacion(resultados) {
        return new Promise((resolve) => {
            const doc = new PDFDocument({ margin: 40 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.fillColor('#059669').fontSize(20).text('AliGest - Resumen de Importación de Copropietarios', { align: 'center' });
            doc.moveDown();
            doc.fillColor('#374151').fontSize(11).text(`Fecha de procesamiento: ${new Date().toLocaleString()}`);
            doc.text(`Total de registros cargados con éxito: ${resultados.length}`);
            doc.moveDown();

            doc.fontSize(12).fillColor('#111827').text('Credenciales temporales de acceso para residentes:', { underline: true });
            doc.moveDown(0.5);

            resultados.forEach((res, i) => {
                doc.fontSize(9).fillColor('#374151');
                doc.text(`${i+1}. Villa: ${res.casa} | Residente: ${res.nombre}`);
                doc.fillColor('#2563eb').text(`   Usuario de acceso: ${res.username} | Contraseña temporal: ${res.passwordTemporal}`);
                doc.moveDown(0.6);
            });

            doc.end();
        });
    }

    async crearCopropietario(datos) {
        const copro = new Copropietario(datos);
        copro.validarDatosFila();

        const existeCedula = await copropietarioRepository.findByCedula(copro.cedula);
        if (existeCedula) {
            throw new Error(`La cédula ${copro.cedula} ya está registrada en el sistema.`);
        }

        const existeCasa = await copropietarioRepository.findByCasa(copro.casa);
        if (existeCasa) {
            throw new Error(`La casa/villa ${copro.casa} ya está asignada a otro copropietario.`);
        }

        const existeEmail = await copropietarioRepository.findByEmail(copro.email);
        if (existeEmail) {
            throw new Error(`El correo electrónico ${copro.email} ya está registrado.`);
        }

        const username = copro.casa.replace(/\s+/g, '').toLowerCase();
        const existeUsuario = await usuarioRepository.findByUsername(username);
        if (existeUsuario) {
            throw new Error(`El nombre de usuario '${username}' (generado de la casa) ya existe.`);
        }

        // Generar credenciales de acceso automáticas
        const tempPassword = `Temp-${Math.floor(1000 + Math.random() * 9000)}!`;
        const hashed = await bcrypt.hash(tempPassword, 12);

        // Crear el perfil de usuario copropietario (mustChangePassword = 1)
        const createdUser = await usuarioRepository.create(username, copro.email, hashed, 'COPROPIETARIO', 1);

        copro.usuarioId = createdUser.id;

        // Guardar en la tabla de copropietarios
        const coproId = await copropietarioRepository.create(copro);
        copro.id = coproId;

        return {
            id: copro.id,
            cedula: copro.cedula,
            nombre: copro.nombre,
            casa: copro.casa,
            telefono: copro.telefono,
            email: copro.email,
            saldo: copro.saldo,
            username,
            passwordTemporal: tempPassword
        };
    }
}

module.exports = new CopropietarioService();
