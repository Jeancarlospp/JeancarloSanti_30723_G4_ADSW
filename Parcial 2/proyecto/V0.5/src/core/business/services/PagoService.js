const PDFDocument = require('pdfkit');
const pagoRepository = require('../../../data/repositories/pagoRepository');
const copropietarioRepository = require('../../../data/repositories/copropietarioRepository');
const { CalculadorMoraContext, EcuandorianMora12Strategy } = require('../patterns/moraStrategy');
const notificationService = require('./NotificationService');
const Pago = require('../../domain/models/Pago');

class PagoService {
    // Listar pagos pendientes de validación administrativa
    async obtenerPagosPendientes() {
        return await pagoRepository.getPagosPendientes();
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
    async reportarPagoCopropietario(usuarioId, comprobanteId, monto, metodo, periodo, comprobanteImg) {
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
            comprobanteImg 
        });

        if (!pagoEntidad.esMontoValido()) {
            throw new Error("El monto reportado debe ser un número positivo.");
        }

        // Registrar el pago en estado inicial PENDIENTE_VALIDACION (REQ011)
        await pagoRepository.registrarPagoInmutable(
            pagoEntidad.comprobanteId,
            pagoEntidad.copropietarioId,
            pagoEntidad.monto,
            'PENDIENTE_VALIDACION',
            null, // Aún sin recibo digital
            pagoEntidad.metodo,
            pagoEntidad.periodo,
            pagoEntidad.comprobanteImg
        );

        return { mensaje: "El pago fue reportado con éxito y está pendiente de verificación." };
    }

    // Administrador aprueba el pago aplicando amortización FIFO (REQ012)
    async validarAprobarPago(pagoId, fechaReferencia = new Date()) {
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

        // Generar recibo de pago formal inmutable (RF-3.4)
        const pagoEntidad = new Pago(pagoRaw);
        const siguienteSecuencia = await pagoRepository.getSiguienteSecuenciaPago();
        const reciboId = pagoEntidad.generarComprobanteDigitalID(copropietario.casa, siguienteSecuencia);

        // Amortización cronológica FIFO
        const deudas = await pagoRepository.getDeudasAntiguas(copropietario.id);
        let montoRestante = pagoRaw.monto_pagado;
        
        const calculadora = new CalculadorMoraContext(new EcuandorianMora12Strategy());
        const hoy = fechaReferencia;

        for (const de of deudas) {
            if (montoRestante <= 0) break;

            const fechaVenc = new Date(de.fecha_vencimiento);
            let diasRetraso = 0;
            if (hoy > fechaVenc) {
                const diffTime = Math.abs(hoy - fechaVenc);
                diasRetraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            // Aplicar interés nominal diario del 12% anual
            const interesMora = calculadora.calcular(de.monto, diasRetraso);
            const totalDeudaConMora = de.monto + interesMora;

            if (montoRestante >= totalDeudaConMora) {
                montoRestante -= totalDeudaConMora;
                await pagoRepository.updateDeuda(de.id, 'PAGADO', 0);
            } else {
                if (montoRestante >= interesMora) {
                    const capitalAmortizado = montoRestante - interesMora;
                    const nuevoCapital = de.monto - capitalAmortizado;
                    montoRestante = 0;
                    await pagoRepository.updateDeuda(de.id, 'PENDIENTE', parseFloat(nuevoCapital.toFixed(2)));
                } else {
                    const nuevoCapital = (de.monto + interesMora) - montoRestante;
                    montoRestante = 0;
                    await pagoRepository.updateDeuda(de.id, 'PENDIENTE', parseFloat(nuevoCapital.toFixed(2)));
                }
            }
        }

        // Actualizar el saldo del copropietario debitándolo
        let saldoActualizado = copropietario.saldo - pagoRaw.monto_pagado;
        
        await copropietarioRepository.update(copropietario.cedula, {
            nombre: copropietario.nombre,
            casa: copropietario.casa,
            telefono: copropietario.telefono,
            email: copropietario.email,
            saldo: parseFloat(saldoActualizado.toFixed(2))
        });

        // Aprobar el pago inmutable en la base de datos
        await pagoRepository.updatePagoEstado(pagoId, 'APROBADO', reciboId);

        // Despachar alerta de WhatsApp
        await notificationService.enviarNotificacionPago(
            copropietario.telefono,
            reciboId,
            pagoRaw.monto_pagado,
            saldoActualizado
        );

        return {
            comprobante_id: reciboId,
            referencia_bancaria: pagoRaw.comprobante_id,
            monto_aplicado: pagoRaw.monto_pagado,
            sobrepago: parseFloat(montoRestante.toFixed(2)),
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

        await pagoRepository.updatePagoEstado(pagoId, 'RECHAZADO', null, motivo);

        // Notificar rechazo
        const mensajeWhatsApp = `*AliGest Condominios - Pago Rechazado*\n\n` +
                                `Estimado residente, le informamos que su comprobante de pago fue RECHAZADO.\n\n` +
                                `• *Referencia:* ${pagoRaw.comprobante_id}\n` +
                                `• *Monto:* $${parseFloat(pagoRaw.monto_pagado).toFixed(2)}\n` +
                                `• *Motivo de rechazo:* ${motivo}\n\n` +
                                `Por favor, revise y reporte el pago nuevamente.`;
        
        await notificationService.enviarNotificacionPago(
            copropietario.telefono,
            "N/A",
            pagoRaw.monto_pagado,
            copropietario.saldo
        );

        return { mensaje: "El pago fue rechazado y notificado al residente." };
    }

    async obtenerReportePagos(filtros, userContext) {
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
                doc.text(new Date(row.fecha_registro).toLocaleDateString(), 410, doc.y, { width: 110 });
                doc.text(`$${parseFloat(row.monto_pagado).toFixed(2)}`, 520, doc.y, { width: 70, align: 'right' });
                doc.text(String(row.estado || ''), 590, doc.y, { width: 90 });
                doc.moveDown(0.9);
            });

            doc.end();
        });
    }

    // Generar archivo PDF con la factura formal
    generarPdfRecibo(reciboId) {
        return new Promise(async (resolve, reject) => {
            const pago = await pagoRepository.findPagoByReciboId(reciboId);
            if (!pago) {
                return reject(new Error("Recibo de pago no encontrado."));
            }

            const doc = new PDFDocument({ margin: 40 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

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

            doc.text('Estado de Transacción:', 40, doc.y);
            doc.fillColor('#10b981').text(pago.estado, 450, doc.y, { align: 'right' });
            doc.moveDown(2);

            // Pie de Página
            doc.fillColor('#94a3b8').fontSize(8).text('La información en este recibo está firmada de forma electrónica e inmutable en nuestra base de datos relacional.', { align: 'center' });

            doc.end();
        });
    }
}

module.exports = new PagoService();
