const Cedula = require('../valueObjects/Cedula');
const Telefono = require('../valueObjects/Telefono');

class Copropietario {
    constructor({ id, cedula, nombre, casa, telefono, email, saldo = 0.0, usuarioId = null }) {
        this.id = id;
        
        // Validación y asignación mediante Objetos de Valor
        const cedObject = new Cedula(cedula);
        this.cedula = cedObject.valor;
        
        this.nombre = nombre ? nombre.trim() : "";
        this.casa = casa ? casa.trim() : "";
        
        const telObject = new Telefono(telefono);
        this.telefono = telObject.valor;
        
        this.email = email ? email.trim() : "";
        this.saldo = parseFloat(saldo || 0.0);
        this.usuarioId = usuarioId;
    }

    validarDatosFila() {
        if (!this.nombre || this.nombre === "") {
            throw new Error("El nombre completo es un campo obligatorio.");
        }
        if (!this.casa || this.casa === "") {
            throw new Error("La villa/casa es obligatoria.");
        }
        if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            throw new Error(`El correo electrónico '${this.email}' no tiene un formato válido.`);
        }
        return true;
    }
}

module.exports = Copropietario;
