package com.aligest.sac.presentacion.controladores;

import com.aligest.sac.datos.entidades.Usuario;
import com.aligest.sac.negocio.servicios.ServicioPerfil;
import java.util.List;

public class PerfilController {

    private ServicioPerfil servicioPerfil;

    public PerfilController(ServicioPerfil servicioPerfil) {
        this.servicioPerfil = servicioPerfil;
    }

    public List<Usuario> listarUsuarios() {
        return servicioPerfil.obtenerUsuarios();
    }

    public String cambiarPerfil(int usuarioId, String nuevoPerfil) {
        try {
            servicioPerfil.actualizarPerfil(usuarioId, nuevoPerfil);
            return "OK: Perfil actualizado correctamente.";
        } catch (IllegalArgumentException e) {
            return "ERROR: " + e.getMessage();
        } catch (IllegalStateException e) {
            return "ERROR: " + e.getMessage();
        }
    }
}