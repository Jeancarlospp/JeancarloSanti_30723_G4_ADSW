const PDFDocument = require('pdfkit');
const pagoRepository = require('../../../data/repositories/pagoRepository');
const copropietarioRepository = require('../../../data/repositories/copropietarioRepository');
const { CalculadorMoraContext, EcuandorianMora12Strategy } = require('../patterns/moraStrategy');
const notificationService = require('./NotificationService');
const Pago = require('../../domain/models/Pago');

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

            doc.fillColor('#1e3a8a').fontSize(22).text('ALIGEST CONDOMINIOS', { align: 'center', underline: true });
            doc.fillColor('#475569').fontSize(12).text('Reporte Financiero de Pagos y Estados de Cuenta', { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(10).fillColor('#334155');
            doc.text(`Generado: ${new Date().toLocaleString()}`);
            doc.text(`Registros encontrados: ${listado.length}`);
            doc.moveDown(1);

            doc.fontSize(9).fillColor('#0f172a');
            doc.text('Residente', 40, doc.y, { width: 120 });
            doc.text('Villa', 160, doc.y, { width: 70 });
            doc.text('Referencia', 230, doc.y, { width: 110 });
            doc.text('Periodo', 340, doc.y, { width: 70 });
            doc.text('Fecha', 410, doc.y, { width: 110 });
            doc.text('Monto', 520, doc.y, { width: 70, align: 'right' });
            doc.text('Estado', 590, doc.y, { width: 90 });
            doc.moveDown(0.7);
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(680, doc.y).stroke();
            doc.moveDown(0.6);

            listado.forEach((row) => {
                doc.fillColor('#334155').fontSize(8);
                doc.text(String(row.copropietario_nombre || '').substring(0, 18), 40, doc.y, { width: 120 });
                doc.text(String(row.copropietario_casa || ''), 160, doc.y, { width: 70 });
                doc.text(String(row.comprobante_id || ''), 230, doc.y, { width: 110 });
                doc.text(String(row.periodo || 'N/A'), 340, doc.y, { width: 70 });
                doc.text(row.fecha_pago || new Date(row.fecha_registro).toLocaleDateString(), 410, doc.y, { width: 110 });
                doc.text(`$${parseFloat(row.monto_pagado).toFixed(2)}`, 520, doc.y, { width: 70, align: 'right' });
                doc.text(String(row.estado || ''), 590, doc.y, { width: 90 });
                doc.moveDown(0.9);
            });

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

            // Título Principal
            doc.fillColor('#1e3a8a').fontSize(24).text('RECIBO DIGITAL DE PAGO', { align: 'center', bold: true });
            doc.fillColor('#64748b').fontSize(10).text('AliGest Condominios - Inmutable', { align: 'center' });
            doc.moveDown(2);

            // Detalles del Comprobante
            doc.fillColor('#0f172a').fontSize(12).text(`Código del Recibo: ${pago.recibo_id}`, { bold: true });
            doc.fontSize(10).fillColor('#334155');
            doc.text(`Fecha de Registro: ${new Date(pago.fecha_registro).toLocaleString()}`);
            doc.text(`Referencia Bancaria: ${pago.comprobante_id}`);
            doc.text(`Método de Pago: ${pago.metodo}`);
            doc.text(`Período Declarado: ${pago.periodo || 'N/A'}`);
            doc.moveDown();

            // Datos del Residente
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
            doc.fontSize(12).fillColor('#0f172a').text('Datos del Residentes:', { bold: true });
            doc.fontSize(10).fillColor('#334155');
            doc.text(`Nombre Completo: ${pago.copropietario_nombre}`);
            doc.text(`Cédula: ${pago.copropietario_cedula}`);
            doc.text(`Villa / Casa: ${pago.copropietario_casa}`);
            doc.text(`Celular: ${pago.copropietario_telefono}`);
            doc.moveDown();

            // Desglose de Montos
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
            doc.fontSize(12).fillColor('#0f172a').text('Detalle de Liquidación:', { bold: true });
            doc.moveDown(0.5);

            // Fila de Monto
            doc.fontSize(10).fillColor('#334155');
            doc.text('Monto Recibido:', 40, doc.y);
            doc.text(`$${parseFloat(pago.monto_pagado).toFixed(2)}`, 450, doc.y, { align: 'right' });
            doc.moveDown();

            doc.text('Recargo por mora aplicado:', 40, doc.y);
            doc.text(`$${parseFloat(pago.recargo_mora_total || 0).toFixed(2)}`, 450, doc.y, { align: 'right' });
            doc.moveDown();

            if (pago.aplicaciones && pago.aplicaciones.length > 0) {
                doc.fontSize(9).fillColor('#0f172a').text('Aplicación FIFO por período:', 40, doc.y, { underline: true });
                doc.moveDown(0.4);
                pago.aplicaciones.forEach(aplicacion => {
                    doc.fillColor('#334155').text(
                        `${aplicacion.periodo}: pendiente $${parseFloat(aplicacion.monto_pendiente).toFixed(2)} + mora $${parseFloat(aplicacion.recargo_mora || 0).toFixed(2)} | aplicado $${parseFloat(aplicacion.monto_aplicado).toFixed(2)} | saldo $${parseFloat(aplicacion.saldo_posterior).toFixed(2)}`
                    );
                });
                doc.moveDown();
            }

            if (pago.sobrepago > 0) {
                doc.fillColor('#059669').text(`Crédito a favor por sobrepago: $${parseFloat(pago.sobrepago).toFixed(2)}`);
                doc.moveDown();
            }

            doc.text('Estado de Transacción:', 40, doc.y);
            doc.fillColor('#10b981').text(pago.estado, 450, doc.y, { align: 'right' });
            doc.moveDown(2);

            // Pie de Página
            doc.fillColor('#94a3b8').fontSize(8).text('La información en este recibo está firmada de forma electrónica e inmutable en nuestra base de datos relacional.', { align: 'center' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new PagoService();
