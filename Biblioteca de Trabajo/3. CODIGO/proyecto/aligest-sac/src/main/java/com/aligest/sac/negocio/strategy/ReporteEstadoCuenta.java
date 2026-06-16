package com.aligest.sac.negocio.strategy;

import com.aligest.sac.datos.entidades.EstadoCuenta;
import java.util.ArrayList;
import java.util.List;

public class ReporteEstadoCuenta implements IEstrategiaReporte {

    @Override
    public List<String> generar(String filtro, List<?> datos) {
        List<String> reporte = new ArrayList<>();
        reporte.add("=== REPORTE DE ESTADO DE CUENTA ===");
        reporte.add("Filtro aplicado: " + filtro);
        for (Object obj : datos) {
            if (obj instanceof EstadoCuenta) {
                EstadoCuenta e = (EstadoCuenta) obj;
                reporte.add("Copropietario ID: " + e.getCopropietarioId()
                        + " | Periodo: " + e.getPeriodo()
                        + " | Monto base: " + e.getMontoBase()
                        + " | Mora: " + e.getRecargoMora()
                        + " | Total: " + e.calcularTotal()
                        + " | Estado: " + e.getEstado());
            }
        }
        return reporte;
    }
}