class Telefono {
    constructor(valor) {
        if (!valor) {
            throw new Error("El número de teléfono es obligatorio.");
        }
        
        const limpio = valor.toString().trim().replace(/[^0-9+]/g, '');
        const estandarizado = this.estandarizarAFormatoInternacional(limpio);
        
        this._valor = estandarizado;
        Object.freeze(this); // Inmutable
    }

    get valor() {
        return this._valor;
    }

    estandarizarAFormatoInternacional(numero) {
        // Formato internacional +593
        if (numero.startsWith('+593')) {
            if (numero.length === 13) return numero; // Ejemplo: +593987654321
            throw new Error(`Número internacional '${numero}' inválido (debe tener 13 caracteres).`);
        }
        
        if (numero.startsWith('593')) {
            if (numero.length === 12) return '+' + numero;
            throw new Error(`Número internacional '${numero}' inválido (debe tener 12 dígitos).`);
        }
        
        // Formato local ecuatoriano celular: 09XXXXXXXX (10 dígitos)
        if (numero.startsWith('09') && numero.length === 10) {
            return '+593' + numero.substring(1);
        }
        
        // Formato local ecuatoriano celular sin 0 inicial: 9XXXXXXXX (9 dígitos)
        if (numero.startsWith('9') && numero.length === 9) {
            return '+593' + numero;
        }

        throw new Error(`El número telefónico '${numero}' no es un teléfono móvil ecuatoriano válido.`);
    }
}

module.exports = Telefono;
