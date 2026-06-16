package com.aligest.sac.negocio.servicios;

import com.aligest.sac.datos.entidades.Usuario;
import com.aligest.sac.datos.repositorios.RepositorioUsuario;

public class ServicioAutenticacion {

    private static final int MAX_INTENTOS_FALLIDOS = 3;
    private RepositorioUsuario repositorioUsuario;

    public ServicioAutenticacion(RepositorioUsuario repositorioUsuario) {
        this.repositorioUsuario = repositorioUsuario;
    }

    public Usuario validarCredenciales(String correo, String contrasena) {
        Usuario usuario = repositorioUsuario.buscarPorCorreo(correo);

        if (usuario == null) {
            System.out.println("Usuario no encontrado: " + correo);
            return null;
        }

        if (usuario.getEstado().equals("BLOQUEADO")) {
            System.out.println("Usuario bloqueado: " + correo);
            return null;
        }

        if (!usuario.validarPassword(contrasena)) {
            registrarIntentoFallido(usuario);
            return null;
        }

        usuario.resetearIntentos();
        repositorioUsuario.actualizar(usuario);
        System.out.println("Inicio de sesion exitoso: " + correo);
        return usuario;
    }

    public void registrarIntentoFallido(Usuario usuario) {
        usuario.incrementarIntentoFallido();
        if (usuario.getIntentosFallidos() >= MAX_INTENTOS_FALLIDOS) {
            bloquearUsuario(usuario);
        } else {
            repositorioUsuario.actualizar(usuario);
            System.out.println("Intento fallido " + usuario.getIntentosFallidos()
                    + "/" + MAX_INTENTOS_FALLIDOS + " para: " + usuario.getCorreo());
        }
    }

    public void bloquearUsuario(Usuario usuario) {
        usuario.setEstado("BLOQUEADO");
        repositorioUsuario.actualizar(usuario);
        System.out.println("Usuario bloqueado por exceder intentos: " + usuario.getCorreo());
    }

    public String determinarRedireccion(String rol) {
        switch (rol) {
            case "ADMINISTRADOR": return "VISTA_ADMIN";
            case "COPROPIETARIO": return "VISTA_COPROPIETARIO";
            default: return "VISTA_LOGIN";
        }
    }
}