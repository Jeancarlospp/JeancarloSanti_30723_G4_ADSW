package com.aligest.sac.datos.repositorios;

import com.aligest.sac.datos.entidades.EstadoCuenta;
import java.util.ArrayList;
import java.util.List;

public class RepositorioEstadoCuenta {

    private List<EstadoCuenta> estados = new ArrayList<>();

    public void guardar(EstadoCuenta estadoCuenta) {
        estados.add(estadoCuenta);
    }

    public List<EstadoCuenta> buscarPorCopropietario(int copropietarioId) {
        List<EstadoCuenta> resultado = new ArrayList<>();
        for (EstadoCuenta e : estados) {
            if (e.getCopropietarioId() == copropietarioId) {
                resultado.add(e);
            }
        }
        return resultado;
    }

    public List<EstadoCuenta> listarPorFiltros(String estado, String periodo) {
        List<EstadoCuenta> resultado = new ArrayList<>();
        for (EstadoCuenta e : estados) {
            boolean coincideEstado = (estado == null || e.getEstado().equals(estado));
            boolean coincidePeriodo = (periodo == null || e.getPeriodo().equals(periodo));
            if (coincideEstado && coincidePeriodo) {
                resultado.add(e);
            }
        }
        return resultado;
    }

    public List<EstadoCuenta> listarTodos() {
        return new ArrayList<>(estados);
    }
}