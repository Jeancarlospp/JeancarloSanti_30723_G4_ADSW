const notificationService = require('../../../../src/core/business/services/NotificationService');
const pagoRepository = require('../../../../src/data/repositories/pagoRepository');

async function esperarCola() {
    await new Promise(resolve => setTimeout(resolve, 0));
    for (let i = 0; i < 200; i++) {
        if (!notificationService.procesando && notificationService.cola.length === 0) return;
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    throw new Error('La cola de notificaciones no terminó dentro del tiempo de prueba.');
}

describe('NotificationService RF-04', () => {
    beforeEach(() => {
        notificationService.cola = [];
        notificationService.pendientesReintento = [];
        notificationService.procesando = false;
        jest.restoreAllMocks();
    });

    afterEach(async () => {
        if (notificationService.procesando) await esperarCola();
    });

    test('registra una notificación exitosa con tipo, destinatario, fecha e intentos', async () => {
        await notificationService.enviarNotificacionRechazo('+593987654321', 'REF-1', 50, 'Ilegible');
        await esperarCola();

        const registros = await pagoRepository.getNotificaciones();
        expect(registros).toHaveLength(1);
        expect(registros[0]).toEqual(expect.objectContaining({
            tipo: 'RECHAZO_PAGO', telefono: '+593987654321', estado: 'EXITOSO', intentos: 1
        }));
        expect(registros[0].mensaje).toContain('Ilegible');
    });

    test('registra advertencia si no existe teléfono', async () => {
        const resultado = await notificationService.enviarNotificacionPago('', 'REC-1', 50, 0);
        expect(resultado.estado).toBe('FALLIDO');
        const registros = await pagoRepository.getNotificaciones();
        expect(registros[0].error).toContain('sin teléfono registrado');
    });

    test('reintenta tres veces y conserva el mensaje en cola de pendientes', async () => {
        jest.spyOn(notificationService, 'simularApiWhatsApp').mockRejectedValue(new Error('Servicio no disponible'));
        await notificationService.enviarNotificacionMora('+593987654321', 'Ana', 'Casa 1', 12);
        await esperarCola();

        const registros = await pagoRepository.getNotificaciones();
        expect(registros[0].estado).toBe('FALLIDO');
        expect(registros[0].intentos).toBe(3);
        expect(notificationService.pendientesReintento).toHaveLength(1);
    });
});
