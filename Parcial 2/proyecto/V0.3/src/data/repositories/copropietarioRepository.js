const db = require('../../../config/database');

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

    findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM copropietarios WHERE email = ?", [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    findById(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM copropietarios WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    findByCasa(casa) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM copropietarios WHERE casa = ?", [casa], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    findByUsuarioId(usuarioId) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM copropietarios WHERE usuario_id = ?", [usuarioId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    create(copropietario) {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO copropietarios (cedula, nombre, casa, telefono, email, saldo, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                copropietario.cedula, 
                copropietario.nombre, 
                copropietario.casa, 
                copropietario.telefono, 
                copropietario.email,
                copropietario.saldo,
                copropietario.usuarioId
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    update(cedula, datos) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE copropietarios SET nombre = ?, casa = ?, telefono = ?, email = ?, saldo = ? WHERE cedula = ?",
            [
                datos.nombre, 
                datos.casa, 
                datos.telefono, 
                datos.email,
                datos.saldo !== undefined ? parseFloat(datos.saldo) : 0.0, 
                cedula
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM copropietarios WHERE id = ?", [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = new CopropietarioRepository();
