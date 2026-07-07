const db = require('../../../config/database');

class UsuarioRepository {
    findByUsername(username) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuarios WHERE username = ?", [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuarios WHERE email = ?", [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    findById(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuarios WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    findAll() {
        return new Promise((resolve, reject) => {
            db.all("SELECT id, username, email, role, status FROM usuarios", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    create(username, email, hashedPassword, role, mustChangePassword = 0) {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO usuarios (username, email, password, role, status, must_change_password) VALUES (?, ?, ?, ?, 'ACTIVO', ?)", 
            [username, email, hashedPassword, role, mustChangePassword], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, username, email, role, mustChangePassword });
            });
        });
    }

    updateRecoveryCode(username, code, expirationIso) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuarios SET recovery_code = ?, recovery_code_expires_at = ? WHERE username = ?",
            [code, expirationIso, username], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    updatePasswordAndClearRecovery(username, hashedPassword) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuarios SET password = ?, recovery_code = NULL, recovery_code_expires_at = NULL, failed_attempts = 0, status = 'ACTIVO', lockout_until = NULL WHERE username = ?",
            [hashedPassword, username], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    updatePasswordAndClearMustChange(username, hashedPassword) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuarios SET password = ?, must_change_password = 0 WHERE username = ?",
            [hashedPassword, username], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    incrementFailedAttempts(username) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuarios SET failed_attempts = failed_attempts + 1 WHERE username = ?", [username], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    lockoutUser(username, lockoutUntilIso) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuarios SET status = 'BLOQUEADO', lockout_until = ? WHERE username = ?", [lockoutUntilIso, username], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    resetFailedAttempts(username) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuarios SET failed_attempts = 0, status = 'ACTIVO', lockout_until = NULL WHERE username = ?", [username], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    updatePerfil(id, role, status) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuarios SET role = ?, status = ? WHERE id = ?", [role, status, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    countAdministrators() {
        return new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM usuarios WHERE role = 'ADMINISTRADOR' AND status = 'ACTIVO'", [], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.count : 0);
            });
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM usuarios WHERE id = ?", [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = new UsuarioRepository();
