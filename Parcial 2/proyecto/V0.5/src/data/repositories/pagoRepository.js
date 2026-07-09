const { Pago, Deuda, Auditoria } = require('../../../config/database');

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
                metodo: p.metodo,
                periodo: p.periodo,
                motivo_rechazo: p.motivo_rechazo,
                comprobante_img: p.comprobante_img,
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

    async updateDeuda(id, estado, monto) {
        const res = await Deuda.updateOne({ _id: id }, { estado, monto });
        return res.modifiedCount;
    }

    async registrarPagoInmutable(comprobanteId, copropietarioId, monto, estado, reciboId = null, metodo = 'TRANSFERENCIA', periodo = '', comprobanteImg = null) {
        const row = await Pago.create({
            comprobante_id: comprobanteId,
            recibo_id: reciboId,
            copropietario_id: copropietarioId,
            monto_pagado: monto,
            estado,
            fecha_registro: new Date().toISOString(),
            metodo,
            periodo,
            comprobante_img: comprobanteImg
        });
        return row._id.toString();
    }

    async updatePagoEstado(id, estado, reciboId = null, motivoRechazo = null) {
        const res = await Pago.updateOne({ _id: id }, {
            estado,
            recibo_id: reciboId,
            motivo_rechazo: motivoRechazo
        });
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
            metodo: p.metodo,
            periodo: p.periodo,
            motivo_rechazo: p.motivo_rechazo,
            comprobante_img: p.comprobante_img,
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
            metodo: p.metodo,
            periodo: p.periodo,
            motivo_rechazo: p.motivo_rechazo,
            comprobante_img: p.comprobante_img,
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
}

module.exports = new PagoRepository();
