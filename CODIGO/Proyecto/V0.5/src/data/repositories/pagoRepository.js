const { Pago, Deuda, Auditoria, Notificacion } = require('../../../config/database');

function mapDeuda(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    obj.id = obj._id.toString();
    if (obj.copropietario_id) obj.copropietario_id = obj.copropietario_id.toString();
    return obj;
}

function mapPago(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    obj.id = obj._id.toString();
    if (obj.copropietario_id) obj.copropietario_id = obj.copropietario_id.toString();
    return obj;
}

class PagoRepository {
    async getReportePagos({ fechaInicio, fechaFin, periodo, estado, copropietarioId = null }) {
        const where = {};

        if (copropietarioId) {
            where.copropietario_id = copropietarioId;
        }

        if (estado) {
            where.estado = estado;
        }

        if (periodo) {
            where.periodo = periodo;
        }

        if (fechaInicio || fechaFin) {
            where.fecha_registro = {};
            if (fechaInicio) {
                // SQLite hacía: date(p.fecha_registro) >= date(?)
                // Para MongoDB, dado que guardamos la fecha como ISO string en UTC, 
                // podemos convertir la fecha de inicio al principio del día en formato string
                where.fecha_registro.$gte = new Date(fechaInicio).toISOString();
            }
            if (fechaFin) {
                // Y fecha fin al final del día
                const fin = new Date(fechaFin);
                fin.setHours(23, 59, 59, 999);
                where.fecha_registro.$lte = fin.toISOString();
            }
        }

        const pagos = await Pago.find(where)
            .populate('copropietario_id')
            .sort({ fecha_registro: -1 });

        return pagos.map(p => {
            const copro = p.copropietario_id || {};
            return {
                id: p._id.toString(),
                comprobante_id: p.comprobante_id,
                recibo_id: p.recibo_id,
                copropietario_id: copro._id ? copro._id.toString() : p.copropietario_id,
                monto_pagado: p.monto_pagado,
                estado: p.estado,
                fecha_registro: p.fecha_registro,
                fecha_pago: p.fecha_pago,
                metodo: p.metodo,
                periodo: p.periodo,
                motivo_rechazo: p.motivo_rechazo,
                comprobante_img: p.comprobante_img,
                sobrepago: p.sobrepago || 0,
                recargo_mora_total: p.recargo_mora_total || 0,
                aplicaciones: p.aplicaciones || [],
                copropietario_nombre: copro.nombre || '',
                copropietario_casa: copro.casa || '',
                copropietario_cedula: copro.cedula || ''
            };
        });
    }

    async getDeudasAntiguas(copropietarioId) {
        const rows = await Deuda.find({ copropietario_id: copropietarioId, estado: 'PENDIENTE' })
            .sort({ fecha_vencimiento: 1 });
        return rows.map(mapDeuda);
    }

    async getDeudasByCopropietario(copropietarioId) {
        const rows = await Deuda.find({ copropietario_id: copropietarioId })
            .sort({ fecha_vencimiento: 1 });
        return rows.map(mapDeuda);
    }

    async getPagosByCopropietario(copropietarioId) {
        const rows = await Pago.find({ copropietario_id: copropietarioId })
            .sort({ fecha_registro: -1 });
        return rows.map(mapPago);
    }

    async getPagosPendientes() {
        const pagos = await Pago.find({ estado: 'PENDIENTE_VALIDACION' })
            .populate('copropietario_id')
            .sort({ fecha_registro: 1 });

        return pagos.map(p => {
            const copro = p.copropietario_id || {};
            return {
                id: p._id.toString(),
                comprobante_id: p.comprobante_id,
                recibo_id: p.recibo_id,
                copropietario_id: copro._id ? copro._id.toString() : p.copropietario_id,
                monto_pagado: p.monto_pagado,
                estado: p.estado,
                fecha_registro: p.fecha_registro,
                fecha_pago: p.fecha_pago,
                metodo: p.metodo,
                periodo: p.periodo,
                comprobante_img: p.comprobante_img,
                copropietario_nombre: copro.nombre || '',
                copropietario_casa: copro.casa || ''
            };
        });
    }

    async createDeuda(copropietarioId, mes, monto, estado = 'PENDIENTE', fechaVencimiento) {
        const row = await Deuda.create({
            copropietario_id: copropietarioId,
            mes,
            monto,
            estado,
            fecha_vencimiento: fechaVencimiento
        });
        return row._id.toString();
    }

    async findDeudaPorPeriodo(copropietarioId, mes) {
        const row = await Deuda.findOne({ copropietario_id: copropietarioId, mes });
        return mapDeuda(row);
    }

    async updateDeuda(id, estado, monto, moraAplicada = undefined, recargoMora = undefined) {
        const cambios = { estado, monto };
        if (moraAplicada !== undefined) cambios.mora_aplicada = moraAplicada;
        if (recargoMora !== undefined) cambios.recargo_mora = recargoMora;
        const res = await Deuda.updateOne({ _id: id }, cambios);
        return res.modifiedCount;
    }

    async findPagoByComprobanteId(comprobanteId) {
        return mapPago(await Pago.findOne({ comprobante_id: comprobanteId }));
    }

    // recibo_id tiene un índice único+sparse: solo se incluye en el documento
    // cuando existe un valor real. Escribirlo explícitamente como null (incluso
    // vía $set) lo vuelve "presente" para MongoDB y rompe la unicidad en cuanto
    // exista un segundo pago pendiente o rechazado (ambos sin recibo aún).
    async registrarPagoInmutable(comprobanteId, copropietarioId, monto, estado, reciboId = null, metodo = 'TRANSFERENCIA', periodo = '', comprobanteImg = null, fechaPago = null) {
        const datos = {
            comprobante_id: comprobanteId,
            copropietario_id: copropietarioId,
            monto_pagado: monto,
            estado,
            fecha_registro: new Date().toISOString(),
            fecha_pago: fechaPago || new Date().toISOString().slice(0, 10),
            metodo,
            periodo,
            comprobante_img: comprobanteImg
        };
        if (reciboId) datos.recibo_id = reciboId;
        const row = await Pago.create(datos);
        return row._id.toString();
    }

    async updatePagoEstado(id, estado, reciboId = null, motivoRechazo = null, detalles = {}) {
        const cambios = { $set: { estado, motivo_rechazo: motivoRechazo } };
        if (reciboId) {
            cambios.$set.recibo_id = reciboId;
        } else {
            cambios.$unset = { recibo_id: '' };
        }
        if (detalles.sobrepago !== undefined) cambios.$set.sobrepago = detalles.sobrepago;
        if (detalles.recargoMoraTotal !== undefined) cambios.$set.recargo_mora_total = detalles.recargoMoraTotal;
        if (detalles.aplicaciones !== undefined) cambios.$set.aplicaciones = detalles.aplicaciones;
        const res = await Pago.updateOne({ _id: id }, cambios);
        return res.modifiedCount;
    }

    // Reserva atómica para impedir que dos administradores procesen el mismo
    // pago al mismo tiempo. Solo una petición puede cambiar PENDIENTE a PROCESANDO.
    async reservarPagoPendiente(id) {
        const res = await Pago.updateOne(
            { _id: id, estado: 'PENDIENTE_VALIDACION' },
            { $set: { estado: 'PROCESANDO' } }
        );
        return res.modifiedCount === 1;
    }

    async rechazarPagoPendiente(id, motivo) {
        // El pago aún no tenía recibo_id (nunca fue aprobado), así que no se toca ese campo.
        const res = await Pago.updateOne(
            { _id: id, estado: 'PENDIENTE_VALIDACION' },
            { $set: { estado: 'RECHAZADO', motivo_rechazo: motivo } }
        );
        return res.modifiedCount === 1;
    }

    async updateReciboPdf(id, pdfBuffer) {
        const res = await Pago.updateOne({ _id: id }, { recibo_pdf: pdfBuffer });
        return res.modifiedCount;
    }

    async findPagoById(id) {
        const p = await Pago.findById(id).populate('copropietario_id');
        if (!p) return null;
        const copro = p.copropietario_id || {};
        return {
            id: p._id.toString(),
            comprobante_id: p.comprobante_id,
            recibo_id: p.recibo_id,
            copropietario_id: copro._id ? copro._id.toString() : p.copropietario_id,
            monto_pagado: p.monto_pagado,
            estado: p.estado,
            fecha_registro: p.fecha_registro,
            fecha_pago: p.fecha_pago,
            metodo: p.metodo,
            periodo: p.periodo,
            motivo_rechazo: p.motivo_rechazo,
            comprobante_img: p.comprobante_img,
            recibo_pdf: p.recibo_pdf || null,
            sobrepago: p.sobrepago || 0,
            recargo_mora_total: p.recargo_mora_total || 0,
            aplicaciones: p.aplicaciones || [],
            copropietario_nombre: copro.nombre || '',
            copropietario_casa: copro.casa || '',
            copropietario_telefono: copro.telefono || ''
        };
    }

    async findPagoByReciboId(reciboId) {
        const p = await Pago.findOne({ recibo_id: reciboId }).populate('copropietario_id');
        if (!p) return null;
        const copro = p.copropietario_id || {};
        return {
            id: p._id.toString(),
            comprobante_id: p.comprobante_id,
            recibo_id: p.recibo_id,
            copropietario_id: copro._id ? copro._id.toString() : p.copropietario_id,
            monto_pagado: p.monto_pagado,
            estado: p.estado,
            fecha_registro: p.fecha_registro,
            fecha_pago: p.fecha_pago,
            metodo: p.metodo,
            periodo: p.periodo,
            motivo_rechazo: p.motivo_rechazo,
            comprobante_img: p.comprobante_img,
            recibo_pdf: p.recibo_pdf || null,
            sobrepago: p.sobrepago || 0,
            recargo_mora_total: p.recargo_mora_total || 0,
            aplicaciones: p.aplicaciones || [],
            copropietario_nombre: copro.nombre || '',
            copropietario_casa: copro.casa || '',
            copropietario_telefono: copro.telefono || '',
            copropietario_cedula: copro.cedula || ''
        };
    }

    async countPendingDeudas(copropietarioId) {
        return await Deuda.countDocuments({ copropietario_id: copropietarioId, estado: 'PENDIENTE' });
    }

    async countPayments(copropietarioId) {
        return await Pago.countDocuments({ copropietario_id: copropietarioId });
    }

    async getSiguienteSecuenciaPago() {
        const count = await Pago.countDocuments({ estado: 'APROBADO' });
        return count + 1;
    }

    async registrarAuditoria(accion, detalles) {
        const row = await Auditoria.create({
            accion,
            detalles: JSON.stringify(detalles),
            timestamp: new Date().toISOString()
        });
        return row._id.toString();
    }

    async deleteDeuda(id) {
        const result = await Deuda.deleteOne({ _id: id });
        return result.deletedCount;
    }

    async registrarNotificacion(tipo, telefono, mensaje, estado = 'PENDIENTE', error = null) {
        const ahora = new Date().toISOString();
        const row = await Notificacion.create({
            tipo, telefono: telefono || '', mensaje, estado, intentos: 0, error,
            created_at: ahora, updated_at: ahora
        });
        return row._id.toString();
    }

    async actualizarNotificacion(id, estado, intentos, error = null) {
        const result = await Notificacion.updateOne({ _id: id }, {
            estado, intentos, error, updated_at: new Date().toISOString()
        });
        return result.modifiedCount;
    }

    async getNotificaciones() {
        const rows = await Notificacion.find({}).sort({ created_at: -1 });
        return rows.map(row => ({ ...row.toObject(), id: row._id.toString() }));
    }
}

module.exports = new PagoRepository();
