package com.aligest.sac.datos.repositorios;

import com.aligest.sac.datos.entidades.CodigoVerificacion;
import java.util.ArrayList;
import java.util.List;

public class RepositorioCodigoVerificacion {

    private List<CodigoVerificacion> codigos = new ArrayList<>();

    public void guardar(CodigoVerificacion codigo) {
        codigos.add(codigo);
    }

    public CodigoVerificacion buscarPorUsuario(int usuarioId) {
        CodigoVerificacion ultimo = null;
        for (CodigoVerificacion c : codigos) {
            if (c.getUsuarioId() == usuarioId && !c.isUsado()) {
                ultimo = c;
            }
        }
        return ultimo;
    }

    public void invalidar(CodigoVerificacion codigo) {
        for (CodigoVerificacion c : codigos) {
            if (c.getCodigo().equals(codigo.getCodigo()) &&
                c.getUsuarioId() == codigo.getUsuarioId()) {
                c.marcarComoUsado();
                return;
            }
        }
    }
}