const PDFDocument = require('pdfkit');
const pagoRepository = require('../../../data/repositories/pagoRepository');
const copropietarioRepository = require('../../../data/repositories/copropietarioRepository');
const { CalculadorMoraContext, EcuandorianMora12Strategy } = require('../patterns/moraStrategy');
const notificationService = require('./NotificationService');
const Pago = require('../../domain/models/Pago');

// Paleta de marca compartida por todos los documentos PDF generados (coherente
// con los colores corporativos usados en login.html / dashboard.html).
const MARCA = {
    navy: '#0a3d62',
    navyDark: '#072a44',
    green: '#2f7d3a',
    greenLight: '#e8f5e9',
    amber: '#b45309',
    amberLight: '#fef3c7',
    rose: '#b91c1c',
    roseLight: '#fee2e2',
    slate: '#334155',
    slateLight: '#f1f5f9',
    border: '#cbd5e1',
    muted: '#64748b'
};

// Franja de encabezado corporativa reutilizada en todos los PDF de pagos.
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

// Pie de página con numeración, repetido en cada hoja del documento. El pie se
// dibuja dentro del margen inferior reservado por PDFDocument, así que el
// margen se anula temporalmente: si no, PDFKit interpreta que el cursor quedó
// fuera del área imprimible y dispara una página nueva en cadena (bucle infinito).
function dibujarPiePagina(doc, nota = 'Documento generado automáticamente por AliGest. La información financiera aquí contenida es confidencial.') {
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

// Etiqueta de estado con color acorde (Aprobado/Pendiente/Rechazado).
function colorEstado(estado) {
    if (estado === 'APROBADO') return { bg: MARCA.greenLight, fg: MARCA.green };
    if (estado === 'RECHAZADO') return { bg: MARCA.roseLight, fg: MARCA.rose };
    return { bg: MARCA.amberLight, fg: MARCA.amber };
}

function dibujarPildora(doc, texto, x, y, opts = {}) {
    const { bg, fg } = colorEstado(opts.estado || texto);
    const width = opts.width || (doc.widthOfString(texto, { fontSize: 8 }) + 16);
    doc.roundedRect(x, y - 2, width, 14, 6).fill(bg);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(fg).text(texto, x, y + 1, { width, align: 'center' });
    doc.font('Helvetica').fillColor(MARCA.slate);
}

// Verifica si queda espacio para otra fila antes del pie de página; si no,
// cierra la hoja actual con su pie, abre una nueva y vuelve a pintar la
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

// RF-3.3/RF-3.4: la expensa de un período vence el día 5 del mes siguiente
function calcularVencimientoExpensa(periodo) {
    const [anioStr, mesStr] = periodo.split('-');
    let anio = parseInt(anioStr, 10);
    let mes = parseInt(mesStr, 10) + 1; // mes (1-12) del período + 1 = mes siguiente
    if (mes > 12) {
        mes = 1;
        anio += 1;
    }
    return `${anio}-${String(mes).padStart(2, '0')}-05`;
}

class PagoService {
    // Listar pagos pendientes de validación administrativa
    async obtenerPagosPendientes() {
        return await pagoRepository.getPagosPendientes();
    }

    async obtenerRegistroNotificaciones() {
        return await pagoRepository.getNotificaciones();
    }

    async obtenerDetalleValidacion(pagoId, fechaReferencia = new Date()) {
        const pago = await pagoRepository.findPagoById(pagoId);
        if (!pago) throw new Error("El registro de pago no existe.");

        const copropietario = await copropietarioRepository.findById(pago.copropietario_id);
        if (!copropietario) throw new Error("Copropietario no encontrado.");

        const deudas = await pagoRepository.getDeudasAntiguas(copropietario.id);
        const calculadora = new CalculadorMoraContext(new EcuandorianMora12Strategy());
        let restante = pago.monto_pagado;
        let totalPendiente = 0;
        let totalRecargosNuevos = 0;

        const desglose = deudas.map((deuda) => {
            const fechaVencimiento = new Date(`${deuda.fecha_vencimiento}T23:59:59`);
            const diasRetraso = fechaReferencia > fechaVencimiento
                ? Math.ceil((fechaReferencia - fechaVencimiento) / (1000 * 60 * 60 * 24))
                : 0;
            const recargoNuevo = diasRetraso > 0 && !deuda.mora_aplicada
                ? calculadora.calcular(deuda.monto, diasRetraso)
                : 0;
            const pendienteConMora = parseFloat((deuda.monto + recargoNuevo).toFixed(2));
            const aplicado = parseFloat(Math.min(restante, pendienteConMora).toFixed(2));
            restante = parseFloat(Math.max(0, restante - aplicado).toFixed(2));
            totalPendiente += pendienteConMora;
            totalRecargosNuevos += recargoNuevo;

            return {
                deudaId: deuda.id,
                periodo: deuda.mes,
                fechaVencimiento: deuda.fecha_vencimiento,
                montoPendiente: deuda.monto,
                vencida: diasRetraso > 0,
                moraAplicadaPreviamente: Boolean(deuda.mora_aplicada),
                recargo12: recargoNuevo || deuda.recargo_mora || 0,
                recargoNuevo,
                totalConMora: pendienteConMora,
                aplicacionPropuesta: aplicado,
                saldoPosterior: parseFloat((pendienteConMora - aplicado).toFixed(2))
            };
        });

        return {
            pago,
            copropietario: {
                id: copropietario.id,
                nombre: copropietario.nombre,
                casa: copropietario.casa,
                saldoActual: copropietario.saldo
            },
            deudas: desglose,
            totalDeudaConMora: parseFloat(totalPendiente.toFixed(2)),
            totalRecargosNuevos: parseFloat(totalRecargosNuevos.toFixed(2)),
            saldoCuentaProyectado: parseFloat((copropietario.saldo + totalRecargosNuevos - pago.monto_pagado).toFixed(2)),
            sobrepagoProyectado: parseFloat(restante.toFixed(2))
        };
    }

    // RF-3.3/RF-3.4: Generar la expensa (deuda) mensual de un período para todos los
    // copropietarios activos, sin duplicar el período si ya fue generado previamente.
    async generarExpensasMensuales(periodo, montoBase) {
        if (!periodo || !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
            throw new Error("El período debe tener el formato YYYY-MM.");
        }

        const monto = parseFloat(montoBase);
        if (isNaN(monto) || monto <= 0) {
            throw new Error("El monto de la expensa mensual debe ser un número positivo.");
        }

        const fechaVencimiento = calcularVencimientoExpensa(periodo);
        const copropietarios = await copropietarioRepository.findAll();

        let generadas = 0;
        let omitidas = 0;

        for (const copro of copropietarios) {
            const existente = await pagoRepository.findDeudaPorPeriodo(copro.id, periodo);
            if (existente) {
                omitidas++;
                continue;
            }
            const deudaId = await pagoRepository.createDeuda(copro.id, periodo, monto, 'PENDIENTE', fechaVencimiento);
            try {
                await copropietarioRepository.update(copro.cedula, {
                    nombre: copro.nombre,
                    casa: copro.casa,
                    telefono: copro.telefono,
                    email: copro.email,
                    saldo: parseFloat((copro.saldo + monto).toFixed(2))
                });
            } catch (error) {
                // La expensa y el saldo constituyen una sola operación contable.
                await pagoRepository.deleteDeuda(deudaId);
                throw error;
            }
            generadas++;
        }

        return {
            mensaje: `Expensas del período ${periodo} generadas correctamente.`,
            periodo,
            montoBase: monto,
            fechaVencimiento,
            generadas,
            omitidas,
            totalCopropietarios: copropietarios.length
        };
    }

    // Listar pagos de un copropietario por su usuario ID
    async obtenerPagosCopropietario(usuarioId) {
        const copro = await copropietarioRepository.findByUsuarioId(usuarioId);
        if (!copro) return [];
        return await pagoRepository.getPagosByCopropietario(copro.id);
    }

    // Listar deudas de un copropietario por su usuario ID
    async obtenerDeudasCopropietario(usuarioId) {
        const copro = await copropietarioRepository.findByUsuarioId(usuarioId);
        if (!copro) return [];
        return await pagoRepository.getDeudasByCopropietario(copro.id);
    }

    // Copropietario reporta un depósito/transferencia
    async reportarPagoCopropietario(usuarioId, comprobanteId, monto, metodo, periodo, comprobanteImg, fechaPago = null) {
        const copro = await copropietarioRepository.findByUsuarioId(usuarioId);
        if (!copro) {
            throw new Error("No se encontró el registro de copropietario para el usuario actual.");
        }

        const pagoEntidad = new Pago({ 
            copropietarioId: copro.id, 
            monto, 
            comprobanteId, 
            metodo, 
            periodo,
            comprobanteImg,
            fechaPago
        });

        if (!pagoEntidad.esMontoValido()) {
            throw new Error("El monto reportado debe ser un número positivo.");
        }
        if (!pagoEntidad.comprobanteId) throw new Error("La referencia bancaria es obligatoria.");
        if (await pagoRepository.findPagoByComprobanteId(pagoEntidad.comprobanteId)) {
            throw new Error("La referencia bancaria ya fue registrada anteriormente. Verifique el comprobante.");
        }
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(pagoEntidad.periodo)) throw new Error("El período debe tener formato YYYY-MM.");
        if (!['TRANSFERENCIA', 'DEPÓSITO'].includes(pagoEntidad.metodo)) throw new Error("El método de pago no es válido.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(pagoEntidad.fechaPago)) throw new Error("La fecha de pago es obligatoria y debe tener formato válido.");
        if (!pagoEntidad.comprobanteImg) throw new Error("Debe adjuntar la foto del comprobante bancario.");

        // Registrar el pago en estado inicial PENDIENTE_VALIDACION (REQ011)
        const solicitudId = await pagoRepository.registrarPagoInmutable(
            pagoEntidad.comprobanteId,
            pagoEntidad.copropietarioId,
            pagoEntidad.monto,
            'PENDIENTE_VALIDACION',
            null, // Aún sin recibo digital
            pagoEntidad.metodo,
            pagoEntidad.periodo,
            pagoEntidad.comprobanteImg,
            pagoEntidad.fechaPago
        );

        return {
            mensaje: `Pago enviado correctamente. Número de solicitud: ${solicitudId}. Recibirá notificación cuando sea validado por el Administrador.`,
            solicitudId
        };
    }

    // Administrador aprueba el pago aplicando amortización FIFO (REQ012)
    async validarAprobarPago(pagoId, fechaReferencia = new Date(), intento = 1) {
        const pagoRaw = await pagoRepository.findPagoById(pagoId);
        if (!pagoRaw) {
            throw new Error("El registro de pago no existe.");
        }
        if (pagoRaw.estado !== 'PENDIENTE_VALIDACION') {
            throw new Error("Este pago ya ha sido procesado previamente.");
        }

        const copropietario = await copropietarioRepository.findById(pagoRaw.copropietario_id);
        if (!copropietario) {
            throw new Error("Copropietario no encontrado.");
        }

        const reservado = await pagoRepository.reservarPagoPendiente(pagoId);
        if (!reservado) {
            throw new Error("Este pago ya está siendo procesado o fue validado previamente.");
        }

        // Generar recibo de pago formal inmutable (RF-3.4)
        const pagoEntidad = new Pago(pagoRaw);
        const siguienteSecuencia = await pagoRepository.getSiguienteSecuenciaPago();
        const reciboId = pagoEntidad.generarComprobanteDigitalID(copropietario.casa, siguienteSecuencia);

        // Amortización cronológica FIFO. El recargo fijo del 12% se persiste
        // una sola vez por período para que nunca vuelva a capitalizarse.
        const deudas = await pagoRepository.getDeudasAntiguas(copropietario.id);
        let montoRestante = pagoRaw.monto_pagado;
        let totalRecargosNuevos = 0;
        const aplicaciones = [];
        const calculadora = new CalculadorMoraContext(new EcuandorianMora12Strategy());
        const hoy = fechaReferencia;
        let saldoActualizado;

        try {
            for (const de of deudas) {
                const fechaVenc = new Date(`${de.fecha_vencimiento}T23:59:59`);
                const diasRetraso = hoy > fechaVenc
                    ? Math.ceil((hoy - fechaVenc) / (1000 * 60 * 60 * 24))
                    : 0;
                const recargoNuevo = diasRetraso > 0 && !de.mora_aplicada
                    ? calculadora.calcular(de.monto, diasRetraso)
                    : 0;
                totalRecargosNuevos += recargoNuevo;

                const totalPendiente = parseFloat((de.monto + recargoNuevo).toFixed(2));
                const aplicado = Math.min(montoRestante, totalPendiente);
                montoRestante = parseFloat(Math.max(0, montoRestante - aplicado).toFixed(2));
                const nuevoMonto = parseFloat(Math.max(0, totalPendiente - aplicado).toFixed(2));
                const nuevoEstado = nuevoMonto === 0 ? 'PAGADO' : 'PENDIENTE';

                aplicaciones.push({
                    periodo: de.mes,
                    monto_pendiente: de.monto,
                    recargo_mora: recargoNuevo,
                    monto_aplicado: parseFloat(aplicado.toFixed(2)),
                    saldo_posterior: nuevoMonto
                });

                await pagoRepository.updateDeuda(
                    de.id,
                    nuevoEstado,
                    nuevoMonto,
                    de.mora_aplicada || recargoNuevo > 0,
                    de.recargo_mora || recargoNuevo
                );
            }

            saldoActualizado = copropietario.saldo + totalRecargosNuevos - pagoRaw.monto_pagado;
            await copropietarioRepository.update(copropietario.cedula, {
                nombre: copropietario.nombre,
                casa: copropietario.casa,
                telefono: copropietario.telefono,
                email: copropietario.email,
                saldo: parseFloat(saldoActualizado.toFixed(2))
            });

            await pagoRepository.updatePagoEstado(pagoId, 'APROBADO', reciboId, null, {
                sobrepago: montoRestante,
                recargoMoraTotal: totalRecargosNuevos,
                aplicaciones
            });
            const reciboPdf = await this.generarPdfRecibo(reciboId);
            await pagoRepository.updateReciboPdf(pagoId, reciboPdf);
        } catch (error) {
            // RNF-02: reversión compensatoria de cada paso de la operación compuesta.
            for (const original of deudas) {
                try {
                    await pagoRepository.updateDeuda(original.id, original.estado, original.monto, original.mora_aplicada, original.recargo_mora);
                } catch { /* conservar el error original */ }
            }
            try {
                await copropietarioRepository.update(copropietario.cedula, {
                    nombre: copropietario.nombre,
                    casa: copropietario.casa,
                    telefono: copropietario.telefono,
                    email: copropietario.email,
                    saldo: copropietario.saldo
                });
                await pagoRepository.updatePagoEstado(pagoId, 'PENDIENTE_VALIDACION', null, null, {
                    sobrepago: 0, recargoMoraTotal: 0, aplicaciones: []
                });
                await pagoRepository.updateReciboPdf(pagoId, null);
            } catch { /* conservar el error original */ }
            if (intento < 3) {
                return this.validarAprobarPago(pagoId, fechaReferencia, intento + 1);
            }
            throw new Error(`Error al procesar el comprobante. Se revirtieron los cambios: ${error.message}`);
        }

        // Despachar alerta de WhatsApp
        await notificationService.enviarNotificacionPago(
            copropietario.telefono,
            reciboId,
            pagoRaw.monto_pagado,
            saldoActualizado
        );
        if (totalRecargosNuevos > 0) {
            await notificationService.enviarNotificacionMora(
                copropietario.telefono,
                copropietario.nombre,
                copropietario.casa,
                totalRecargosNuevos
            );
        }

        return {
            comprobante_id: reciboId,
            referencia_bancaria: pagoRaw.comprobante_id,
            monto_aplicado: pagoRaw.monto_pagado,
            sobrepago: parseFloat(montoRestante.toFixed(2)),
            recargo_mora_aplicado: parseFloat(totalRecargosNuevos.toFixed(2)),
            estado_transaccion: 'APROBADO_E_INMUTABLE'
        };
    }

    // Administrador rechaza el pago
    async validarRechazarPago(pagoId, motivo) {
        if (!motivo || motivo.trim() === "") {
            throw new Error("Debe ingresar un motivo para rechazar el pago.");
        }

        const pagoRaw = await pagoRepository.findPagoById(pagoId);
        if (!pagoRaw) {
            throw new Error("El registro de pago no existe.");
        }
        if (pagoRaw.estado !== 'PENDIENTE_VALIDACION') {
            throw new Error("Este pago ya ha sido procesado.");
        }

        const copropietario = await copropietarioRepository.findById(pagoRaw.copropietario_id);
        if (!copropietario) {
            throw new Error("Copropietario no encontrado.");
        }

        const rechazado = await pagoRepository.rechazarPagoPendiente(pagoId, motivo);
        if (!rechazado) {
            throw new Error("Este pago ya está siendo procesado o fue validado previamente.");
        }

        await notificationService.enviarNotificacionRechazo(
            copropietario.telefono,
            pagoRaw.comprobante_id,
            pagoRaw.monto_pagado,
            motivo
        );

        return { mensaje: "El pago fue rechazado y notificado al residente." };
    }

    async obtenerReportePagos(filtros, userContext) {
        if (filtros.fechaInicio && filtros.fechaFin && new Date(filtros.fechaInicio) > new Date(filtros.fechaFin)) {
            throw new Error("Rango de fechas inválido. La fecha inicial debe ser menor o igual a la fecha final.");
        }
        if (filtros.periodo && !/^\d{4}-(0[1-9]|1[0-2])$/.test(filtros.periodo)) {
            throw new Error("El período del reporte debe tener formato YYYY-MM.");
        }
        if (filtros.estado && !['PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO'].includes(filtros.estado)) {
            throw new Error("El estado solicitado no es válido.");
        }
        const role = userContext?.role;
        let copropietarioId = null;

        if (role === 'COPROPIETARIO') {
            const copro = await copropietarioRepository.findByUsuarioId(userContext.id);
            if (!copro) {
                return [];
            }
            copropietarioId = copro.id;
        }

        return await pagoRepository.getReportePagos({
            fechaInicio: filtros.fechaInicio || null,
            fechaFin: filtros.fechaFin || null,
            periodo: filtros.periodo || null,
            estado: filtros.estado || null,
            copropietarioId
        });
    }

    async generarPdfReportePagos(filtros, userContext) {
        const listado = await this.obtenerReportePagos(filtros, userContext);

        return new Promise((resolve) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const cols = [
                { key: 'copropietario_nombre', label: 'Residente', x: 40, w: 130 },
                { key: 'copropietario_casa', label: 'Villa', x: 170, w: 60 },
                { key: 'comprobante_id', label: 'Referencia', x: 230, w: 110 },
                { key: 'periodo', label: 'Periodo', x: 340, w: 60 },
                { key: 'fecha', label: 'Fecha', x: 400, w: 90 },
                { key: 'monto', label: 'Monto', x: 490, w: 80, align: 'right' },
                { key: 'estado', label: 'Estado', x: 590, w: 100 }
            ];

            const dibujarCabeceraTabla = () => {
                // doc.text() avanza doc.y en cada llamada: se fija la fila en una
                // variable antes del forEach para que las columnas queden alineadas
                // en vez de "escalonarse" hacia abajo una tras otra.
                const filaY = doc.y;
                doc.rect(40, filaY, 660, 24).fill(MARCA.slateLight);
                doc.fontSize(9).font('Helvetica-Bold').fillColor(MARCA.navy);
                cols.forEach(c => doc.text(c.label, c.x, filaY + 7, { width: c.w, align: c.align || 'left' }));
                doc.y = filaY + 24;
                doc.font('Helvetica').fillColor(MARCA.slate);
            };

            dibujarEncabezado(doc, 'Reporte Financiero de Pagos', `${listado.length} registro(s) encontrado(s)`);

            if (userContext?.role) {
                doc.fontSize(8).fillColor(MARCA.muted).text(
                    `Ámbito: ${userContext.role === 'ADMINISTRADOR' ? 'Todos los residentes' : 'Mis pagos únicamente'}`,
                    40, doc.y
                );
                doc.moveDown(0.8);
            }

            if (listado.length === 0) {
                doc.moveDown(2);
                doc.fontSize(11).fillColor(MARCA.muted).text('No se encontraron pagos con los filtros seleccionados.', { align: 'center' });
                dibujarPiePagina(doc);
                doc.end();
                return;
            }

            dibujarCabeceraTabla();

            listado.forEach((row, i) => {
                asegurarEspacio(doc, 22, dibujarCabeceraTabla);
                const rowY = doc.y;
                if (i % 2 === 0) doc.rect(40, rowY, 660, 22).fill('#f8fafc');
                doc.fillColor(MARCA.slate).fontSize(8).font('Helvetica');
                doc.text(String(row.copropietario_nombre || '').substring(0, 22), 40, rowY + 6, { width: 130 });
                doc.text(String(row.copropietario_casa || ''), 170, rowY + 6, { width: 60 });
                doc.text(String(row.comprobante_id || ''), 230, rowY + 6, { width: 110 });
                doc.text(String(row.periodo || 'N/A'), 340, rowY + 6, { width: 60 });
                doc.text(row.fecha_pago || new Date(row.fecha_registro).toLocaleDateString(), 400, rowY + 6, { width: 90 });
                doc.font('Helvetica-Bold').text(`$${parseFloat(row.monto_pagado).toFixed(2)}`, 490, rowY + 6, { width: 80, align: 'right' });
                doc.font('Helvetica');
                dibujarPildora(doc, row.estado === 'PENDIENTE_VALIDACION' ? 'PENDIENTE' : String(row.estado || ''), 590, rowY + 5, { estado: row.estado, width: 90 });
                doc.y = rowY + 22;
            });

            const total = listado.reduce((acc, r) => acc + parseFloat(r.monto_pagado || 0), 0);
            asegurarEspacio(doc, 30, dibujarCabeceraTabla);
            doc.moveDown(0.4);
            doc.strokeColor(MARCA.border).lineWidth(1).moveTo(40, doc.y).lineTo(700, doc.y).stroke();
            doc.moveDown(0.4);
            doc.font('Helvetica-Bold').fontSize(10).fillColor(MARCA.navy)
                .text(`Total del reporte: $${total.toFixed(2)}`, 40, doc.y, { width: 660, align: 'right' });

            dibujarPiePagina(doc);
            doc.end();
        });
    }

    // Generar archivo PDF con la factura formal
    generarPdfRecibo(reciboId, userContext = null) {
        return new Promise(async (resolve, reject) => {
            try {
                const pago = await pagoRepository.findPagoByReciboId(reciboId);
                if (!pago) {
                    return reject(new Error("Recibo de pago no encontrado."));
                }

                if (userContext?.role === 'COPROPIETARIO') {
                    const copro = await copropietarioRepository.findByUsuarioId(userContext.id);
                    if (!copro || String(copro.id) !== String(pago.copropietario_id)) {
                        const error = new Error("No tiene permiso para descargar el recibo de otro copropietario.");
                        error.statusCode = 403;
                        return reject(error);
                    }
                }

                // El PDF aprobado se conserva en base de datos y se entrega sin
                // regenerarlo, manteniendo inmutable el documento histórico.
                if (pago.recibo_pdf && pago.recibo_pdf.length > 0) {
                    return resolve(Buffer.from(pago.recibo_pdf));
                }

                const doc = new PDFDocument({ margin: 40 });
                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                doc.on('error', reject);

                dibujarEncabezado(doc, 'Recibo Digital de Pago', 'Documento inmutable de amortización');

                // Franja con el código de recibo y estado, a modo de "ticket".
                const ticketY = doc.y;
                doc.roundedRect(40, ticketY, 515, 40, 6).fill(MARCA.slateLight);
                doc.fontSize(8).fillColor(MARCA.muted).text('CÓDIGO DE RECIBO', 54, ticketY + 8);
                doc.fontSize(14).font('Helvetica-Bold').fillColor(MARCA.navy).text(pago.recibo_id, 54, ticketY + 20);
                doc.font('Helvetica');
                dibujarPildora(doc, pago.estado, 470, ticketY + 13, { estado: pago.estado, width: 75 });
                doc.y = ticketY + 40;
                doc.moveDown(1.4);

                // --- Sección: detalle del comprobante bancario ---
                doc.fontSize(11).font('Helvetica-Bold').fillColor(MARCA.navy).text('Detalle del Comprobante');
                doc.moveDown(0.4);
                doc.strokeColor(MARCA.border).lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(10).fillColor(MARCA.slate);
                const filaInfo = (label, valor, x = 40) => {
                    doc.font('Helvetica-Bold').fillColor(MARCA.muted).fontSize(8).text(label.toUpperCase(), x, doc.y);
                    doc.font('Helvetica').fillColor(MARCA.slate).fontSize(10).text(valor ?? 'N/A', x, doc.y + 1);
                };
                let yBase = doc.y;
                filaInfo('Fecha de registro', new Date(pago.fecha_registro).toLocaleString('es-EC'));
                doc.y = yBase; filaInfo('Referencia bancaria', pago.comprobante_id, 300);
                doc.moveDown(1.3);
                yBase = doc.y;
                filaInfo('Método de pago', pago.metodo);
                doc.y = yBase; filaInfo('Período declarado', pago.periodo || 'N/A', 300);
                doc.moveDown(1.6);

                // --- Sección: datos del residente ---
                doc.font('Helvetica-Bold').fontSize(11).fillColor(MARCA.navy).text('Datos del Residente');
                doc.moveDown(0.4);
                doc.strokeColor(MARCA.border).lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
                doc.moveDown(0.5);
                yBase = doc.y;
                filaInfo('Nombre completo', pago.copropietario_nombre);
                doc.y = yBase; filaInfo('Cédula', pago.copropietario_cedula, 300);
                doc.moveDown(1.3);
                yBase = doc.y;
                filaInfo('Villa / Casa', pago.copropietario_casa);
                doc.y = yBase; filaInfo('Celular', pago.copropietario_telefono, 300);
                doc.moveDown(1.6);

                // --- Sección: liquidación FIFO ---
                doc.font('Helvetica-Bold').fontSize(11).fillColor(MARCA.navy).text('Detalle de Liquidación (Aplicación FIFO)');
                doc.moveDown(0.4);
                doc.strokeColor(MARCA.border).lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
                doc.moveDown(0.5);

                if (pago.aplicaciones && pago.aplicaciones.length > 0) {
                    const cabeceraY = doc.y;
                    doc.rect(40, cabeceraY, 515, 20).fill(MARCA.slateLight);
                    doc.fontSize(8).font('Helvetica-Bold').fillColor(MARCA.navy);
                    doc.text('Período', 48, cabeceraY + 6, { width: 70 });
                    doc.text('Pendiente', 118, cabeceraY + 6, { width: 80, align: 'right' });
                    doc.text('Mora 12%', 200, cabeceraY + 6, { width: 80, align: 'right' });
                    doc.text('Aplicado', 300, cabeceraY + 6, { width: 90, align: 'right' });
                    doc.text('Saldo posterior', 400, cabeceraY + 6, { width: 140, align: 'right' });
                    doc.y = cabeceraY + 20;
                    doc.font('Helvetica').fillColor(MARCA.slate);

                    pago.aplicaciones.forEach((aplicacion, i) => {
                        const rowY = doc.y;
                        if (i % 2 === 0) doc.rect(40, rowY, 515, 18).fill('#f8fafc');
                        doc.fillColor(MARCA.slate).fontSize(8.5);
                        doc.text(aplicacion.periodo, 48, rowY + 5, { width: 70 });
                        doc.text(`$${parseFloat(aplicacion.monto_pendiente).toFixed(2)}`, 118, rowY + 5, { width: 80, align: 'right' });
                        doc.text(`$${parseFloat(aplicacion.recargo_mora || 0).toFixed(2)}`, 200, rowY + 5, { width: 80, align: 'right' });
                        doc.font('Helvetica-Bold').text(`$${parseFloat(aplicacion.monto_aplicado).toFixed(2)}`, 300, rowY + 5, { width: 90, align: 'right' });
                        doc.font('Helvetica').text(`$${parseFloat(aplicacion.saldo_posterior).toFixed(2)}`, 400, rowY + 5, { width: 140, align: 'right' });
                        doc.y = rowY + 18;
                    });
                    doc.moveDown(0.8);
                } else {
                    doc.fontSize(9).fillColor(MARCA.muted).text('No se aplicó el pago contra deudas registradas.');
                    doc.moveDown(0.8);
                }

                // --- Resumen financiero destacado ---
                const resumenY = doc.y;
                doc.roundedRect(40, resumenY, 515, 74, 6).fillAndStroke(MARCA.slateLight, MARCA.border);
                doc.fontSize(8).font('Helvetica-Bold').fillColor(MARCA.muted).text('MONTO RECIBIDO', 56, resumenY + 12);
                doc.fontSize(16).fillColor(MARCA.navy).text(`$${parseFloat(pago.monto_pagado).toFixed(2)}`, 56, resumenY + 26);

                doc.fontSize(8).font('Helvetica-Bold').fillColor(MARCA.muted).text('RECARGO POR MORA', 230, resumenY + 12);
                doc.fontSize(16).fillColor(MARCA.rose).text(`$${parseFloat(pago.recargo_mora_total || 0).toFixed(2)}`, 230, resumenY + 26);

                doc.fontSize(8).font('Helvetica-Bold').fillColor(MARCA.muted).text(
                    pago.sobrepago > 0 ? 'CRÉDITO A FAVOR (SOBREPAGO)' : 'SOBREPAGO', 400, resumenY + 12
                );
                doc.fontSize(16).fillColor(pago.sobrepago > 0 ? MARCA.green : MARCA.slate)
                    .text(`$${parseFloat(pago.sobrepago || 0).toFixed(2)}`, 400, resumenY + 26);

                doc.font('Helvetica').fontSize(8).fillColor(MARCA.muted)
                    .text('Este documento es un comprobante inmutable de la transacción. Cualquier alteración lo invalida.', 56, resumenY + 52, { width: 480 });

                doc.y = resumenY + 74;
                dibujarPiePagina(doc, 'Recibo digital inmutable emitido por AliGest. Conserve este documento como comprobante de pago.');

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new PagoService();
