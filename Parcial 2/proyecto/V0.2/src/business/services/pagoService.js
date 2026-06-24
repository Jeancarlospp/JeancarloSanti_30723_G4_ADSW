const pagoRepository = require('../../data/pagoRepository');
const { CalculadorMoraContext, EcuandorianMora12Strategy } = require('../patterns/moraStrategy');

class PagoService {
    async procesarPago(copropietarioId, monto, comprobanteId) {
        const deudas = await pagoRepository.getDeudasAntiguas(copropietarioId);
        let montoRestante = monto;
        
        const calculadora = new CalculadorMoraContext(new EcuandorianMora12Strategy());

        // Procesar deudas aplicando de más antigua a más nueva (REQ012)
        for (const deuda of deudas) {
            if (montoRestante <= 0) break;

            // Simulación básica de cálculo de mora si aplica por retraso de días
            const mora = calculadora.calcular(deuda.monto, 15); // Ejemplo: 15 días vencidos
            const totalDeudaConMora = deuda.monto + mora;

            if (montoRestante >= totalDeudaConMora) {
                montoRestante -= totalDeudaConMora;
                deuda.estado = 'PAGADO';
            } else {
                deuda.monto = totalDeudaConMora - montoRestante;
                montoRestante = 0;
            }
        }

        // Registrar transacción inmutable
        await pagoRepository.registrarPagoInmutable(comprobanteId, copropietarioId, monto, 'APROBADO');

        return {
            comprobante_id: comprobanteId,
            monto_aplicado: monto,
            sobrepago: montoRestante,
            estado_transaccion: 'PROCESADO_E_INMUTABLE'
        };
    }
}

module.exports = new PagoService();