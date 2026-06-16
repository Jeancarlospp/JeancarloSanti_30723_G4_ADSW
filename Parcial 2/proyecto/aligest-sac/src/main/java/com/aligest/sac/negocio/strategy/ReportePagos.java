package com.aligest.sac.negocio.strategy;

import com.aligest.sac.datos.entidades.EstadoCuenta;
import java.util.ArrayList;
import java.util.List;

public class ReportePagos implements IEstrategiaReporte {

    @Override
    public List<String> generar(String filtro, List<?> datos) {
        List<String> reporte = new ArrayList<>();
        reporte.add("=== REPORTE DE PAGOS ===");
        reporte.add("Filtro aplicado: " + filtro);
        for (Object obj : datos) {
            if (obj instanceof EstadoCuenta) {
                EstadoCuenta e = (EstadoCuenta) obj;
                if (e.getEstado().equals("PAGADO")) {
                    reporte.add("Copropietario ID: " + e.getCopropietarioId()
                            + " | Periodo: " + e.getPeriodo()
                            + " | Total pagado: " + e.calcularTotal());
                }
            }
        }
        return reporte;
    }
}