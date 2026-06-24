const db = require('../../database');

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

    registrarPagoInmutable(comprobanteId, copropietarioId, monto, estado) {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO pagos (comprobante_id, copropietario_id, monto_pagado, estado, fecha_registro) VALUES (?, ?, ?, ?, ?)",
            [comprobanteId, copropietarioId, monto, estado, new Date().toISOString()], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    registrarAuditoria(accion, detalles) {
        db.run("INSERT INTO auditoria (accion, detalles, timestamp) VALUES (?, ?, ?)", 
        [accion, JSON.stringify(detalles), new Date().toISOString()]);
    }
}

module.exports = new PagoRepository();