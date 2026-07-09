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
            { "Cédula": "1721151247", "Nombre Completo": "Juan Perez", "Número Casa": "Villa 1", "Teléfono": "0987654321", "Correo": "juan@correo.com", "Saldo Inicial": 100 },
            { "Cédula": "0921151247", "Nombre Completo": "Maria Gomez", "Número Casa": "Villa 2", "Teléfono": "0987654322", "Correo": "maria@correo.com", "Saldo Inicial": 0 }
        ];
        const buffer = crearExcelMock(filas);

        const importados = await copropietarioService.importarMasivoDesdeExcel(buffer);

        expect(importados).toHaveLength(2);
        expect(importados[0].username).toBe('villa1');
        expect(importados[1].username).toBe('villa2');

        const todos = await copropietarioService.obtenerTodos();
        expect(todos).toHaveLength(2);
    });

    test('Debería abortar toda la importación masiva si existe una sola fila inválida (Atomicidad)', async () => {
        const filas = [
            { "Cédula": "1721151247", "Nombre Completo": "Juan Perez", "Número Casa": "Villa 1", "Correo": "juan@correo.com" },
            { "Cédula": "1721151241", "Nombre Completo": "Fila Invalida", "Número Casa": "Villa 2", "Correo": "invalido" } // Correo y cédula inválida
        ];
        const buffer = crearExcelMock(filas);

        await expect(copropietarioService.importarMasivoDesdeExcel(buffer))
            .rejects.toThrow("Importación cancelada por errores de validación");

        // No debe haberse guardado ningún copropietario en la base de datos
        const todos = await copropietarioService.obtenerTodos();
        expect(todos).toHaveLength(0);
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
            casa: 'Villa 1B',
            telefono: '0987654320',
            email: 'juanmodificado@correo.com'
        });

        expect(actualizados.nombre).toBe('Juan Modificado');
        expect(actualizados.casa).toBe('Villa 1B');

        const copro = await copropietarioRepository.findByCedula('1721151247');
        expect(copro.nombre).toBe('Juan Modificado');
        expect(copro.casa).toBe('Villa 1B');
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

    test('Debería bloquear la eliminación si tiene deudas pendientes y realizar borrado lógico/físico correcto si está solvente', async () => {
        const creado = await copropietarioService.crearCopropietario({
            cedula: '1721151247',
            nombre: 'Para Borrar',
            casa: 'Villa 10',
            telefono: '0987654321',
            email: 'borrar@correo.com'
        });

        // Crear una deuda pendiente asociada
        await pagoRepository.createDeuda(creado.id, '2026-07', 150.00, 'PENDIENTE', '2026-07-05');

        // Intentar eliminar (debe fallar)
        await expect(copropietarioService.eliminarCopropietario(creado.id))
            .rejects.toThrow("No se permite eliminar un copropietario con deudas pendientes.");

        // Marcar la deuda como PAGADA
        const deudas = await pagoRepository.getDeudasByCopropietario(creado.id);
        await pagoRepository.updateDeuda(deudas[0].id, 'PAGADO', 0);

        // Intentar eliminar de nuevo (debe ser exitoso ahora)
        const result = await copropietarioService.eliminarCopropietario(creado.id);
        expect(result.mensaje).toContain("eliminado del sistema con éxito");

        // El copropietario debe tener is_deleted = 1 (borrado lógico)
        const copro = await copropietarioRepository.findById(creado.id);
        expect(copro).toBeNull(); // findById filtra is_deleted = 0

        // El usuario debe haberse eliminado físicamente
        const user = await usuarioRepository.findByUsername('villa10');
        expect(user).toBeNull();
    });
});
