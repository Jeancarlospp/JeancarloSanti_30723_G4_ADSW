const express = require('express');
const router = express.Router();
const multer = require('multer');
const corePagoService = require('../../core/business/services/PagoService');
const AuditPaymentServiceDecorator = require('../../core/business/patterns/auditDecorator');
const { verificarSesion, permitirSolo } = require('../middlewares/authMiddleware');

// Envolver con el decorador de auditoría (REQ012)
const decoratedPagoService = AuditPaymentServiceDecorator(corePagoService);

// RF-3.1: Comprobante bancario en imagen, máximo 5MB, sólo JPG/JPEG/PNG
const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png'];
const comprobanteUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!TIPOS_IMAGEN_PERMITIDOS.includes(file.mimetype)) {
            return cb(new Error("Formato de archivo no válido. Solo se permiten imágenes en formato JPG, JPEG o PNG."));
        }
        cb(null, true);
    }
});

function subirComprobante(req, res, next) {
    comprobanteUpload.single('comprobante')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: "El archivo es demasiado grande. El tamaño máximo permitido es 5 MB. Comprima la imagen e intente nuevamente." });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}

// Copropietario reporta un pago realizado (RF-3.1: con comprobante de imagen obligatorio)
router.post('/registrar', verificarSesion, permitirSolo('COPROPIETARIO'), subirComprobante, async (req, res) => {
    try {
        const { comprobanteId, monto, metodo, periodo } = req.body;
        const usuarioId = req.user.id; // Obtenido del middleware verificarSesion

        if (!req.file) {
            return res.status(400).json({ error: "Debe adjuntar la foto del comprobante bancario (JPG, JPEG o PNG, máximo 5MB)." });
        }

        const comprobanteImg = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

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

// RF-3.3/RF-3.4: Administrador genera la expensa (deuda) mensual para todos los copropietarios
router.post('/generar-expensas', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const { periodo, monto } = req.body;
        const resultado = await corePagoService.generarExpensasMensuales(periodo, monto);
        res.status(200).json(resultado);
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
        const id = req.params.id;
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
        const id = req.params.id;
        const { motivo } = req.body;
        
        const resultado = await corePagoService.validarRechazarPago(id, motivo);
        res.status(200).json(resultado);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// REQ006: Reporte financiero de pagos con filtros y restricción por rol
router.get('/reportes', verificarSesion, async (req, res) => {
    try {
        const list = await corePagoService.obtenerReportePagos(req.query, req.user);
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REQ006: Exportar reporte financiero a PDF
router.get('/reportes/pdf', verificarSesion, async (req, res) => {
    try {
        const pdfBuffer = await corePagoService.generarPdfReportePagos(req.query, req.user);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_pagos.pdf');
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
