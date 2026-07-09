class ExcelCopropietarioAdapter {
      static adaptRow(externalRow) {
          if (!externalRow) {
              throw new Error("Fila de hoja de cálculo nula o indefinida.");
          }
          
          // Mapeo dinámico y flexible de cabeceras de Excel (RF-2.1)
          const cedula = externalRow["Cédula"] || externalRow["Cedula"] || externalRow["ID_Nacional"] || externalRow["Cédula de Identidad"] || "";
          const nombre = externalRow["Nombre Completo"] || externalRow["Nombre_Completo"] || externalRow["Nombre"] || "";
          const casa = externalRow["Número Casa"] || externalRow["Número de Casa"] || externalRow["Numero Casa"] || externalRow["Num_Villa"] || externalRow["Casa"] || "";
          const telefono = externalRow["Teléfono"] || externalRow["Telefono"] || externalRow["Celular"] || "";
          const email = externalRow["Correo Electrónico"] || externalRow["Correo"] || externalRow["Email"] || externalRow["Correo electronico"] || "";
          const saldo = parseFloat(externalRow["Saldo Inicial"] || externalRow["Saldo"] || externalRow["Saldo_Inicial"] || 0.0);

          return {
              cedula: String(cedula).trim(),
              nombre: String(nombre).trim(),
              casa: String(casa).trim(),
              telefono: String(telefono).trim(),
              email: String(email).trim(),
              saldo: isNaN(saldo) ? 0.0 : saldo
          };
      }
  }

  module.exports = ExcelCopropietarioAdapter;
