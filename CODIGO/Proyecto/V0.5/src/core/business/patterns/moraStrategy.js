class CalculadorMoraContext {
    constructor(strategy) {
        this.strategy = strategy;
    }

    calcular(monto, diasRetraso) {
        return this.strategy.calcularMora(monto, diasRetraso);
    }
}

class EcuandorianMora12Strategy {
    calcularMora(monto, diasRetraso) {
        if (diasRetraso <= 0) return 0;
        // RF-3.3: Recargo fijo del 12% sobre la deuda vencida, aplicado una sola
        // vez por período (no se prorratea ni se acumula por días de atraso).
        const interes = monto * 0.12;
        return parseFloat(interes.toFixed(2));
    }
}

module.exports = { CalculadorMoraContext, EcuandorianMora12Strategy };
