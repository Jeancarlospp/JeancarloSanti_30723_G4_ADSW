const copropietarioRepository = require('../../data/copropietarioRepository');
const ExcelCopropietarioAdapter = require('../patterns/excelAdapter');

class CopropietarioService {
    async importarMasivoDesdeExcel(rows) {
        const procesados = [];
        for (const rawRow of rows) {
            const copropietario = ExcelCopropietarioAdapter.adaptRow(rawRow);
            
            // Validación critica: Cédula y Casa Única (REQ004)
            const existente = await copropietarioRepository.findByCedula(copropietario.cedula);
            if (!existente) {
                await copropietarioRepository.create(copropietario);
                procesados.push(copropietario);
            }
        }
        return procesados;
    }

    async obtenerTodos() {
        return await copropietarioRepository.findAll();
    }

    async actualizarDatos(cedula, datos) {
        return await copropietarioRepository.update(cedula, datos);
    }
}

module.exports = new CopropietarioService();