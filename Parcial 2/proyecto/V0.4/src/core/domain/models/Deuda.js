class Deuda {
    constructor({ id, copropietarioId, mes, monto, estado = 'PENDIENTE', fechaVencimiento }) {
        this.id = id;
        this.copropietarioId = parseInt(copropietarioId, 10);
        this.mes = mes;
        this.monto = parseFloat(monto);
        this.estado = estado; // 'PENDIENTE', 'PAGADO'
        this.fechaVencimiento = fechaVencimiento;
    }

    esVencida(fechaReferencia = new Date()) {
        if (this.estado === 'PAGADO') return false;
        const vencimiento = new Date(this.fechaVencimiento);
        return vencimiento < fechaReferencia;
    }

    calcularDiasRetraso(fechaReferencia = new Date()) {
        if (!this.esVencida(fechaReferencia)) return 0;
        const vencimiento = new Date(this.fechaVencimiento);
        const diffTime = Math.abs(fechaReferencia - vencimiento);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}

module.exports = Deuda;
