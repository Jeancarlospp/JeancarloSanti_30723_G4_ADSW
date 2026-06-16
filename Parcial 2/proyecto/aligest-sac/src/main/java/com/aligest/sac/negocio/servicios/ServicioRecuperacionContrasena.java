package com.aligest.sac.negocio.servicios;

import com.aligest.sac.datos.entidades.CodigoVerificacion;
import com.aligest.sac.datos.entidades.Usuario;
import com.aligest.sac.datos.repositorios.RepositorioCodigoVerificacion;
import com.aligest.sac.datos.repositorios.RepositorioUsuario;
import java.util.Date;
import java.util.Random;

public class ServicioRecuperacionContrasena {

    private static final int TIEMPO_EXPIRACION_MINUTOS = 10;
    private RepositorioUsuario repositorioUsuario;
    private RepositorioCodigoVerificacion repositorioCodigo;

    public ServicioRecuperacionContrasena(RepositorioUsuario repositorioUsuario,
                                           RepositorioCodigoVerificacion repositorioCodigo) {
        this.repositorioUsuario = repositorioUsuario;
        this.repositorioCodigo = repositorioCodigo;
    }

    public boolean validarCorreoExistente(String correo) {
        return repositorioUsuario.buscarPorCorreo(correo) != null;
    }

    public CodigoVerificacion generarCodigoVerificacion(Usuario usuario) {
        String codigo = String.format("%06d", new Random().nextInt(999999));
        Date ahora = new Date();
        Date expiracion = new Date(ahora.getTime() + TIEMPO_EXPIRACION_MINUTOS * 60 * 1000);
        CodigoVerificacion codigoVerif = new CodigoVerificacion(codigo, usuario.getId(), ahora, expiracion);
        repositorioCodigo.guardar(codigoVerif);
        return codigoVerif;
    }

    public void enviarCodigoPorCorreo(Usuario usuario, CodigoVerificacion codigo) {
        System.out.println("=== SIMULACION ENVIO DE CORREO ===");
        System.out.println("Para: " + usuario.getCorreo());
        System.out.println("Asunto: Recuperacion de contrasena - SAC Aligest");
        System.out.println("Codigo de verificacion: " + codigo.getCodigo());
        System.out.println("Expira en: " + TIEMPO_EXPIRACION_MINUTOS + " minutos");
        System.out.println("==================================");
    }

    public boolean validarCodigo(String codigoIngresado, Usuario usuario) {
        CodigoVerificacion codigo = repositorioCodigo.buscarPorUsuario(usuario.getId());
        if (codigo == null) {
            System.out.println("No existe codigo para el usuario: " + usuario.getCorreo());
            return false;
        }
        if (codigo.isUsado()) {
            System.out.println("El codigo ya fue utilizado.");
            return false;
        }
        if (codigo.estaExpirado()) {
            System.out.println("El codigo ha expirado.");
            return false;
        }
        if (!codigo.getCodigo().equals(codigoIngresado)) {
            System.out.println("Codigo incorrecto.");
            return false;
        }
        return true;
    }

    public void actualizarContrasena(Usuario usuario, String nuevaContrasena) {
        CodigoVerificacion codigo = repositorioCodigo.buscarPorUsuario(usuario.getId());
        if (codigo != null) {
            repositorioCodigo.invalidar(codigo);
        }
        usuario.actualizarContrasena(nuevaContrasena);
        if (usuario.getEstado().equals("BLOQUEADO")) {
            usuario.setEstado("ACTIVO");
            usuario.resetearIntentos();
        }
        repositorioUsuario.actualizar(usuario);
        System.out.println("Contrasena actualizada exitosamente para: " + usuario.getCorreo());
    }
}