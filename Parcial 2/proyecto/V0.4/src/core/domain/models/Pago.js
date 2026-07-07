class Pago {
    constructor({ id, comprobanteId, reciboId = null, copropietarioId, monto, estado = 'PENDIENTE_VALIDACION', fechaRegistro = null, metodo = 'TRANSFERENCIA', periodo = '', motivoRechazo = null, comprobanteImg = null }) {
        this.id = id;
        this.comprobanteId = comprobanteId ? comprobanteId.trim() : ""; // Referencia bancaria original
        this.reciboId = reciboId; // Formato formal: AGE-YYYY-MM-CASA-SEQ
        this.copropietarioId = parseInt(copropietarioId, 10);
        this.monto = parseFloat(monto);
        
        // Ciclo de vida del pago
        this.estado = estado; // 'PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO'
        
        this.fechaRegistro = fechaRegistro || new Date().toISOString();
        this.metodo = metodo;
        this.periodo = periodo ? periodo.trim() : ""; // Ej: '2026-07'
        this.motivoRechazo = motivoRechazo;
        this.comprobanteImg = comprobanteImg; // Imagen/Captura base64 o ruta
    }

    esMontoValido() {
        return this.monto > 0 && !isNaN(this.monto);
    }

    generarComprobanteDigitalID(casa, numeroSecuencial) {
        // RF-3.4: Combinar año actual, mes actual, número de casa y secuencia (ej: AGE-2026-01-CASA14-0001)
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        
        // Sanitizar espacios de la villa
        const casaSanitizada = casa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const secuencia = String(numeroSecuencial).padStart(4, '0');
        
        this.reciboId = `AGE-${anio}-${mes}-${casaSanitizada}-${secuencia}`;
        return this.reciboId;
    }
}

module.exports = Pago;
