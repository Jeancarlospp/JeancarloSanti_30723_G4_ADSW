const Telefono = require('../../../../src/core/domain/valueObjects/Telefono');

describe('Telefono Value Object', () => {
    test('Debería aceptar formato celular local con 0 inicial (0987654321)', () => {
        const tel = new Telefono('0987654321');
        expect(tel.valor).toBe('+593987654321');
    });

    test('Debería aceptar formato celular local sin 0 inicial (987654321)', () => {
        const tel = new Telefono('987654321');
        expect(tel.valor).toBe('+593987654321');
    });

    test('Debería aceptar formato internacional con prefijo +593 (+593987654321)', () => {
        const tel = new Telefono('+593987654321');
        expect(tel.valor).toBe('+593987654321');
    });

    test('Debería aceptar formato internacional sin signo más (593987654321)', () => {
        const tel = new Telefono('593987654321');
        expect(tel.valor).toBe('+593987654321');
    });

    test('Debería lanzar error si el número es nulo o vacío', () => {
        expect(() => new Telefono('')).toThrow("El número de teléfono es obligatorio.");
        expect(() => new Telefono(null)).toThrow("El número de teléfono es obligatorio.");
    });

    test('Debería lanzar error si el formato del número internacional es incorrecto', () => {
        expect(() => new Telefono('+5939876543')).toThrow("inválido (debe tener 13 caracteres)");
        expect(() => new Telefono('5939876543')).toThrow("inválido (debe tener 12 dígitos)");
    });

    test('Debería lanzar error si no es un celular móvil ecuatoriano válido', () => {
        // Los teléfonos fijos locales no inician con 09 o 9
        expect(() => new Telefono('022345678')).toThrow("no es un teléfono móvil ecuatoriano válido");
    });
});
