package com.aligest.sac.negocio.strategy;

import com.aligest.sac.datos.entidades.Copropietario;
import java.util.ArrayList;
import java.util.List;

public class BusquedaPorCasa implements IEstrategiaBusqueda {

    @Override
    public List<Copropietario> buscar(String criterio, List<Copropietario> todos) {
        List<Copropietario> resultado = new ArrayList<>();
        for (Copropietario c : todos) {
            if (c.getNumeroCasa().toLowerCase().contains(criterio.toLowerCase())) {
                resultado.add(c);
            }
        }
        return resultado;
    }
}