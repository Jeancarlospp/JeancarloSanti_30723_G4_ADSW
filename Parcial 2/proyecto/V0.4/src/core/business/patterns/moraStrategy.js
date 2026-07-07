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
        // Interés del 12% nominal anualizado
        const tasaDiaria = 0.12 / 365;
        const interes = monto * tasaDiaria * diasRetraso;
        return parseFloat(interes.toFixed(2));
    }
}

module.exports = { CalculadorMoraContext, EcuandorianMora12Strategy };
