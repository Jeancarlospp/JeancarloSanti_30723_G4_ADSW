const db = require('../../database');

class UsuarioRepository {
    findByUsername(username) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuarios WHERE username = ?", [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    create(username, hashedPassword, role) {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO usuarios (username, password, role) VALUES (?, ?, ?)", 
            [username, hashedPassword, role], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, username, role });
            });
        });
    }
}

module.exports = new UsuarioRepository();