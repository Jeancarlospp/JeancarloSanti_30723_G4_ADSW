const { EcuandorianMora12Strategy, CalculadorMoraContext } = require('../../../../src/core/business/patterns/moraStrategy');

describe('EcuandorianMora12Strategy', () => {
    let strategy;
    let context;

    beforeEach(() => {
        strategy = new EcuandorianMora12Strategy();
        context = new CalculadorMoraContext(strategy);
    });

    test('Debería retornar 0 interés de mora si los días de retraso son menores o iguales a cero', () => {
        expect(context.calcular(100, 0)).toBe(0);
        expect(context.calcular(100, -5)).toBe(0);
    });

    test('Debería calcular el interés del 12% anualizado correctamente para retrasos positivos', () => {
        // Tasa diaria: 0.12 / 365
        // Para $100 con 10 días de retraso: 100 * (0.12 / 365) * 10 = 0.3287 -> Redondeado a 0.33
        const interes = context.calcular(100, 10);
        expect(interes).toBe(0.33);
    });

    test('Debería redondear a 2 decimales el interés de mora', () => {
        // Para $150.75 con 45 días: 150.75 * (0.12 / 365) * 45 = 2.2298 -> Redondeado a 2.23
        const interes = context.calcular(150.75, 45);
        expect(interes).toBe(2.23);
    });
});
