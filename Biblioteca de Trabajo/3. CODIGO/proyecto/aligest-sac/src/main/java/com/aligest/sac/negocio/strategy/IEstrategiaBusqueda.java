package com.aligest.sac.negocio.strategy;

import com.aligest.sac.datos.entidades.Copropietario;
import java.util.List;

public interface IEstrategiaBusqueda {
    List<Copropietario> buscar(String criterio, List<Copropietario> todos);
}