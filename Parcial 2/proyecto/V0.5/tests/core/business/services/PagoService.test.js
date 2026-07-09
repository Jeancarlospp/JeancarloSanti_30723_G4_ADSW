const pagoService = require('../../../../src/core/business/services/PagoService');
const copropietarioService = require('../../../../src/core/business/services/CopropietarioService');
const pagoRepository = require('../../../../src/data/repositories/pagoRepository');
const copropietarioRepository = require('../../../../src/data/repositories/copropietarioRepository');
const notificationService = require('../../../../src/core/business/services/NotificationService');

describe('PagoService (Integration with MongoDB Memory Server)', () => {
    let copro;
    let usuarioId;

    beforeEach(async () => {
        // Crear un residente para asociarle deudas y pagos
        copro = await copropietarioService.crearCopropietario({
            cedula: '1721151247',
            nombre: 'Juan Perez',
            casa: 'Villa 14',
            telefono: '0987654321',
            email: 'juan@correo.com',
            saldo: 200.00 // Deuda total de saldo declarada
        });
        const coproDb = await copropietarioRepository.findById(copro.id);
        usuarioId = coproDb.usuario_id;
    });

    test('Debería reportar un pago correctamente en estado PENDIENTE_VALIDACION', async () => {
        const result = await pagoService.reportarPagoCopropietario(
            usuarioId,
            'TRANS-1002',
            100.00,
            'TRANSFERENCIA',
            '2026-07',
            'evidencia_base64'
        );

        expect(result.mensaje).toContain("pendiente de verificación");

        const pendientes = await pagoService.obtenerPagosPendientes();
        expect(pendientes).toHaveLength(1);
        expect(pendientes[0].comprobante_id).toBe('TRANS-1002');
        expect(pendientes[0].monto_pagado).toBe(100.00);
        expect(pendientes[0].estado).toBe('PENDIENTE_VALIDACION');
    });

    test('Debería fallar si el copropietario reporta un pago con monto no positivo', async () => {
        await expect(pagoService.reportarPagoCopropietario(
            usuarioId,
            'TRANS-1002',
            -50.00,
            'TRANSFERENCIA',
            '2026-07',
            'img'
        )).rejects.toThrow("monto reportado debe ser un número positivo");
    });

    test('Debería aplicar amortización FIFO e interés de mora del 12% al aprobar un pago', async () => {
        // Creamos dos deudas:
        // Deuda 1: Vencida. Monto $100. Vencimiento: hace 10 días
        // Deuda 2: Vigente. Monto $100. Vencimiento: en el futuro (10 días)
        const fechaReferencia = new Date('2026-07-20');
        const vencimientoDeuda1 = '2026-07-10'; // 10 días de retraso
        const vencimientoDeuda2 = '2026-07-30'; // Vigente

        const d1Id = await pagoRepository.createDeuda(copro.id, '2026-06', 100.00, 'PENDIENTE', vencimientoDeuda1);
        const d2Id = await pagoRepository.createDeuda(copro.id, '2026-07', 100.00, 'PENDIENTE', vencimientoDeuda2);

        // Reportar un pago de $150.00
        await pagoService.reportarPagoCopropietario(
            usuarioId,
            'TRANS-FIFO',
            150.00,
            'TRANSFERENCIA',
            '2026-07',
            'img'
        );

        const pendientes = await pagoService.obtenerPagosPendientes();
        const pagoId = pendientes[0].id;

        // Spy de notificaciones de WhatsApp para verificar su llamada
        const spyNotif = jest.spyOn(notificationService, 'enviarNotificacionPago');

        // Aprobamos el pago pasando la fecha congelada de referencia (2026-07-20)
        const resultado = await pagoService.validarAprobarPago(pagoId, fechaReferencia);

        expect(resultado.estado_transaccion).toBe('APROBADO_E_INMUTABLE');
        expect(resultado.comprobante_id).toContain('AGE-'); // Recibo digital inmutable
        
        // --- Cálculo Matemático de Amortización FIFO ---
        // Deuda 1 (retraso de 10 días):
        // Interés = 100 * (0.12 / 365) * 10 = 0.3287 -> Redondeado a 0.33
        // Total con mora = 100.33
        // El pago fue de $150.00.
        // Se cancela Deuda 1 al completo (consume 100.33 del pago).
        // Queda para amortizar: 150.00 - 100.33 = $49.67.
        // Deuda 2 (Vigente):
        // Mora = 0 (no vencida).
        // Se aplica el capital restante de 49.67 directamente.
        // Nuevo saldo de la Deuda 2: 100.00 - 49.67 = $50.33.

        const deudasActualizadas = await pagoRepository.getDeudasByCopropietario(copro.id);
        const de1 = deudasActualizadas.find(d => d.id === d1Id);
        const de2 = deudasActualizadas.find(d => d.id === d2Id);

        expect(de1.estado).toBe('PAGADO');
        expect(de1.monto).toBe(0); // Cancelada por completo
        
        expect(de2.estado).toBe('PENDIENTE');
        expect(de2.monto).toBe(50.33); // Amortizada parcialmente

        // El saldo de cuenta total del copropietario debió debitarse: 200.00 - 150.00 = $50.00
        const coproActualizado = await copropietarioRepository.findById(copro.id);
        expect(coproActualizado.saldo).toBe(50.00);

        // Se debió enviar la notificación por WhatsApp
        expect(spyNotif).toHaveBeenCalled();

        spyNotif.mockRestore();
    });

    test('Debería rechazar un pago correctamente y notificar al copropietario', async () => {
        await pagoService.reportarPagoCopropietario(
            usuarioId,
            'TRANS-RECHAZO',
            100.00,
            'TRANSFERENCIA',
            '2026-07',
            'img'
        );

        const pendientes = await pagoService.obtenerPagosPendientes();
        const pagoId = pendientes[0].id;

        const res = await pagoService.validarRechazarPago(pagoId, "Comprobante borroso");
        expect(res.mensaje).toContain("rechazado y notificado");

        // El estado del pago debe ser RECHAZADO en la BD
        const pagoDb = await pagoRepository.findPagoById(pagoId);
        expect(pagoDb.estado).toBe('RECHAZADO');
        expect(pagoDb.motivo_rechazo).toBe("Comprobante borroso");
    });
});
