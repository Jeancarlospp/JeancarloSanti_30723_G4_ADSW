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

    test('Debería calcular el recargo fijo del 12% sobre el monto adeudado', () => {
        // Para $100 vencido: 100 * 0.12 = 12.00
        const interes = context.calcular(100, 10);
        expect(interes).toBe(12.00);
    });

    test('Debería redondear a 2 decimales el recargo de mora', () => {
        // Para $150.75: 150.75 * 0.12 = 18.09
        const interes = context.calcular(150.75, 45);
        expect(interes).toBe(18.09);
    });

    test('El recargo del 12% no debe acumularse ni variar según los días de retraso transcurridos', () => {
        // El recargo se aplica una sola vez por período vencido (RF-3.3),
        // por lo que el resultado es el mismo con 1 día o con 200 días de mora.
        expect(context.calcular(100, 1)).toBe(12.00);
        expect(context.calcular(100, 200)).toBe(12.00);
    });
});
