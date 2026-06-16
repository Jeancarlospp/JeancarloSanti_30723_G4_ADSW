package com.aligest.sac.presentacion.vistas;

import com.aligest.sac.presentacion.controladores.AccesoController;
import java.util.Scanner;

public class VistaRecuperacionContrasena {

    private AccesoController accesoController;
    private Scanner scanner;

    public VistaRecuperacionContrasena(AccesoController accesoController) {
        this.accesoController = accesoController;
        this.scanner = new Scanner(System.in);
    }

    public void mostrar() {
        System.out.println("\n=== RECUPERACION DE CONTRASENA ===");
        System.out.print("Ingrese su correo registrado: ");
        String correo = scanner.nextLine();

        String resultado = accesoController.solicitarRecuperacion(correo);
        System.out.println(resultado);

        if (resultado.startsWith("OK")) {
            System.out.print("Ingrese el codigo de verificacion: ");
            String codigo = scanner.nextLine();
            System.out.print("Ingrese su nueva contrasena: ");
            String nuevaContrasena = scanner.nextLine();
            System.out.print("Confirme su nueva contrasena: ");
            String confirmacion = scanner.nextLine();

            if (!nuevaContrasena.equals(confirmacion)) {
                System.out.println("ERROR: Las contrasenas no coinciden.");
                return;
            }

            String resultadoActualizacion = accesoController
                    .validarCodigoYActualizarContrasena(correo, codigo, nuevaContrasena);
            System.out.println(resultadoActualizacion);
        }
    }
}