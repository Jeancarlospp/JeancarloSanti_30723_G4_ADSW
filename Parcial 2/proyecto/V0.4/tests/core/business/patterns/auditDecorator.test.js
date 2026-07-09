const AuditPaymentServiceDecorator = require('../../../../src/core/business/patterns/auditDecorator');
const pagoRepository = require('../../../../src/data/repositories/pagoRepository');

jest.mock('../../../../src/data/repositories/pagoRepository');

describe('AuditPaymentServiceDecorator', () => {
    let mockBaseService;
    let decoratedService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockBaseService = {
            validarAprobarPago: jest.fn()
        };
        decoratedService = AuditPaymentServiceDecorator(mockBaseService);
    });

    test('Debería registrar auditoría de intento de aprobación y éxito', async () => {
        const mockResultado = {
            comprobante_id: 'RECIBO-123',
            monto_aplicado: 100,
            sobrepago: 10
        };
        mockBaseService.validarAprobarPago.mockResolvedValue(mockResultado);
        pagoRepository.registrarAuditoria.mockResolvedValue('AUDIT-ID');

        const res = await decoratedService.procesarPago('PAGO-123');

        expect(res).toEqual(mockResultado);
        expect(pagoRepository.registrarAuditoria).toHaveBeenCalledTimes(2);
        
        // Primer llamado: INTENTO_APROBACION_PAGO
        expect(pagoRepository.registrarAuditoria).toHaveBeenNthCalledWith(
            1,
            "INTENTO_APROBACION_PAGO",
            expect.objectContaining({ pagoId: 'PAGO-123' })
        );
        
        // Segundo llamado: PAGO_APROBADO_EXITO
        expect(pagoRepository.registrarAuditoria).toHaveBeenNthCalledWith(
            2,
            "PAGO_APROBADO_EXITO",
            expect.objectContaining({
                pagoId: 'PAGO-123',
                reciboId: 'RECIBO-123',
                monto: 100,
                sobrepago: 10
            })
        );
    });

    test('Debería registrar auditoría de fallo si el servicio base lanza un error', async () => {
        const mockError = new Error("Saldo insuficiente");
        mockBaseService.validarAprobarPago.mockRejectedValue(mockError);
        pagoRepository.registrarAuditoria.mockResolvedValue('AUDIT-ID');

        await expect(decoratedService.procesarPago('PAGO-123')).rejects.toThrow("Saldo insuficiente");

        expect(pagoRepository.registrarAuditoria).toHaveBeenCalledTimes(2);
        
        // Primer llamado: INTENTO_APROBACION_PAGO
        expect(pagoRepository.registrarAuditoria).toHaveBeenNthCalledWith(
            1,
            "INTENTO_APROBACION_PAGO",
            expect.objectContaining({ pagoId: 'PAGO-123' })
        );
        
        // Segundo llamado: APROBACION_PAGO_FALLIDA
        expect(pagoRepository.registrarAuditoria).toHaveBeenNthCalledWith(
            2,
            "APROBACION_PAGO_FALLIDA",
            expect.objectContaining({
                pagoId: 'PAGO-123',
                error: "Saldo insuficiente"
            })
        );
    });
});
