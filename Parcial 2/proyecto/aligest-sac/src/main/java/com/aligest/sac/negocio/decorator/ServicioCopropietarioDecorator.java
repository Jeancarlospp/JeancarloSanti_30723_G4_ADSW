package com.aligest.sac.negocio.decorator;

import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.negocio.adapter.IFuenteCopropietario;
import java.util.List;

public abstract class ServicioCopropietarioDecorator implements IServicioCopropietario {

    protected IServicioCopropietario servicio;

    public ServicioCopropietarioDecorator(IServicioCopropietario servicio) {
        this.servicio = servicio;
    }

    @Override
    public List<String> importar(List<IFuenteCopropietario> filas) {
        return servicio.importar(filas);
    }

    @Override
    public List<Copropietario> buscar(String criterio) {
        return servicio.buscar(criterio);
    }

    @Override
    public Copropietario actualizar(Copropietario copropietario) {
        return servicio.actualizar(copropietario);
    }

    @Override
    public void eliminar(int id) {
        servicio.eliminar(id);
    }
}