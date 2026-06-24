const express = require('express');
const router = express.Router();
const corePagoService = require('../business/services/pagoService');
const AuditPaymentServiceDecorator = require('../business/patterns/auditDecorator');

// Envolver el servicio con el decorador de auditoría antes de usarlo
const decoratedPagoService = AuditPaymentServiceDecorator(corePagoService);

router.post('/registrar', async (req, res) => {
    try {
        const { copropietarioId, monto, comprobanteId } = req.body;
        const comprobanteDigital = await decoratedPagoService.procesarPago(copropietarioId, monto, comprobanteId);
        
        // REQ013 Notificación simulada por WhatsApp API
        console.log(`[WhatsApp API Notification] Enviado al Copropietario ID: ${copropietarioId} -> Su pago con comprobante ${comprobanteId} ha sido procesado.`);
        
        res.status(200).json({ mensaje: "Comprobante digital inmutable generado con éxito", comprobanteDigital });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;