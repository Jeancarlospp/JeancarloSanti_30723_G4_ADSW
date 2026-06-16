package com.aligest.sac.negocio.decorator;

import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.negocio.adapter.IFuenteCopropietario;
import java.util.List;

public interface IServicioCopropietario {
    List<String> importar(List<IFuenteCopropietario> filas);
    List<Copropietario> buscar(String criterio);
    Copropietario actualizar(Copropietario copropietario);
    void eliminar(int id);
}