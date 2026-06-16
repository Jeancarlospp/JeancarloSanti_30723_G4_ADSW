package com.aligest.sac.negocio.strategy;

import java.util.List;

public class ContextoReporte {

    private IEstrategiaReporte estrategiaActual;

    public ContextoReporte(IEstrategiaReporte estrategiaActual) {
        this.estrategiaActual = estrategiaActual;
    }

    public void establecerEstrategia(IEstrategiaReporte estrategia) {
        this.estrategiaActual = estrategia;
    }

    public List<String> ejecutarReporte(String filtro, List<?> datos) {
        if (estrategiaActual == null) {
            throw new IllegalStateException("No se ha establecido una estrategia de reporte.");
        }
        return estrategiaActual.generar(filtro, datos);
    }
}