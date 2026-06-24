const db = require('../../database');

class CopropietarioRepository {
    findAll() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM copropietarios", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    findByCedula(cedula) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM copropietarios WHERE cedula = ?", [cedula], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    create(copropietario) {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO copropietarios (cedula, nombre, casa, telefono, saldo) VALUES (?, ?, ?, ?, ?)",
            [copropietario.cedula, copropietario.nombre, copropietario.casa, copropietario.telefono, copropietario.saldo], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    update(cedula, datos) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE copropietarios SET nombre = ?, casa = ?, telefono = ? WHERE cedula = ?",
            [datos.nombre, datos.casa, datos.telefono, cedula], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = new CopropietarioRepository();