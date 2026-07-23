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

// Paleta de marca compartida por los documentos PDF de esta capa (coherente
// con los colores corporativos usados en login.html / dashboard.html y con
// los mismos tonos usados en los PDF de pagos de PagoService).
const MARCA = {
    navy: '#0a3d62',
    green: '#2f7d3a',
    rose: '#b91c1c',
    roseLight: '#fee2e2',
    amber: '#b45309',
    amberLight: '#fef3c7',
    slate: '#334155',
    slateLight: '#f1f5f9',
    border: '#cbd5e1',
    muted: '#64748b'
};

function dibujarEncabezado(doc, titulo, subtitulo) {
    const width = doc.page.width;
    doc.rect(0, 0, width, 86).fill(MARCA.navy);
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('ALIGEST', 40, 24);
    doc.fontSize(9).font('Helvetica').fillColor('#cbd5e1').text('Condominio La Primavera · Gestión de Expensas', 40, 46);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#ffffff').text(titulo, 0, 24, { align: 'right', width: width - 40 });
    if (subtitulo) {
        doc.fontSize(9).font('Helvetica').fillColor('#cbd5e1').text(subtitulo, 0, 46, { align: 'right', width: width - 40 });
    }
    doc.fontSize(8).fillColor('#9fb8d6').text(`Generado: ${new Date().toLocaleString('es-EC')}`, 0, 62, { align: 'right', width: width - 40 });
    doc.fillColor(MARCA.slate).font('Helvetica');
    doc.y = 106;
}

// El pie se dibuja dentro del margen inferior reservado por PDFDocument, así
// que el margen se anula temporalmente: si no, PDFKit interpreta que el
// cursor quedó fuera del área imprimible y dispara una página nueva en
// cadena (bucle infinito).
function dibujarPiePagina(doc, nota = 'Documento generado automáticamente por AliGest. La información aquí contenida es confidencial.') {
    const margenOriginal = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const bottom = doc.page.height - 34;
    // PDFPage no expone un número de página propio; se calcula a partir del
    // buffer de páginas del documento (1-based).
    const { start, count } = doc.bufferedPageRange();
    const numeroPagina = start + count;
    doc.fontSize(7).fillColor('#94a3b8')
        .text(nota, 40, bottom, { width: doc.page.width - 160, align: 'left', lineBreak: false })
        .text(`Página ${numeroPagina}`, doc.page.width - 100, bottom, { width: 60, align: 'right', lineBreak: false });
    doc.fillColor(MARCA.slate);
    doc.page.margins.bottom = margenOriginal;
}

// Cierra la hoja actual con su pie, abre una nueva y vuelve a pintar la
// cabecera de la tabla. El pie se dibuja aquí explícitamente (nunca desde un
// listener de 'pageAdded') para que cada página reciba exactamente un pie.
function asegurarEspacio(doc, alturaFila, redibujarCabecera, notaPie) {
    const limite = doc.page.height - 60;
    if (doc.y + alturaFila > limite) {
        dibujarPiePagina(doc, notaPie);
        doc.addPage();
        doc.y = 40;
        if (redibujarCabecera) redibujarCabecera();
    }
}

// Mini tarjeta de estadística (usada en el resumen de importación masiva).
function dibujarTarjeta(doc, x, y, w, label, valor, color) {
    doc.roundedRect(x, y, w, 52, 6).fillAndStroke(MARCA.slateLight, MARCA.border);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(MARCA.muted).text(label.toUpperCase(), x + 12, y + 10, { width: w - 24 });
    doc.fontSize(18).font('Helvetica-Bold').fillColor(color || MARCA.navy).text(String(valor), x + 12, y + 24, { width: w - 24 });
    doc.font('Helvetica').fillColor(MARCA.slate);
}

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
            const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const dibujarCabeceraTabla = () => {
                // doc.text() avanza doc.y en cada llamada: se fija la fila en una
                // variable antes de escribir las columnas para que no se "escalonen".
                const filaY = doc.y;
                doc.rect(40, filaY, 700, 24).fill(MARCA.slateLight);
                doc.fontSize(9).font('Helvetica-Bold').fillColor(MARCA.navy);
                doc.text('CASA', 50, filaY + 7, { width: 60 });
                doc.text('RESIDENTE', 120, filaY + 7, { width: 170 });
                doc.text('CÉDULA', 300, filaY + 7, { width: 90 });
                doc.text('TELÉFONO', 400, filaY + 7, { width: 100 });
                doc.text('PERFIL', 510, filaY + 7, { width: 90 });
                doc.text('SALDO', 610, filaY + 7, { width: 110, align: 'right' });
                doc.y = filaY + 24;
                doc.font('Helvetica').fillColor(MARCA.slate);
            };

            dibujarEncabezado(doc, 'Nómina de Residentes', `${lista.length} copropietario(s) registrado(s)`);
            dibujarCabeceraTabla();

            if (lista.length === 0) {
                doc.moveDown(2);
                doc.fontSize(11).fillColor(MARCA.muted).text('No se encontraron residentes con los criterios seleccionados.', { align: 'center' });
            }

            lista.forEach((c, i) => {
                asegurarEspacio(doc, 22, dibujarCabeceraTabla);
                const rowY = doc.y;
                if (i % 2 === 0) doc.rect(40, rowY, 700, 22).fill('#f8fafc');
                const saldo = parseFloat(c.saldo || 0);
                doc.fillColor(MARCA.slate).fontSize(9).font('Helvetica-Bold');
                doc.text(c.casa, 50, rowY + 6, { width: 60 });
                doc.font('Helvetica').text(String(c.nombre || '').substring(0, 32), 120, rowY + 6, { width: 170 });
                doc.text(c.cedula, 300, rowY + 6, { width: 90 });
                doc.text(c.telefono, 400, rowY + 6, { width: 100 });
                doc.fillColor(MARCA.muted).fontSize(8).text(c.perfil || 'N/A', 510, rowY + 7, { width: 90 });
                doc.font('Helvetica-Bold').fontSize(9).fillColor(saldo > 0 ? MARCA.rose : MARCA.green)
                    .text(`$${saldo.toFixed(2)}`, 610, rowY + 6, { width: 110, align: 'right' });
                doc.y = rowY + 22;
            });

            const totalDeuda = lista.reduce((acc, c) => acc + Math.max(0, parseFloat(c.saldo || 0)), 0);
            asegurarEspacio(doc, 30, dibujarCabeceraTabla);
            doc.moveDown(0.4);
            doc.strokeColor(MARCA.border).lineWidth(1).moveTo(40, doc.y).lineTo(740, doc.y).stroke();
            doc.moveDown(0.4);
            doc.font('Helvetica-Bold').fontSize(10).fillColor(MARCA.navy)
                .text(`Deuda total pendiente: $${totalDeuda.toFixed(2)}`, 40, doc.y, { width: 700, align: 'right' });

            dibujarPiePagina(doc);
            doc.end();
        });
    }

    // Generar archivo Excel con la lista de residentes
    generarExcelLista(lista) {
        const wb = xlsx.utils.book_new();
        const fecha = new Date().toLocaleString('es-EC');

        // Fila de título + fecha de generación por encima de la cabecera de datos,
        // con las celdas fusionadas para que se lea como un encabezado de reporte.
        const encabezado = [
            ['ALIGEST · Nómina Oficial de Residentes - Condominio La Primavera'],
            [`Generado: ${fecha}  |  Total de registros: ${lista.length}`],
            []
        ];
        const columnas = ['Cédula', 'Residente', 'Villa / Casa', 'Celular', 'Correo', 'Perfil', 'Estado Usuario', 'Saldo Pendiente'];
        const filas = lista.map(c => [
            c.cedula, c.nombre, c.casa, c.telefono, c.email, c.perfil || '', c.estado_usuario || '', parseFloat(c.saldo || 0)
        ]);

        const ws = xlsx.utils.aoa_to_sheet([...encabezado, columnas, ...filas]);
        const filaCabecera = encabezado.length; // índice 0-based de la fila con los títulos de columna
        const primeraFilaDatos = filaCabecera + 1;

        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: columnas.length - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: columnas.length - 1 } }
        ];
        ws['!cols'] = [
            { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 16 }
        ];
        ws['!autofilter'] = { ref: xlsx.utils.encode_range({ s: { r: filaCabecera, c: 0 }, e: { r: filaCabecera + filas.length, c: columnas.length - 1 } }) };

        // Formato de moneda en la columna de saldo.
        for (let r = 0; r < filas.length; r++) {
            const cellRef = xlsx.utils.encode_cell({ r: primeraFilaDatos + r, c: columnas.length - 1 });
            if (ws[cellRef]) ws[cellRef].z = '"$"#,##0.00';
        }

        xlsx.utils.book_append_sheet(wb, ws, 'Residentes');
        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    // Generar reporte en PDF del resumen de importación masiva (RF-2.1)
    generarPdfResumenImportacion(resumen) {
        return new Promise((resolve) => {
            const resultados = resumen.importados || [];
            const errores = resumen.errores || [];
            const advertencias = resumen.advertencias || [];
            const doc = new PDFDocument({ margin: 40 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            dibujarEncabezado(doc, 'Resumen de Importación Masiva', 'Copropietarios cargados desde Excel');

            // Tarjetas de estadísticas rápidas
            const cardY = doc.y;
            dibujarTarjeta(doc, 40, cardY, 165, 'Total procesados', resumen.totalProcesados ?? resultados.length, MARCA.navy);
            dibujarTarjeta(doc, 215, cardY, 165, 'Registros exitosos', resultados.length, MARCA.green);
            dibujarTarjeta(doc, 390, cardY, 165, 'Con errores', errores.length, errores.length > 0 ? MARCA.rose : MARCA.slate);
            doc.y = cardY + 68;

            doc.font('Helvetica-Bold').fontSize(11).fillColor(MARCA.navy).text('Credenciales Temporales de Acceso');
            doc.moveDown(0.3);
            doc.fontSize(8).font('Helvetica').fillColor(MARCA.muted)
                .text('Cada residente debe cambiar esta contraseña temporal en su primer inicio de sesión.');
            doc.moveDown(0.5);

            const dibujarCabeceraCredenciales = () => {
                const filaY = doc.y;
                doc.rect(40, filaY, 515, 20).fill(MARCA.slateLight);
                doc.fontSize(8).font('Helvetica-Bold').fillColor(MARCA.navy);
                doc.text('VILLA', 48, filaY + 6, { width: 60 });
                doc.text('RESIDENTE', 110, filaY + 6, { width: 160 });
                doc.text('USUARIO', 280, filaY + 6, { width: 100 });
                doc.text('CONTRASEÑA TEMPORAL', 390, filaY + 6, { width: 150 });
                doc.y = filaY + 20;
                doc.font('Helvetica').fillColor(MARCA.slate);
            };

            if (resultados.length === 0) {
                doc.fontSize(9).fillColor(MARCA.muted).text('No se generaron cuentas nuevas en este proceso.');
            } else {
                dibujarCabeceraCredenciales();
                resultados.forEach((res, i) => {
                    asegurarEspacio(doc, 20, dibujarCabeceraCredenciales);
                    const rowY = doc.y;
                    if (i % 2 === 0) doc.rect(40, rowY, 515, 20).fill('#f8fafc');
                    doc.fillColor(MARCA.slate).fontSize(8.5).font('Helvetica-Bold');
                    doc.text(res.casa, 48, rowY + 6, { width: 60 });
                    doc.font('Helvetica').text(String(res.nombre || '').substring(0, 28), 110, rowY + 6, { width: 160 });
                    doc.fillColor(MARCA.navy).text(res.username, 280, rowY + 6, { width: 100 });
                    doc.font('Helvetica-Bold').fillColor(MARCA.green).text(res.passwordTemporal, 390, rowY + 6, { width: 150 });
                    doc.y = rowY + 20;
                });
            }

            if (errores.length > 0) {
                doc.moveDown(1);
                doc.font('Helvetica-Bold').fontSize(11).fillColor(MARCA.rose).text('Registros con Errores');
                doc.moveDown(0.4);
                errores.forEach(error => {
                    asegurarEspacio(doc, 18);
                    doc.roundedRect(40, doc.y, 515, 16, 3).fill(MARCA.roseLight);
                    doc.fontSize(8).font('Helvetica').fillColor(MARCA.rose)
                        .text(`Fila ${error.fila}: ${error.mensaje}`, 48, doc.y + 4, { width: 500 });
                    doc.y += 20;
                });
            }

            if (advertencias.length > 0) {
                doc.moveDown(0.6);
                doc.font('Helvetica-Bold').fontSize(11).fillColor(MARCA.amber).text('Advertencias');
                doc.moveDown(0.4);
                advertencias.forEach(aviso => {
                    asegurarEspacio(doc, 16);
                    doc.roundedRect(40, doc.y, 515, 16, 3).fill(MARCA.amberLight);
                    doc.fontSize(8).font('Helvetica').fillColor(MARCA.amber)
                        .text(`• ${aviso}`, 48, doc.y + 4, { width: 500 });
                    doc.y += 20;
                });
            }

            dibujarPiePagina(doc);
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
