package com.aligest.sac.negocio.strategy;

import com.aligest.sac.datos.entidades.Copropietario;
import java.util.List;

public class ContextoBusquedaCopropietario {

    private IEstrategiaBusqueda estrategiaActual;

    public ContextoBusquedaCopropietario(IEstrategiaBusqueda estrategiaActual) {
        this.estrategiaActual = estrategiaActual;
    }

    public void establecerEstrategia(IEstrategiaBusqueda estrategia) {
        this.estrategiaActual = estrategia;
    }

    public List<Copropietario> ejecutarBusqueda(String criterio, List<Copropietario> todos) {
        if (estrategiaActual == null) {
            throw new IllegalStateException("No se ha establecido una estrategia de busqueda.");
        }
        return estrategiaActual.buscar(criterio, todos);
    }
}