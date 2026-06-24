package com.aligest.sac.presentacion.vistas;

import com.aligest.sac.datos.entidades.Usuario;
import com.aligest.sac.presentacion.controladores.PerfilController;
import java.util.List;
import java.util.Scanner;

public class VistaGestionPerfiles {

    private PerfilController perfilController;
    private Scanner scanner;

    public VistaGestionPerfiles(PerfilController perfilController) {
        this.perfilController = perfilController;
        this.scanner = new Scanner(System.in);
    }

    public void mostrarMenu() {
        int opcion = -1;
        while (opcion != 0) {
            System.out.println("\n=== GESTION DE PERFILES ===");
            System.out.println("1. Listar usuarios");
            System.out.println("2. Cambiar perfil de usuario");
            System.out.println("0. Salir");
            System.out.print("Opcion: ");
            opcion = Integer.parseInt(scanner.nextLine());

            switch (opcion) {
                case 1: mostrarListaUsuarios(); break;
                case 2: mostrarCambioPerfil(); break;
                case 0: System.out.println("Saliendo..."); break;
                default: System.out.println("Opcion invalida.");
            }
        }
    }

    private void mostrarListaUsuarios() {
        System.out.println("\n--- Lista de usuarios ---");
        List<Usuario> usuarios = perfilController.listarUsuarios();
        if (usuarios.isEmpty()) {
            System.out.println("No hay usuarios registrados.");
        } else {
            usuarios.forEach(System.out::println);
        }
    }

    private void mostrarCambioPerfil() {
        System.out.println("\n--- Cambiar perfil ---");
        System.out.print("ID del usuario: ");
        int id = Integer.parseInt(scanner.nextLine());
        System.out.println("Nuevo perfil: ADMINISTRADOR / COPROPIETARIO");
        System.out.print("Perfil: ");
        String perfil = scanner.nextLine();
        System.out.println(perfilController.cambiarPerfil(id, perfil));
    }
}