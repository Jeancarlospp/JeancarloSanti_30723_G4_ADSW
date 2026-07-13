const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const copropietarioRepository = require('../../../data/repositories/copropietarioRepository');
const usuarioRepository = require('../../../data/repositories/usuarioRepository');
const pagoRepository = require('../../../data/repositories/pagoRepository');
const ExcelCopropietarioAdapter = require('../patterns/excelAdapter');
const Copropietario = require('../../domain/models/Copropietario');
const Cedula = require('../../domain/valueObjects/Cedula');
const bcrypt = require('bcrypt');
const sessionRepository = require('../../../data/repositories/sessionRepository');

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
        const matriz = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cabeceras = matriz[0] || [];
        const ordenEsperado = [
            ['nombrecompleto', 'nombre'],
            ['numerocasa', 'numerodecasa', 'casa', 'numvilla'],
            ['cedula', 'ceduladeidentidad', 'idnacional'],
            ['correoelectronico', 'correo', 'email'],
            ['telefono', 'celular']
        ];
        if (!ordenEsperado.every((variantes, i) => variantes.includes(normalizar(cabeceras[i])))) {
            throw new Error("Estructura de archivo incorrecta. Use este orden: Nombre Completo, Número Casa, Cédula, Correo Electrónico, Teléfono y, opcionalmente, Saldo Inicial.");
        }

        const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
        if (rawRows.length === 0) throw new Error("El archivo Excel está vacío.");

        const validos = [];
        const errores = [];
        const advertencias = [];
        const cedulasEnLote = new Set();
        const casasEnLote = new Set();
        const emailsEnLote = new Set();
        const [copropietariosExistentes, usuariosExistentes] = await Promise.all([
            copropietarioRepository.findAll(),
            usuarioRepository.findAll()
        ]);
        const cedulasExistentes = new Set(copropietariosExistentes.map(c => c.cedula));
        const casasExistentes = new Set(copropietariosExistentes.map(c => c.casa));
        const emailsExistentes = new Set(usuariosExistentes.map(u => u.email.toLowerCase()));
        const usernamesExistentes = new Set(usuariosExistentes.map(u => u.username));
        const filasAProcesar = rawRows.slice(0, 60);
        if (rawRows.length > 60) {
            advertencias.push(`Solo se procesaron los primeros 60 registros; ${rawRows.length - 60} quedaron fuera del lote.`);
        }

        for (let i = 0; i < filasAProcesar.length; i++) {
            try {
                const copro = new Copropietario(ExcelCopropietarioAdapter.adaptRow(filasAProcesar[i]));
                copro.validarDatosFila();
                const numeroCasa = parseInt(copro.casa.replace(/[^0-9]/g, ''), 10);
                if (!Number.isInteger(numeroCasa) || numeroCasa < 1 || numeroCasa > 60) {
                    throw new Error(`El número de casa '${copro.casa}' debe estar entre 1 y 60.`);
                }
                if (cedulasEnLote.has(copro.cedula)) throw new Error(`Cédula duplicada en el archivo (${copro.cedula}).`);
                if (casasEnLote.has(copro.casa)) throw new Error(`Número de casa duplicado (${copro.casa}).`);
                if (emailsEnLote.has(copro.email.toLowerCase())) throw new Error(`Correo duplicado (${copro.email}).`);

                cedulasEnLote.add(copro.cedula);
                casasEnLote.add(copro.casa);
                emailsEnLote.add(copro.email.toLowerCase());

                if (cedulasExistentes.has(copro.cedula)) throw new Error(`La cédula ${copro.cedula} ya está registrada.`);
                if (casasExistentes.has(copro.casa)) throw new Error(`Número de casa duplicado: ${copro.casa} ya está registrado.`);
                if (emailsExistentes.has(copro.email.toLowerCase())) throw new Error(`El correo ${copro.email} ya está registrado.`);
                const username = copro.casa.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                if (usernamesExistentes.has(username)) throw new Error(`El usuario generado '${username}' ya existe.`);

                validos.push({ copro, fila: i + 2 });
            } catch (err) {
                errores.push({ fila: i + 2, mensaje: err.message });
            }
        }

        const resultadosPersistencia = await Promise.all(validos.map(async ({ copro, fila }) => {
            const username = copro.casa.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const tempPassword = `Temp-${Math.floor(1000 + Math.random() * 9000)}!`;
            const hashed = await bcrypt.hash(tempPassword, 12);
            let createdUser = null;
            try {
                createdUser = await usuarioRepository.create(username, copro.email, hashed, 'COPROPIETARIO', 1);
                copro.usuarioId = createdUser.id;
                copro.id = await copropietarioRepository.create(copro);
                return { ok: true, data: {
                    id: copro.id, cedula: copro.cedula, nombre: copro.nombre,
                    casa: copro.casa, telefono: copro.telefono, email: copro.email,
                    saldo: copro.saldo, username, passwordTemporal: tempPassword
                } };
            } catch (err) {
                if (createdUser) await usuarioRepository.delete(createdUser.id);
                return { ok: false, error: { fila, mensaje: err.message } };
            }
        }));

        const importados = resultadosPersistencia.filter(r => r.ok).map(r => r.data);
        errores.push(...resultadosPersistencia.filter(r => !r.ok).map(r => r.error));

        return {
            totalProcesados: filasAProcesar.length,
            exitosos: importados.length,
            fallidos: errores.length,
            importados,
            errores,
            advertencias
        };
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

        // RF-2.4: el número de casa es el identificador estable y no se modifica.
        if (datos.casa && datos.casa !== copropietario.casa) {
            throw new Error("El número de casa no puede ser modificado.");
        }

        const hayCambios = ['cedula', 'nombre', 'telefono', 'email', 'saldo'].some(campo =>
            datos[campo] !== undefined && String(datos[campo]) !== String(copropietario[campo])
        );
        if (!hayCambios) throw new Error("No se detectaron cambios. Modifique al menos un campo para continuar.");

        // RF-2.4: Cambio de representante (nueva cédula) -> regenerar contraseña temporal
        let nuevaCedula = copropietario.cedula;
        let passwordTemporal = null;

        if (datos.cedula) {
            const cedulaSolicitada = new Cedula(datos.cedula).valor;
            if (cedulaSolicitada !== copropietario.cedula) {
                const existeCedula = await copropietarioRepository.findByCedula(cedulaSolicitada);
                if (existeCedula) {
                    throw new Error(`La cédula ${cedulaSolicitada} ya está registrada en el sistema.`);
                }

                nuevaCedula = cedulaSolicitada;

                if (copropietario.usuario_id) {
                    passwordTemporal = `Temp-${Math.floor(1000 + Math.random() * 9000)}!`;
                    const hashed = await bcrypt.hash(passwordTemporal, 12);
                    await usuarioRepository.updatePasswordAndForceMustChange(copropietario.usuario_id, hashed);
                    await sessionRepository.invalidateUserSessions(copropietario.usuario_id);
                }
            }
        }

        const temp = new Copropietario({
            cedula: nuevaCedula,
            nombre: datos.nombre || copropietario.nombre,
            casa: datos.casa || copropietario.casa,
            telefono: datos.telefono || copropietario.telefono,
            email: datos.email || copropietario.email,
            saldo: datos.saldo !== undefined ? datos.saldo : copropietario.saldo,
            usuarioId: copropietario.usuario_id
        });
        temp.validarDatosFila();

        if (copropietario.usuario_id && temp.email !== copropietario.email) {
            const emailOcupado = await usuarioRepository.findByEmail(temp.email);
            if (emailOcupado && String(emailOcupado.id) !== String(copropietario.usuario_id)) {
                throw new Error(`El correo electrónico ${temp.email} ya está registrado.`);
            }
        }

        await copropietarioRepository.update(cedula, {
            cedula: temp.cedula,
            nombre: temp.nombre,
            casa: temp.casa,
            telefono: temp.telefono,
            email: temp.email,
            saldo: temp.saldo
        });

        if (copropietario.usuario_id && temp.email !== copropietario.email) {
            await usuarioRepository.updateEmail(copropietario.usuario_id, temp.email);
        }

        return { ...temp, passwordTemporal };
    }

    async eliminarCopropietario(id) {
        const copropietario = await copropietarioRepository.findById(id);
        if (!copropietario) {
            throw new Error("El copropietario no existe.");
        }

        // El controller exige confirmación reforzada cuando existe historial.
        // El residente se elimina lógicamente para conservar la trazabilidad.
        if (copropietario.usuario_id) {
            await sessionRepository.invalidateUserSessions(copropietario.usuario_id);
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
            "Perfil": c.perfil || '',
            "Estado Usuario": c.estado_usuario || '',
            "Saldo Pendiente": c.saldo
        }));
        const ws = xlsx.utils.json_to_sheet(formatData);
        xlsx.utils.book_append_sheet(wb, ws, "Residentes");
        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    // Generar reporte en PDF del resumen de importación masiva (RF-2.1)
    generarPdfResumenImportacion(resumen) {
        return new Promise((resolve) => {
            const resultados = resumen.importados || [];
            const errores = resumen.errores || [];
            const advertencias = resumen.advertencias || [];
            const doc = new PDFDocument({ margin: 40 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.fillColor('#059669').fontSize(20).text('AliGest - Resumen de Importación de Copropietarios', { align: 'center' });
            doc.moveDown();
            doc.fillColor('#374151').fontSize(11).text(`Fecha de procesamiento: ${new Date().toLocaleString()}`);
            doc.text(`Total procesados: ${resumen.totalProcesados ?? resultados.length}`);
            doc.text(`Registros exitosos: ${resultados.length}`);
            doc.text(`Registros con errores: ${errores.length}`);
            doc.moveDown();

            doc.fontSize(12).fillColor('#111827').text('Credenciales temporales de acceso para residentes:', { underline: true });
            doc.moveDown(0.5);

            resultados.forEach((res, i) => {
                doc.fontSize(9).fillColor('#374151');
                doc.text(`${i+1}. Villa: ${res.casa} | Residente: ${res.nombre}`);
                doc.fillColor('#2563eb').text(`   Usuario de acceso: ${res.username} | Contraseña temporal: ${res.passwordTemporal}`);
                doc.moveDown(0.6);
            });

            if (errores.length > 0) {
                doc.addPage();
                doc.fontSize(12).fillColor('#b91c1c').text('Registros con errores:', { underline: true });
                doc.moveDown(0.5);
                errores.forEach(error => {
                    doc.fontSize(9).fillColor('#374151').text(`Fila ${error.fila}: ${error.mensaje}`);
                    doc.moveDown(0.4);
                });
            }

            if (advertencias.length > 0) {
                doc.moveDown();
                doc.fontSize(11).fillColor('#b45309').text('Advertencias:', { underline: true });
                advertencias.forEach(aviso => doc.fontSize(9).text(`• ${aviso}`));
            }

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

        const existeEmail = await usuarioRepository.findByEmail(copro.email);
        if (existeEmail) {
            throw new Error(`El correo electrónico ${copro.email} ya está registrado.`);
        }

        const username = copro.casa.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
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

        try {
            copro.id = await copropietarioRepository.create(copro);
        } catch (error) {
            await usuarioRepository.delete(createdUser.id);
            throw error;
        }

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
