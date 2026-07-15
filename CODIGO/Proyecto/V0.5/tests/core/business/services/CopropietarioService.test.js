const copropietarioService = require('../../../../src/core/business/services/CopropietarioService');
const copropietarioRepository = require('../../../../src/data/repositories/copropietarioRepository');
const usuarioRepository = require('../../../../src/data/repositories/usuarioRepository');
const pagoRepository = require('../../../../src/data/repositories/pagoRepository');
const xlsx = require('xlsx');

describe('CopropietarioService (Integration with MongoDB Memory Server)', () => {
    
    // Función de utilidad para generar un Excel buffer mockeado en memoria
    function crearExcelMock(filas) {
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(filas);
        xlsx.utils.book_append_sheet(wb, ws, "Residentes");
        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    test('Debería crear un copropietario manualmente generando su cuenta de usuario', async () => {
        const datos = {
            cedula: '1721151247',
            nombre: 'Carlos Martinez',
            casa: 'Villa 5',
            telefono: '0987654321',
            email: 'carlos@correo.com',
            saldo: 50.0
        };

        const result = await copropietarioService.crearCopropietario(datos);

        expect(result.cedula).toBe('1721151247');
        expect(result.casa).toBe('Villa 5');
        expect(result.username).toBe('villa5'); // Sanitizado
        expect(result.passwordTemporal).toBeDefined();

        // Validar en base de datos
        const copro = await copropietarioRepository.findByCedula('1721151247');
        expect(copro).toBeDefined();
        expect(copro.nombre).toBe('Carlos Martinez');

        const user = await usuarioRepository.findById(copro.usuario_id);
        expect(user).toBeDefined();
        expect(user.role).toBe('COPROPIETARIO');
        expect(user.must_change_password).toBe(1);
    });

    test('Debería importar masivamente residentes desde un buffer de Excel válido', async () => {
        const filas = [
            { "Nombre Completo": "Juan Perez", "Número Casa": "Villa 1", "Cédula": "1721151247", "Correo Electrónico": "juan@correo.com", "Teléfono": "0987654321", "Saldo Inicial": 100 },
            { "Nombre Completo": "Maria Gomez", "Número Casa": "Villa 2", "Cédula": "0921151247", "Correo Electrónico": "maria@correo.com", "Teléfono": "0987654322", "Saldo Inicial": 0 }
        ];
        const buffer = crearExcelMock(filas);

        const importados = await copropietarioService.importarMasivoDesdeExcel(buffer);

        expect(importados.exitosos).toBe(2);
        expect(importados.fallidos).toBe(0);
        expect(importados.importados[0].username).toBe('villa1');
        expect(importados.importados[1].username).toBe('villa2');

        const usuarioVilla1 = await usuarioRepository.findByUsername('villa1');
        expect(usuarioVilla1.role).toBe('COPROPIETARIO');
        expect(usuarioVilla1.must_change_password).toBe(1);
        expect(usuarioVilla1.password).toMatch(/^\$2[aby]\$12\$/);

        const todos = await copropietarioService.obtenerTodos();
        expect(todos).toHaveLength(2);
    });

    test('RF-2.1: importa filas válidas y reporta las inválidas sin guardarlas', async () => {
        const filas = [
            { "Nombre Completo": "Juan Perez", "Número Casa": "Villa 1", "Cédula": "1721151247", "Correo Electrónico": "juan@correo.com", "Teléfono": "0987654321" },
            { "Nombre Completo": "Fila Invalida", "Número Casa": "Villa 2", "Cédula": "1721151241", "Correo Electrónico": "invalido", "Teléfono": "0987654322" }
        ];
        const buffer = crearExcelMock(filas);

        const resumen = await copropietarioService.importarMasivoDesdeExcel(buffer);

        expect(resumen.exitosos).toBe(1);
        expect(resumen.fallidos).toBe(1);
        expect(resumen.errores[0].fila).toBe(3);
        const todos = await copropietarioService.obtenerTodos();
        expect(todos).toHaveLength(1);
    });

    test('Debería actualizar los datos del copropietario correctamente', async () => {
        await copropietarioService.crearCopropietario({
            cedula: '1721151247',
            nombre: 'Juan Original',
            casa: 'Villa 1',
            telefono: '0987654321',
            email: 'juan@correo.com'
        });

        const actualizados = await copropietarioService.actualizarDatos('1721151247', {
            nombre: 'Juan Modificado',
            casa: 'Villa 1',
            telefono: '0987654320',
            email: 'juanmodificado@correo.com'
        });

        expect(actualizados.nombre).toBe('Juan Modificado');
        expect(actualizados.casa).toBe('Villa 1');

        const copro = await copropietarioRepository.findByCedula('1721151247');
        expect(copro.nombre).toBe('Juan Modificado');
        expect(copro.casa).toBe('Villa 1');
    });

    test('RF-2.4: Debería permitir cambiar la cédula (nuevo representante) y regenerar la contraseña temporal', async () => {
        await copropietarioService.crearCopropietario({
            cedula: '1721151247',
            nombre: 'Juan Original',
            casa: 'Villa 2',
            telefono: '0987654321',
            email: 'juan2@correo.com'
        });

        const actualizado = await copropietarioService.actualizarDatos('1721151247', {
            cedula: '3000000012',
            nombre: 'Pedro Nuevo Representante'
        });

        expect(actualizado.cedula).toBe('3000000012');
        expect(actualizado.passwordTemporal).toEqual(expect.stringMatching(/^Temp-\d{4}!$/));

        // El registro anterior con la cédula original ya no debe existir
        const anterior = await copropietarioRepository.findByCedula('1721151247');
        expect(anterior).toBeNull();

        const nuevo = await copropietarioRepository.findByCedula('3000000012');
        expect(nuevo.nombre).toBe('Pedro Nuevo Representante');

        // La contraseña del usuario debe haber sido regenerada y forzar cambio obligatorio
        const usuario = await usuarioRepository.findById(nuevo.usuario_id);
        expect(usuario.must_change_password).toBe(1);
    });

    test('RF-2.4: No debería permitir cambiar a una cédula ya registrada por otro copropietario', async () => {
        await copropietarioService.crearCopropietario({
            cedula: '1721151247',
            nombre: 'Juan Uno',
            casa: 'Villa 3',
            telefono: '0987654321',
            email: 'juan3@correo.com'
        });
        await copropietarioService.crearCopropietario({
            cedula: '3000000012',
            nombre: 'Juan Dos',
            casa: 'Villa 4',
            telefono: '0987654322',
            email: 'juan4@correo.com'
        });

        await expect(copropietarioService.actualizarDatos('1721151247', {
            cedula: '3000000012'
        })).rejects.toThrow("ya está registrada en el sistema");
    });

    test('RF-2.5: el borrado lógico preserva el historial financiero e invalida las credenciales', async () => {
        const creado = await copropietarioService.crearCopropietario({
            cedula: '1721151247',
            nombre: 'Para Borrar',
            casa: 'Villa 10',
            telefono: '0987654321',
            email: 'borrar@correo.com'
        });

        // Crear una deuda pendiente asociada
        await pagoRepository.createDeuda(creado.id, '2026-07', 150.00, 'PENDIENTE', '2026-07-05');

        const result = await copropietarioService.eliminarCopropietario(creado.id);
        expect(result.mensaje).toContain("eliminado del sistema con éxito");

        // El copropietario debe tener is_deleted = 1 (borrado lógico)
        const copro = await copropietarioRepository.findById(creado.id);
        expect(copro).toBeNull(); // findById filtra is_deleted = 0

        // El usuario debe haberse eliminado físicamente
        const user = await usuarioRepository.findByUsername('villa10');
        expect(user).toBeNull();

        const deudas = await pagoRepository.getDeudasByCopropietario(creado.id);
        expect(deudas).toHaveLength(1);
    });
});
