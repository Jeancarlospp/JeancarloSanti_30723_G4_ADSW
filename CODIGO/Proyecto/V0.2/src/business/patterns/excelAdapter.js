// Convierte filas crudas de un archivo (objeto plano mapeado) al dominio interno de Copropietario
class ExcelCopropietarioAdapter {
    static adaptRow(externalRow) {
        return {
            cedula: externalRow["ID_Nacional"] || externalRow["cedula"],
            nombre: externalRow["Nombre_Completo"] || externalRow["nombre"],
            casa: externalRow["Num_Villa"] || externalRow["casa"],
            telefono: externalRow["Celular"] || externalRow["telefono"],
            saldo: parseFloat(externalRow["Saldo_Inicial"] || 0)
        };
    }
}

module.exports = ExcelCopropietarioAdapter;