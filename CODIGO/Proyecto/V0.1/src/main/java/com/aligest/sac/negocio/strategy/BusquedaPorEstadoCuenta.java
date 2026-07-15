package com.aligest.sac.negocio.strategy;

import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.datos.entidades.EstadoCuenta;
import com.aligest.sac.datos.repositorios.RepositorioEstadoCuenta;
import java.util.ArrayList;
import java.util.List;

public class BusquedaPorEstadoCuenta implements IEstrategiaBusqueda {

    private RepositorioEstadoCuenta repositorioEstado;

    public BusquedaPorEstadoCuenta(RepositorioEstadoCuenta repositorioEstado) {
        this.repositorioEstado = repositorioEstado;
    }

    @Override
    public List<Copropietario> buscar(String criterio, List<Copropietario> todos) {
        List<Copropietario> resultado = new ArrayList<>();
        for (Copropietario c : todos) {
            List<EstadoCuenta> estados = repositorioEstado.buscarPorCopropietario(c.getId());
            for (EstadoCuenta e : estados) {
                if (e.getEstado().toLowerCase().contains(criterio.toLowerCase())) {
                    resultado.add(c);
                    break;
                }
            }
        }
        return resultado;
    }
}