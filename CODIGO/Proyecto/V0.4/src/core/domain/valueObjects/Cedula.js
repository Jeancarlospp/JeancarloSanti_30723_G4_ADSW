class Cedula {
    constructor(valor) {
        if (!valor) {
            throw new Error("El número de cédula es obligatorio.");
        }
        
        // Remover cualquier guion o espacio
        const cedulaLimpia = valor.toString().trim().replace(/[^0-9]/g, '');
        
        if (!this.validarCedulaEcuatoriana(cedulaLimpia)) {
            throw new Error(`La cédula '${valor}' no cumple con el algoritmo Módulo 10 Ecuatoriano.`);
        }
        
        this._valor = cedulaLimpia;
        Object.freeze(this); // Objeto de Valor Inmutable (DDD)
    }

    get valor() {
        return this._valor;
    }

    validarCedulaEcuatoriana(cedula) {
        if (cedula.length !== 10) return false;
        
        const digitoRegion = parseInt(cedula.substring(0, 2), 10);
        // Provincias de Ecuador van del 01 al 24, consular exterior es el 30
        if ((digitoRegion < 1 || digitoRegion > 24) && digitoRegion !== 30) return false;
        
        const ultimoDigito = parseInt(cedula.substring(9, 10), 10);
        let suma = 0;
        
        for (let i = 0; i < 9; i++) {
            let multiplicador = (i % 2 === 0) ? 2 : 1;
            let componente = parseInt(cedula.substring(i, i + 1), 10) * multiplicador;
            if (componente > 9) componente -= 9;
            suma += componente;
        }
        
        const digitoVerificador = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
        return digitoVerificador === ultimoDigito;
    }
}

module.exports = Cedula;
