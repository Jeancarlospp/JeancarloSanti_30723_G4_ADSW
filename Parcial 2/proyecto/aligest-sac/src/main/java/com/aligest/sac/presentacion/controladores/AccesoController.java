package com.aligest.sac.presentacion.controladores;

import com.aligest.sac.datos.entidades.CodigoVerificacion;
import com.aligest.sac.datos.entidades.Usuario;
import com.aligest.sac.datos.repositorios.RepositorioUsuario;
import com.aligest.sac.negocio.servicios.ServicioAutenticacion;
import com.aligest.sac.negocio.servicios.ServicioRecuperacionContrasena;

public class AccesoController {

    private ServicioAutenticacion servicioAutenticacion;
    private ServicioRecuperacionContrasena servicioRecuperacion;
    private RepositorioUsuario repositorioUsuario;

    public AccesoController(ServicioAutenticacion servicioAutenticacion,
                             ServicioRecuperacionContrasena servicioRecuperacion,
                             RepositorioUsuario repositorioUsuario) {
        this.servicioAutenticacion = servicioAutenticacion;
        this.servicioRecuperacion = servicioRecuperacion;
        this.repositorioUsuario = repositorioUsuario;
    }

    public String iniciarSesion(String correo, String contrasena) {
        Usuario usuario = servicioAutenticacion.validarCredenciales(correo, contrasena);
        if (usuario == null) {
            return "ERROR: Credenciales invalidas o usuario bloqueado.";
        }
        String redireccion = servicioAutenticacion.determinarRedireccion(usuario.getRol());
        return "OK:" + redireccion + ":" + usuario.getNombre();
    }

    public String solicitarRecuperacion(String correo) {
        if (!servicioRecuperacion.validarCorreoExistente(correo)) {
            return "ERROR: El correo no esta registrado en el sistema.";
        }
        Usuario usuario = repositorioUsuario.buscarPorCorreo(correo);
        CodigoVerificacion codigo = servicioRecuperacion.generarCodigoVerificacion(usuario);
        servicioRecuperacion.enviarCodigoPorCorreo(usuario, codigo);
        return "OK: Codigo de verificacion enviado a " + correo;
    }

    public String validarCodigoYActualizarContrasena(String correo,
                                                      String codigoIngresado,
                                                      String nuevaContrasena) {
        Usuario usuario = repositorioUsuario.buscarPorCorreo(correo);
        if (usuario == null) {
            return "ERROR: Usuario no encontrado.";
        }
        if (!servicioRecuperacion.validarCodigo(codigoIngresado, usuario)) {
            return "ERROR: Codigo invalido o expirado.";
        }
        servicioRecuperacion.actualizarContrasena(usuario, nuevaContrasena);
        return "OK: Contrasena actualizada exitosamente.";
    }
}