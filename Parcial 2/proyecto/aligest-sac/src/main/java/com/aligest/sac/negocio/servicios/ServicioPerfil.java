package com.aligest.sac.negocio.servicios;

import com.aligest.sac.datos.entidades.Usuario;
import com.aligest.sac.datos.repositorios.RepositorioUsuario;
import java.util.List;

public class ServicioPerfil {

    private RepositorioUsuario repositorioUsuario;

    public ServicioPerfil(RepositorioUsuario repositorioUsuario) {
        this.repositorioUsuario = repositorioUsuario;
    }

    public List<Usuario> obtenerUsuarios() {
        return repositorioUsuario.listarTodos();
    }

    public void actualizarPerfil(int usuarioId, String nuevoPerfil) {
        Usuario usuario = repositorioUsuario.buscarPorId(usuarioId);
        if (usuario == null) {
            throw new IllegalArgumentException("Usuario no encontrado con ID: " + usuarioId);
        }
        if (usuario.getRol().equals("ADMINISTRADOR") && nuevoPerfil.equals("COPROPIETARIO")) {
            if (!validarAdministradorActivo(usuarioId)) {
                throw new IllegalStateException(
                    "No se puede cambiar el rol. Debe existir al menos un administrador activo.");
            }
        }
        usuario.cambiarRol(nuevoPerfil);
        repositorioUsuario.actualizar(usuario);
        System.out.println("Perfil actualizado: Usuario ID " + usuarioId + " -> Rol: " + nuevoPerfil);
    }

    public boolean validarAdministradorActivo(int usuarioIdExcluir) {
        List<Usuario> todos = repositorioUsuario.listarTodos();
        int contadorAdmins = 0;
        for (Usuario u : todos) {
            if (u.getRol().equals("ADMINISTRADOR")
                    && u.getEstado().equals("ACTIVO")
                    && u.getId() != usuarioIdExcluir) {
                contadorAdmins++;
            }
        }
        return contadorAdmins >= 1;
    }
}