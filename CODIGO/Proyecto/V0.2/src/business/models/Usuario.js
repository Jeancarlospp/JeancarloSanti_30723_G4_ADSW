class Usuario {
    constructor({ id, username, password, role }) {
        this.id = id;
        this.username = username;
        this.password = password; // Contraseña hash (BCrypt factor 12)
        this.role = role; // 'ADMINISTRADOR' o 'COPROPIETARIO'
    }

    // Validación estricta según requerimientos de seguridad del SRS
    esAdmin() {
        return this.role === 'ADMINISTRADOR';
    }

    validarFormato() {
        if (!this.username || this.username.trim().length < 4) {
            throw new Error("El nombre de usuario debe tener al menos 4 caracteres.");
        }
        if (!this.password || this.password.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
        return true;
    }
}

module.exports = Usuario;