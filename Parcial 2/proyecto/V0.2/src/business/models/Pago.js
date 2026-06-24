class Pago {
    constructor({ id, comprobanteId, copropietarioId, monto, estado = 'PENDIENTE', fechaRegistro }) {
        this.id = id;
        this.comprobanteId = comprobanteId; // Código único de transacción bancaria
        this.copropietarioId = copropietarioId;
        this.monto = parseFloat(monto);
        this.estado = estado; // 'PENDIENTE', 'APROBADO', 'RECHAZADO'
        this.fechaRegistro = fechaRegistro || new Date().toISOString();
    }

    // Lógica interna para determinar si el pago cumple con los mínimos de procesamiento
    esMontoValido() {
        return this.monto > 0 && !isNaN(this.monto);
    }

    generarComprobanteDigitalID() {
        // Formato formal estipulado por los requisitos del sistema: AGE-YYYYMMDD-[RANDOM]
        const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const aleatorio = Math.floor(1000 + Math.random() * 9000);
        this.comprobanteId = `AGE-${fecha}-${aleatorio}`;
        return this.comprobanteId;
    }
}

module.exports = Pago;