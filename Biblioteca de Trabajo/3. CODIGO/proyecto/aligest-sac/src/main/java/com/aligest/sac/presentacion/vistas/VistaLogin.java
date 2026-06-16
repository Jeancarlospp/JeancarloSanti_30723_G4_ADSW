package com.aligest.sac.presentacion.vistas;

import com.aligest.sac.presentacion.controladores.AccesoController;
import java.util.Scanner;

public class VistaLogin {

    private AccesoController accesoController;
    private Scanner scanner;

    public VistaLogin(AccesoController accesoController) {
        this.accesoController = accesoController;
        this.scanner = new Scanner(System.in);
    }

    public void mostrar() {
        System.out.println("=============================");
        System.out.println("    SAC ALIGEST - LOGIN      ");
        System.out.println("=============================");
        System.out.print("Correo: ");
        String correo = scanner.nextLine();
        System.out.print("Contrasena: ");
        String contrasena = scanner.nextLine();

        String resultado = accesoController.iniciarSesion(correo, contrasena);
        if (resultado.startsWith("OK:")) {
            String[] partes = resultado.split(":");
            System.out.println("Bienvenido " + partes[2] + ". Redirigiendo a: " + partes[1]);
        } else {
            System.out.println(resultado);
        }
    }

    public void mostrarOpcionRecuperacion() {
        System.out.println("\n--- Recuperar contrasena ---");
        System.out.print("Ingrese su correo: ");
        String correo = scanner.nextLine();
        String resultado = accesoController.solicitarRecuperacion(correo);
        System.out.println(resultado);

        if (resultado.startsWith("OK")) {
            System.out.print("Ingrese el codigo recibido: ");
            String codigo = scanner.nextLine();
            System.out.print("Ingrese nueva contrasena: ");
            String nuevaContrasena = scanner.nextLine();
            String resultadoActualizacion = accesoController
                    .validarCodigoYActualizarContrasena(correo, codigo, nuevaContrasena);
            System.out.println(resultadoActualizacion);
        }
    }
}