class Copropietario {
    constructor({ id, cedula, nombre, casa, telefono, saldo = 0.0 }) {
        this.id = id;
        this.cedula = cedula;
        this.nombre = nombre;
        this.casa = casa; // Identificador único de vivienda (Num_Villa)
        this.telefono = telefono; // Validado para integraciones de WhatsApp
        this.saldo = parseFloat(saldo);
    }

    // Validación de campos obligatorios requerida por el proceso de importación
    validarDatosFila() {
        if (!this.cedula || !this.validarCedulaEcuatoriana(this.cedula)) {
            throw new Error(`Cédula inválida o vacía para el copropietario: ${this.nombre}`);
        }
        if (!this.nombre || this.nombre.trim() === "") {
            throw new Error("El nombre completo es un campo obligatorio.");
        }
        if (!this.casa) {
            throw new Error("El número de casa/villa es obligatorio para asegurar la restricción de unicidad.");
        }
        return true;
    }

    validarCedulaEcuatoriana(cedula) {
        if (cedula.length !== 10) return false;
        const digitoRegion = parseInt(cedula.substring(0, 2));
        if (digitoRegion < 1 || digitoRegion > 24) return false;
        
        const ultimoDigito = parseInt(cedula.substring(9, 10));
        let suma = 0;
        for (let i = 0; i < 9; i++) {
            let multiplicador = (i % 2 === 0) ? 2 : 1;
            let componente = parseInt(cedula.substring(i, i + 1)) * multiplicador;
            if (componente > 9) componente -= 9;
            suma += componente;
        }
        const digitoVerificador = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
        return digitoVerificador === ultimoDigito;
    }
}

module.exports = Copropietario;