const express = require('express');
const router = express.Router();
const multer = require('multer');
const copropietarioService = require('../../core/business/services/CopropietarioService');
const { verificarSesion, permitirSolo } = require('../middlewares/authMiddleware');
const pagoRepository = require('../../data/repositories/pagoRepository');

// Configuración de multer en memoria para el archivo Excel
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // RF-2.1: Validar extensión .xlsx o .xls
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
            return cb(new Error("Formato de archivo inválido. Debe cargar un archivo Excel con extensión .xlsx o .xls."), false);
        }
        cb(null, true);
    }
});

function subirExcel(req, res, next) {
    upload.single('file')(req, res, (err) => {
        if (!err) return next();
        const mensaje = err.code === 'LIMIT_FILE_SIZE'
            ? 'El archivo Excel supera el tamaño máximo permitido de 10 MB.'
            : err.message;
        return res.status(400).json({ error: mensaje });
    });
}

function aplicarFiltros(lista, query = {}) {
    const { nombre, casa, casaInicio, casaFin, estadoCuenta, perfil, estadoUsuario } = query;
    if (nombre) lista = lista.filter(c => c.nombre.toLowerCase().includes(nombre.toLowerCase().trim()));
    if (casa) lista = lista.filter(c => c.casa.toLowerCase().includes(casa.toLowerCase().trim()));
    if (casaInicio || casaFin) {
        const inicio = casaInicio ? parseInt(casaInicio, 10) : 1;
        const fin = casaFin ? parseInt(casaFin, 10) : 9999;
        lista = lista.filter(c => {
            const numero = parseInt(c.casa.replace(/[^0-9]/g, ''), 10);
            return Number.isNaN(numero) || (numero >= inicio && numero <= fin);
        });
    }
    if (estadoCuenta === 'saldado') lista = lista.filter(c => c.saldo <= 0);
    if (estadoCuenta === 'deudor') lista = lista.filter(c => c.saldo > 0);
    if (perfil) lista = lista.filter(c => c.perfil === perfil);
    if (estadoUsuario) lista = lista.filter(c => c.estado_usuario === estadoUsuario);
    return lista;
}

// Registrar Copropietario Manualmente (con creación automática de cuenta)
router.post('/', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const datos = req.body;
        const resultado = await copropietarioService.crearCopropietario(datos);
        res.status(201).json({ 
            mensaje: "Copropietario registrado con éxito.", 
            copropietario: resultado 
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// RF-2.1: Importación Masiva desde Excel con Multer
router.post('/importar', verificarSesion, permitirSolo('ADMINISTRADOR'), subirExcel, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Debe cargar un archivo Excel." });
        }
        const resumen = await copropietarioService.importarMasivoDesdeExcel(req.file.buffer);
        res.status(200).json({ 
            mensaje: `Importación completada. ${resumen.exitosos} registros exitosos, ${resumen.fallidos} registros con errores. Descargue el resumen.`,
            resumen,
            copropietarios: resumen.importados
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// RF-2.1: Descargar archivo PDF con el resumen de la importación
router.post('/importar/resumen-pdf', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const { resumen, resultados } = req.body;
        const datosResumen = resumen || (Array.isArray(resultados) ? {
            importados: resultados, errores: [], advertencias: [],
            totalProcesados: resultados.length, exitosos: resultados.length, fallidos: 0
        } : null);
        if (!datosResumen || !Array.isArray(datosResumen.importados)) {
            return res.status(400).json({ error: "Resultados inválidos para generar reporte." });
        }

        const pdfBuffer = await copropietarioService.generarPdfResumenImportacion(datosResumen);
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
        const lista = aplicarFiltros(await copropietarioService.obtenerTodos(), req.query);
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
        const lista = aplicarFiltros(await copropietarioService.obtenerTodos(), req.query);
        const excelBuffer = copropietarioService.generarExcelLista(lista);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=residentes_aligest.xlsx');
        res.send(excelBuffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// El copropietario obtiene exclusivamente su propia ficha; la nómina general
// queda reservada al Administrador (RF-2.2 y privacidad de RF-2.3).
router.get('/me', verificarSesion, permitirSolo('COPROPIETARIO'), async (req, res) => {
    try {
        const propio = await copropietarioService.obtenerPorUsuarioId(req.user.id);
        if (!propio) return res.status(404).json({ error: "No se encontró el perfil del copropietario autenticado." });
        res.status(200).json(propio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RF-2.2: Consulta General de Copropietarios (con filtros avanzados de búsqueda y rango de casas)
router.get('/', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const { nombre, casa, casaInicio, casaFin, estadoCuenta, perfil, estadoUsuario } = req.query;
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

        if (perfil) lista = lista.filter(c => c.perfil === perfil);
        if (estadoUsuario) lista = lista.filter(c => c.estado_usuario === estadoUsuario);

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
        const id = req.params.id;
        const { confirmar } = req.query;

        // Comprobar si tiene historial financiero o deuda pendiente.
        const deudasPendientes = await pagoRepository.countPendingDeudas(id);
        const tienePagos = await pagoRepository.countPayments(id);
        if ((tienePagos > 0 || deudasPendientes > 0) && confirmar !== 'true') {
            // Advierte al administrador y solicita confirmación adicional
            return res.status(202).json({ 
                advertencia: "HISTORIAL_ACTIVO",
                mensaje: `ADVERTENCIA: Este copropietario tiene ${tienePagos} pago(s) registrado(s) y ${deudasPendientes} deuda(s) pendiente(s). Su registro se desactivará, pero el historial financiero se conservará para auditoría. ¿Desea continuar de todas formas?`
            });
        }

        const result = await copropietarioService.eliminarCopropietario(id);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
