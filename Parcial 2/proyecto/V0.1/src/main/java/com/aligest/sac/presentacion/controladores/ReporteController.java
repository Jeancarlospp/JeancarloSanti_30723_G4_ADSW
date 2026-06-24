package com.aligest.sac.presentacion.controladores;

import com.aligest.sac.negocio.servicios.ServicioReportes;
import java.util.List;

public class ReporteController {

    private ServicioReportes servicioReportes;

    public ReporteController(ServicioReportes servicioReportes) {
        this.servicioReportes = servicioReportes;
    }

    public List<String> generarReporte(String tipoReporte, String filtro, String rolUsuario) {
        try {
            List<String> reporte = servicioReportes.generarReporte(tipoReporte, filtro, rolUsuario);
            servicioReportes.imprimirReporte(reporte);
            return reporte;
        } catch (SecurityException e) {
            return List.of("ERROR: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return List.of("ERROR: " + e.getMessage());
        }
    }
}