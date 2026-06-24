const pagoRepository = require('../../data/pagoRepository');

function AuditPaymentServiceDecorator(baseService) {
    return {
        async procesarPago(copropietarioId, monto, comprobanteId) {
            // Guardar log antes de ejecutar (Auditoría/Validación de historial)
            pagoRepository.registrarAuditoria("INTENTO_PAGO", { copropietarioId, monto, comprobanteId });
            
            // Invocar el comportamiento core de la capa de negocio
            const resultado = await baseService.procesarPago(copropietarioId, monto, comprobanteId);
            
            // Guardar log del éxito inmutable de la transacción
            pagoRepository.registrarAuditoria("PAGO_PROCESADO_EXITO", resultado);
            return resultado;
        }
    };
}

module.exports = AuditPaymentServiceDecorator;