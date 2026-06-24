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
        // 12% anualizado aplicado proporcionalmente por días de retraso
        const tasaDiaria = 0.12 / 365;
        return parseFloat((monto * tasaDiaria * diasRetraso).toFixed(2));
    }
}

module.exports = { CalculadorMoraContext, EcuandorianMora12Strategy };