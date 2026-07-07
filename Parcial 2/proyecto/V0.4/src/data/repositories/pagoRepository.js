const db = require('../../../config/database');

class PagoRepository {
    getDeudasAntiguas(copropietarioId) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM deudas WHERE copropietario_id = ? AND estado = 'PENDIENTE' ORDER BY fecha_vencimiento ASC", 
            [copropietarioId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getDeudasByCopropietario(copropietarioId) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM deudas WHERE copropietario_id = ? ORDER BY fecha_vencimiento ASC", 
            [copropietarioId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getPagosByCopropietario(copropietarioId) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM pagos WHERE copropietario_id = ? ORDER BY fecha_registro DESC", 
            [copropietarioId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getPagosPendientes() {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT p.*, c.nombre as copropietario_nombre, c.casa as copropietario_casa 
                FROM pagos p
                JOIN copropietarios c ON p.copropietario_id = c.id
                WHERE p.estado = 'PENDIENTE_VALIDACION'
                ORDER BY p.fecha_registro ASC
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    createDeuda(copropietarioId, mes, monto, estado = 'PENDIENTE', fechaVencimiento) {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO deudas (copropietario_id, mes, monto, estado, fecha_vencimiento) VALUES (?, ?, ?, ?, ?)",
            [copropietarioId, mes, monto, estado, fechaVencimiento], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    updateDeuda(id, estado, monto) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE deudas SET estado = ?, monto = ? WHERE id = ?",
            [estado, monto, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    registrarPagoInmutable(comprobanteId, copropietarioId, monto, estado, reciboId = null, metodo = 'TRANSFERENCIA', periodo = '', comprobanteImg = null) {
        return new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO pagos (comprobante_id, recibo_id, copropietario_id, monto_pagado, estado, fecha_registro, metodo, periodo, comprobante_img) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                comprobanteId, 
                reciboId, 
                copropietarioId, 
                monto, 
                estado, 
                new Date().toISOString(), 
                metodo, 
                periodo, 
                comprobanteImg
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    updatePagoEstado(id, estado, reciboId = null, motivoRechazo = null) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE pagos SET estado = ?, recibo_id = ?, motivo_rechazo = ? WHERE id = ?", 
            [estado, reciboId, motivoRechazo, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    findPagoById(id) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT p.*, c.nombre as copropietario_nombre, c.casa as copropietario_casa, c.telefono as copropietario_telefono
                FROM pagos p
                JOIN copropietarios c ON p.copropietario_id = c.id
                WHERE p.id = ?
            `, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    findPagoByReciboId(reciboId) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT p.*, c.nombre as copropietario_nombre, c.casa as copropietario_casa, c.telefono as copropietario_telefono, c.cedula as copropietario_cedula
                FROM pagos p
                JOIN copropietarios c ON p.copropietario_id = c.id
                WHERE p.recibo_id = ?
            `, [reciboId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    countPendingDeudas(copropietarioId) {
        return new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM deudas WHERE copropietario_id = ? AND estado = 'PENDIENTE'", [copropietarioId], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.count : 0);
            });
        });
    }

    countPayments(copropietarioId) {
        return new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM pagos WHERE copropietario_id = ?", [copropietarioId], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.count : 0);
            });
        });
    }

    getSiguienteSecuenciaPago() {
        return new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM pagos WHERE estado = 'APROBADO'", [], (err, row) => {
                if (err) reject(err);
                else resolve((row ? row.count : 0) + 1);
            });
        });
    }

    registrarAuditoria(accion, detalles) {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO auditoria (accion, detalles, timestamp) VALUES (?, ?, ?)", 
            [accion, JSON.stringify(detalles), new Date().toISOString()], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
}

module.exports = new PagoRepository();
