class Usuario {
    constructor({ id, username, email, password, role, status = 'ACTIVO', failedAttempts = 0, lockoutUntil = null, recoveryCode = null, recoveryCodeExpiresAt = null }) {
        this.id = id;
        this.username = username ? username.trim() : "";
        this.email = email ? email.trim() : "";
        this.password = password; // Contraseña (plana antes de cifrar, hash después)
        this.role = role; // 'ADMINISTRADOR' o 'COPROPIETARIO'
        this.status = status; // 'ACTIVO' o 'BLOQUEADO'
        this.failedAttempts = parseInt(failedAttempts || 0, 10);
        this.lockoutUntil = lockoutUntil;
        this.recoveryCode = recoveryCode;
        this.recoveryCodeExpiresAt = recoveryCodeExpiresAt;
    }

    esAdmin() {
        return this.role === 'ADMINISTRADOR';
    }

    esBloqueado() {
        if (this.status === 'BLOQUEADO') {
            if (this.lockoutUntil) {
                const limite = new Date(this.lockoutUntil);
                const ahora = new Date();
                if (ahora < limite) {
                    return true;
                }
            } else {
                return true;
            }
        }
        return false;
    }

    validarFormato() {
        if (!this.username || this.username.length < 3 || this.username.length > 20) {
            throw new Error("El nombre de usuario debe tener entre 3 y 20 caracteres.");
        }

        if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            throw new Error("El correo electrónico no tiene un formato válido.");
        }

        if (!this.password) {
            throw new Error("La contraseña es obligatoria.");
        }

        // Si la contraseña ya está hasheada con bcrypt, no aplicar reglas de complejidad
        if (this.password.startsWith('$2b$')) {
            return true;
        }

        if (this.password.length < 8) {
            throw new Error("La contraseña debe tener al menos 8 caracteres.");
        }

        const tieneMayuscula = /[A-Z]/.test(this.password);
        if (!tieneMayuscula) {
            throw new Error("La contraseña debe contener al menos una letra mayúscula.");
        }

        const tieneMinuscula = /[a-z]/.test(this.password);
        if (!tieneMinuscula) {
            throw new Error("La contraseña debe contener al menos una letra minúscula.");
        }

        const tieneNumero = /[0-9]/.test(this.password);
        if (!tieneNumero) {
            throw new Error("La contraseña debe contener al menos un número.");
        }

        // Caracteres especiales válidos: @$!%*?&._-#+*/%
        const tieneEspecial = /[@$!%*?&._\-#+*\/%]/.test(this.password);
        if (!tieneEspecial) {
            throw new Error("La contraseña debe contener al menos un carácter especial (@$!%*?&._-#+*/%).");
        }

        return true;
    }
}

module.exports = Usuario;
