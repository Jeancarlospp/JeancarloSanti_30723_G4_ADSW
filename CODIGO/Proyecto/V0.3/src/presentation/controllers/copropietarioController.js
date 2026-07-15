const express = require('express');
const router = express.Router();
const multer = require('multer');
const copropietarioService = require('../../core/business/services/CopropietarioService');
const { verificarSesion, permitirSolo } = require('../middlewares/authMiddleware');
const pagoRepository = require('../../data/repositories/pagoRepository');

// Configuración de multer en memoria para el archivo Excel
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // RF-2.1: Validar extensión .xlsx o .xls
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
            return cb(new Error("Formato de archivo inválido. Debe cargar un archivo Excel con extensión .xlsx o .xls."), false);
        }
        cb(null, true);
    }
});

// RF-2.1: Importación Masiva desde Excel con Multer
router.post('/importar', verificarSesion, permitirSolo('ADMINISTRADOR'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Debe cargar un archivo Excel." });
        }
        const resultados = await copropietarioService.importarMasivoDesdeExcel(req.file.buffer);
        res.status(200).json({ 
            mensaje: `Importación completada con éxito. ${resultados.length} registros cargados.`,
            copropietarios: resultados 
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// RF-2.1: Descargar archivo PDF con el resumen de la importación
router.post('/importar/resumen-pdf', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const { resultados } = req.body;
        if (!resultados || !Array.isArray(resultados)) {
            return res.status(400).json({ error: "Resultados inválidos para generar reporte." });
        }

        const pdfBuffer = await copropietarioService.generarPdfResumenImportacion(resultados);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=resumen_importacion.pdf');
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RF-2.2: Exportar residentes a PDF
router.get('/exportar/pdf', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const lista = await copropietarioService.obtenerTodos();
        const pdfBuffer = await copropietarioService.generarPdfLista(lista);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=residentes_aligest.pdf');
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RF-2.2: Exportar residentes a Excel
router.get('/exportar/excel', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const lista = await copropietarioService.obtenerTodos();
        const excelBuffer = copropietarioService.generarExcelLista(lista);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=residentes_aligest.xlsx');
        res.send(excelBuffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RF-2.2: Consulta General de Copropietarios (con filtros avanzados de búsqueda y rango de casas)
router.get('/', verificarSesion, async (req, res) => {
    try {
        const { nombre, casa, casaInicio, casaFin, estadoCuenta } = req.query;
        let lista = await copropietarioService.obtenerTodos();

        if (nombre) {
            const queryName = nombre.toLowerCase().trim();
            lista = lista.filter(c => c.nombre.toLowerCase().includes(queryName));
        }

        if (casa) {
            const queryCasa = casa.toLowerCase().trim();
            lista = lista.filter(c => c.casa.toLowerCase().includes(queryCasa));
        }

        // Filtro por rango de casas (ej: desde villa 1 a villa 20)
        if (casaInicio || casaFin) {
            lista = lista.filter(c => {
                // Intentar extraer los números de la villa
                const numVal = parseInt(c.casa.replace(/[^0-9]/g, ''), 10);
                if (isNaN(numVal)) return true;

                const inicio = casaInicio ? parseInt(casaInicio, 10) : 1;
                const fin = casaFin ? parseInt(casaFin, 10) : 9999;
                return numVal >= inicio && numVal <= fin;
            });
        }

        if (estadoCuenta) {
            const est = estadoCuenta.toLowerCase().trim();
            if (est === 'saldado') {
                lista = lista.filter(c => c.saldo <= 0);
            } else if (est === 'deudor') {
                lista = lista.filter(c => c.saldo > 0);
            }
        }

        res.status(200).json(lista);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RF-2.4: Modificar copropietario
router.put('/:cedula', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const { cedula } = req.params;
        const datos = req.body;
        const actualizado = await copropietarioService.actualizarDatos(cedula, datos);
        res.status(200).json({ mensaje: "Copropietario actualizado correctamente.", copropietario: actualizado });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// RF-2.5: Eliminación física controlada con advertencia de historial
router.delete('/:id', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { confirmar } = req.query;

        // Comprobar si tiene historial financiero
        const deudasPendientes = await pagoRepository.countPendingDeudas(id);
        if (deudasPendientes > 0) {
            return res.status(400).json({ error: "No se permite eliminar un residente con deudas pendientes." });
        }

        const tienePagos = await pagoRepository.countPayments(id);
        if (tienePagos > 0 && confirmar !== 'true') {
            // Advierte al administrador y solicita confirmación adicional
            return res.status(202).json({ 
                advertencia: "HISTORIAL_ACTIVO",
                mensaje: "ADVERTENCIA: Este copropietario tiene historial de pagos registrado. Eliminar este registro puede afectar reportes históricos y estadísticas. ¿Desea continuar de todas formas?"
            });
        }

        const result = await copropietarioService.eliminarCopropietario(id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
