const ExcelCopropietarioAdapter = require('../../../../src/core/business/patterns/excelAdapter');

describe('ExcelCopropietarioAdapter', () => {
    test('Debería mapear correctamente con cabeceras en español', () => {
        const rawRow = {
            "Cédula": "1721151247",
            "Nombre Completo": "Juan Perez",
            "Número Casa": "Casa 15",
            "Teléfono": "0987654321",
            "Correo Electrónico": "juan@correo.com",
            "Saldo Inicial": "150.50"
        };
        const adapted = ExcelCopropietarioAdapter.adaptRow(rawRow);
        expect(adapted).toEqual({
            cedula: "1721151247",
            nombre: "Juan Perez",
            casa: "Casa 15",
            telefono: "0987654321",
            email: "juan@correo.com",
            saldo: 150.50
        });
    });

    test('Debería mapear correctamente con cabeceras alternativas en inglés o simplificadas', () => {
        const rawRow = {
            "Cedula": "1721151247",
            "Nombre": "Juan Perez",
            "Casa": "Casa 15",
            "Telefono": "0987654321",
            "Email": "juan@correo.com",
            "Saldo": "100.00"
        };
        const adapted = ExcelCopropietarioAdapter.adaptRow(rawRow);
        expect(adapted).toEqual({
            cedula: "1721151247",
            nombre: "Juan Perez",
            casa: "Casa 15",
            telefono: "0987654321",
            email: "juan@correo.com",
            saldo: 100.00
        });
    });

    test('Debería establecer saldo en 0.0 si es inválido o no numérico', () => {
        const rawRow = {
            "Cedula": "1721151247",
            "Nombre": "Juan Perez",
            "Casa": "Casa 15",
            "Saldo": "no-numerico"
        };
        const adapted = ExcelCopropietarioAdapter.adaptRow(rawRow);
        expect(adapted.saldo).toBe(0.0);
    });

    test('Debería lanzar error si la fila es nula o indefinida', () => {
        expect(() => ExcelCopropietarioAdapter.adaptRow(null)).toThrow("Fila de hoja de cálculo nula o indefinida.");
    });
});
