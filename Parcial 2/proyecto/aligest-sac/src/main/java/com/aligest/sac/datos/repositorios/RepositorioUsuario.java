package com.aligest.sac.datos.repositorios;

import com.aligest.sac.datos.entidades.Usuario;
import java.util.ArrayList;
import java.util.List;

public class RepositorioUsuario {

    private List<Usuario> usuarios = new ArrayList<>();
    private int contadorId = 1;

    public Usuario buscarPorCorreo(String correo) {
        for (Usuario u : usuarios) {
            if (u.getCorreo().equals(correo)) {
                return u;
            }
        }
        return null;
    }

    public Usuario buscarPorId(int id) {
        for (Usuario u : usuarios) {
            if (u.getId() == id) {
                return u;
            }
        }
        return null;
    }

    public void guardar(Usuario usuario) {
        usuario.setId(contadorId++);
        usuarios.add(usuario);
    }

    public void actualizar(Usuario usuarioActualizado) {
        for (int i = 0; i < usuarios.size(); i++) {
            if (usuarios.get(i).getId() == usuarioActualizado.getId()) {
                usuarios.set(i, usuarioActualizado);
                return;
            }
        }
    }

    public List<Usuario> listarTodos() {
        return new ArrayList<>(usuarios);
    }

    public int contarAdministradoresActivos() {
        int count = 0;
        for (Usuario u : usuarios) {
            if (u.getRol().equals("ADMINISTRADOR") && u.getEstado().equals("ACTIVO")) {
                count++;
            }
        }
        return count;
    }
}