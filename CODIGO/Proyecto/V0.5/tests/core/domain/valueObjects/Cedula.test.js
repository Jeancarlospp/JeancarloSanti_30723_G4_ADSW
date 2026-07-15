const Cedula = require('../../../../src/core/domain/valueObjects/Cedula');

describe('Cedula Value Object', () => {
    test('Debería crear una cédula ecuatoriana válida', () => {
        const ced = new Cedula('1721151247');
        expect(ced.valor).toBe('1721151247');
    });

    test('Debería limpiar guiones y espacios de la cédula', () => {
        const ced = new Cedula(' 172115124-7 ');
        expect(ced.valor).toBe('1721151247');
    });

    test('Debería fallar si la cédula es nula o vacía', () => {
        expect(() => new Cedula('')).toThrow("El número de cédula es obligatorio.");
        expect(() => new Cedula(null)).toThrow("El número de cédula es obligatorio.");
    });

    test('Debería fallar si no cumple el algoritmo Módulo 10 Ecuatoriano', () => {
        expect(() => new Cedula('1721151241')).toThrow("no cumple con el algoritmo Módulo 10 Ecuatoriano");
    });

    test('Debería fallar si tiene longitud incorrecta', () => {
        expect(() => new Cedula('17211512')).toThrow("no cumple con el algoritmo Módulo 10 Ecuatoriano");
    });

    test('Debería fallar si tiene un código de provincia inválido', () => {
        // Provincias de Ecuador van de 01 a 24, consular exterior es 30.
        // 25 no es válido.
        expect(() => new Cedula('2500000000')).toThrow("no cumple con el algoritmo Módulo 10 Ecuatoriano");
    });

    test('Debería permitir provincia exterior 30', () => {
        // Generamos una cédula de provincia exterior 30 válida:
        // Dígitos: 30 0 0 0 0 0 0 1 8 -> Verificar:
        // Posiciones impares multiplicadas por 2: 3*2=6, 0, 0, 0, 1*2=2. Suma impares: 6+0+0+0+2 = 8
        // Posiciones pares multiplicadas por 1: 0, 0, 0, 0. Suma pares: 0
        // Suma total: 8. Dígito verificador: 10 - 8 = 2.
        // Entonces 3000000012 es una cédula exterior válida.
        const ced = new Cedula('3000000012');
        expect(ced.valor).toBe('3000000012');
    });
});
