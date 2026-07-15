const pagoRepository = require('../../../data/repositories/pagoRepository');

function AuditPaymentServiceDecorator(baseService) {
    return {
        async procesarPago(pagoId) {
            // Registrar auditoría de intento de aprobación
            await pagoRepository.registrarAuditoria("INTENTO_APROBACION_PAGO", { 
                pagoId,
                timestamp: new Date().toISOString()
            });
            
            try {
                // Invocar la lógica de negocio base (validarAprobarPago)
                const resultado = await baseService.validarAprobarPago(pagoId);
                
                // Registrar éxito
                await pagoRepository.registrarAuditoria("PAGO_APROBADO_EXITO", {
                    pagoId,
                    reciboId: resultado.comprobante_id,
                    monto: resultado.monto_aplicado,
                    sobrepago: resultado.sobrepago,
                    timestamp: new Date().toISOString()
                });
                
                return resultado;
            } catch (err) {
                // Registrar fallo
                await pagoRepository.registrarAuditoria("APROBACION_PAGO_FALLIDA", {
                    pagoId,
                    error: err.message,
                    timestamp: new Date().toISOString()
                });
                throw err;
            }
        }
    };
}

module.exports = AuditPaymentServiceDecorator;
