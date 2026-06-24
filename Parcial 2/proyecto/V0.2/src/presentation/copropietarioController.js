const express = require('express');
const router = express.Router();
const copropietarioService = require('../business/services/copropietarioService');

// REQ004: Cargar masiva simulando filas leídas de un Excel
router.post('/importar', async (req, res) => {
    try {
        const filasExcelCrudas = req.body.filas; 
        const importados = await copropietarioService.importarMasivoDesdeExcel(filasExcelCrudas);
        res.status(200).json({ mensaje: "Importación completada con éxito", copropietarios: importados });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    const lista = await copropietarioService.obtenerTodos();
    res.status(200).json(lista);
});

module.exports = router;