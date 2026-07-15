const express = require('express');
const router = express.Router();
const corePagoService = require('../../core/business/services/PagoService');
const AuditPaymentServiceDecorator = require('../../core/business/patterns/auditDecorator');
const { verificarSesion, permitirSolo } = require('../middlewares/authMiddleware');

// Envolver con el decorador de auditoría (REQ012)
const decoratedPagoService = AuditPaymentServiceDecorator(corePagoService);

// Copropietario reporta un pago realizado
router.post('/registrar', verificarSesion, permitirSolo('COPROPIETARIO'), async (req, res) => {
    try {
        const { comprobanteId, monto, metodo, periodo, comprobanteImg } = req.body;
        const usuarioId = req.user.id; // Obtenido del middleware verificarSesion

        const result = await corePagoService.reportarPagoCopropietario(
            usuarioId, 
            comprobanteId, 
            parseFloat(monto), 
            metodo, 
            periodo, 
            comprobanteImg
        );

        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Administrador lista los pagos pendientes de validación
router.get('/pendientes', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const list = await corePagoService.obtenerPagosPendientes();
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Administrador aprueba el pago (con decorador de auditoría y FIFO)
router.post('/:id/aprobar', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const resultado = await decoratedPagoService.procesarPago(id); // Ejecuta procesarPago decorado
        res.status(200).json({ 
            mensaje: "Pago validado y aprobado correctamente.", 
            comprobanteDigital: resultado 
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Administrador rechaza el pago
router.post('/:id/rechazar', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { motivo } = req.body;
        
        const resultado = await corePagoService.validarRechazarPago(id, motivo);
        res.status(200).json(resultado);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Copropietario consulta sus propios pagos
router.get('/copropietario/pagos', verificarSesion, permitirSolo('COPROPIETARIO'), async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const list = await corePagoService.obtenerPagosCopropietario(usuarioId);
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Copropietario consulta sus propias deudas
router.get('/copropietario/deudas', verificarSesion, permitirSolo('COPROPIETARIO'), async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const list = await corePagoService.obtenerDeudasCopropietario(usuarioId);
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Descargar Recibo Digital en PDF
router.get('/recibo/:reciboId', verificarSesion, async (req, res) => {
    try {
        const { reciboId } = req.params;
        const pdfBuffer = await corePagoService.generarPdfRecibo(reciboId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=recibo_${reciboId}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
