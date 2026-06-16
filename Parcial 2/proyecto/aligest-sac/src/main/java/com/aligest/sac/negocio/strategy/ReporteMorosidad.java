package com.aligest.sac.negocio.strategy;

import com.aligest.sac.datos.entidades.EstadoCuenta;
import java.util.ArrayList;
import java.util.List;

public class ReporteMorosidad implements IEstrategiaReporte {

    @Override
    public List<String> generar(String filtro, List<?> datos) {
        List<String> reporte = new ArrayList<>();
        reporte.add("=== REPORTE DE MOROSIDAD ===");
        reporte.add("Filtro aplicado: " + filtro);
        for (Object obj : datos) {
            if (obj instanceof EstadoCuenta) {
                EstadoCuenta e = (EstadoCuenta) obj;
                if (e.estaVencido() || e.getEstado().equals("PENDIENTE")) {
                    reporte.add("Copropietario ID: " + e.getCopropietarioId()
                            + " | Periodo: " + e.getPeriodo()
                            + " | Saldo pendiente: " + e.getSaldoPendiente()
                            + " | Mora: " + e.getRecargoMora());
                }
            }
        }
        return reporte;
    }
}