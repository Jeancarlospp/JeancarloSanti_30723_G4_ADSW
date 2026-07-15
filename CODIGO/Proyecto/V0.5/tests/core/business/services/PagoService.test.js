const pagoService = require('../../../../src/core/business/services/PagoService');
const copropietarioService = require('../../../../src/core/business/services/CopropietarioService');
const pagoRepository = require('../../../../src/data/repositories/pagoRepository');
const copropietarioRepository = require('../../../../src/data/repositories/copropietarioRepository');
const notificationService = require('../../../../src/core/business/services/NotificationService');
const { Pago } = require('../../../../config/database');

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

        expect(result.mensaje).toContain("Número de solicitud");
        expect(result.solicitudId).toBeDefined();

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
        // Deuda 1 (vencida, recargo fijo del 12% aplicado una sola vez - RF-3.3):
        // Interés = 100 * 0.12 = 12.00
        // Total con mora = 112.00
        // El pago fue de $150.00.
        // Se cancela Deuda 1 al completo (consume 112.00 del pago).
        // Queda para amortizar: 150.00 - 112.00 = $38.00.
        // Deuda 2 (Vigente):
        // Mora = 0 (no vencida).
        // Se aplica el capital restante de 38.00 directamente.
        // Nuevo saldo de la Deuda 2: 100.00 - 38.00 = $62.00.

        const deudasActualizadas = await pagoRepository.getDeudasByCopropietario(copro.id);
        const de1 = deudasActualizadas.find(d => d.id === d1Id);
        const de2 = deudasActualizadas.find(d => d.id === d2Id);

        expect(de1.estado).toBe('PAGADO');
        expect(de1.monto).toBe(0); // Cancelada por completo

        expect(de2.estado).toBe('PENDIENTE');
        expect(de2.monto).toBe(62.00); // Amortizada parcialmente

        // El saldo incorpora primero $12 de mora y luego debita el pago: 200 + 12 - 150 = 62.
        const coproActualizado = await copropietarioRepository.findById(copro.id);
        expect(coproActualizado.saldo).toBe(62.00);

        const pagoPersistido = await Pago.findById(pagoId);
        expect(pagoPersistido.recibo_pdf.length).toBeGreaterThan(100);
        expect(pagoPersistido.aplicaciones).toHaveLength(2);

        // Se debió enviar la notificación por WhatsApp
        expect(spyNotif).toHaveBeenCalled();

        spyNotif.mockRestore();
    });

    test('RF-3.3: no vuelve a aplicar el recargo del 12% al mismo período', async () => {
        const fechaReferencia = new Date('2026-07-20');
        const deudaId = await pagoRepository.createDeuda(copro.id, '2026-06', 100, 'PENDIENTE', '2026-07-05');

        await pagoService.reportarPagoCopropietario(usuarioId, 'PAGO-1', 50, 'TRANSFERENCIA', '2026-06', 'img');
        let pendiente = (await pagoService.obtenerPagosPendientes())[0];
        const primera = await pagoService.validarAprobarPago(pendiente.id, fechaReferencia);
        expect(primera.recargo_mora_aplicado).toBe(12);

        let deuda = (await pagoRepository.getDeudasByCopropietario(copro.id)).find(d => d.id === deudaId);
        expect(deuda.monto).toBe(62);
        expect(deuda.mora_aplicada).toBe(true);

        await pagoService.reportarPagoCopropietario(usuarioId, 'PAGO-2', 62, 'TRANSFERENCIA', '2026-06', 'img');
        pendiente = (await pagoService.obtenerPagosPendientes())[0];
        const segunda = await pagoService.validarAprobarPago(pendiente.id, new Date('2026-08-20'));
        expect(segunda.recargo_mora_aplicado).toBe(0);

        deuda = (await pagoRepository.getDeudasByCopropietario(copro.id)).find(d => d.id === deudaId);
        expect(deuda.estado).toBe('PAGADO');
        expect(deuda.monto).toBe(0);
    });

    test('RNF-02: una reserva atómica impide aprobar dos veces el mismo pago concurrentemente', async () => {
        await pagoService.reportarPagoCopropietario(usuarioId, 'PAGO-CONCURRENTE', 25, 'TRANSFERENCIA', '2026-07', 'img');
        const pagoId = (await pagoService.obtenerPagosPendientes())[0].id;

        const resultados = await Promise.allSettled([
            pagoService.validarAprobarPago(pagoId, new Date('2026-07-20')),
            pagoService.validarAprobarPago(pagoId, new Date('2026-07-20'))
        ]);

        expect(resultados.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        expect(resultados.filter(r => r.status === 'rejected')).toHaveLength(1);
        expect((await pagoRepository.findPagoById(pagoId)).estado).toBe('APROBADO');
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

    test('Debería generar la expensa mensual para todos los copropietarios con vencimiento el día 5 del mes siguiente', async () => {
        const resultado = await pagoService.generarExpensasMensuales('2026-08', 100.00);

        expect(resultado.generadas).toBe(1);
        expect(resultado.omitidas).toBe(0);
        expect(resultado.fechaVencimiento).toBe('2026-09-05');

        const deudas = await pagoRepository.getDeudasByCopropietario(copro.id);
        const deudaGenerada = deudas.find(d => d.mes === '2026-08');
        expect(deudaGenerada).toBeDefined();
        expect(deudaGenerada.monto).toBe(100.00);
        expect(deudaGenerada.estado).toBe('PENDIENTE');
        expect(deudaGenerada.fecha_vencimiento).toBe('2026-09-05');
        expect((await copropietarioRepository.findById(copro.id)).saldo).toBe(300.00);
    });

    test('No debería duplicar la expensa mensual si ya fue generada para el mismo período', async () => {
        await pagoService.generarExpensasMensuales('2026-08', 100.00);
        const segundaVez = await pagoService.generarExpensasMensuales('2026-08', 100.00);

        expect(segundaVez.generadas).toBe(0);
        expect(segundaVez.omitidas).toBe(1);

        const deudas = await pagoRepository.getDeudasByCopropietario(copro.id);
        expect(deudas.filter(d => d.mes === '2026-08')).toHaveLength(1);
        expect((await copropietarioRepository.findById(copro.id)).saldo).toBe(300.00);
    });

    test('Debería rechazar un período con formato inválido', async () => {
        await expect(pagoService.generarExpensasMensuales('agosto-2026', 100.00))
            .rejects.toThrow("formato YYYY-MM");
    });

    test('Debería calcular el vencimiento de diciembre pasando correctamente al año siguiente', async () => {
        const resultado = await pagoService.generarExpensasMensuales('2026-12', 100.00);
        expect(resultado.fechaVencimiento).toBe('2027-01-05');
    });
});
