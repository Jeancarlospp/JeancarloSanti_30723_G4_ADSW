package com.aligest.sac.negocio.strategy;

import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.datos.entidades.Usuario;
import com.aligest.sac.datos.repositorios.RepositorioUsuario;
import java.util.ArrayList;
import java.util.List;

public class BusquedaPorPerfil implements IEstrategiaBusqueda {

    private RepositorioUsuario repositorioUsuario;

    public BusquedaPorPerfil(RepositorioUsuario repositorioUsuario) {
        this.repositorioUsuario = repositorioUsuario;
    }

    @Override
    public List<Copropietario> buscar(String criterio, List<Copropietario> todos) {
        List<Copropietario> resultado = new ArrayList<>();
        for (Copropietario c : todos) {
            Usuario u = repositorioUsuario.buscarPorId(c.getUsuarioId());
            if (u != null && u.getRol().toLowerCase().contains(criterio.toLowerCase())) {
                resultado.add(c);
            }
        }
        return resultado;
    }
}