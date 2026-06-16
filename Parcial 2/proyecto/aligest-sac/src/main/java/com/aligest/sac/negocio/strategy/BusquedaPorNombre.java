package com.aligest.sac.negocio.strategy;

import com.aligest.sac.datos.entidades.Copropietario;
import java.util.ArrayList;
import java.util.List;

public class BusquedaPorNombre implements IEstrategiaBusqueda {

    @Override
    public List<Copropietario> buscar(String criterio, List<Copropietario> todos) {
        List<Copropietario> resultado = new ArrayList<>();
        for (Copropietario c : todos) {
            if (c.getNombre().toLowerCase().contains(criterio.toLowerCase())) {
                resultado.add(c);
            }
        }
        return resultado;
    }
}