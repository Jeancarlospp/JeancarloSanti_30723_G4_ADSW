package view;

import controller.EstudianteController;
import model.Estudiante;
import java.util.List;
import java.util.Scanner;

public class EstudianteView {

    private EstudianteController controller;

    public EstudianteView(EstudianteController controller) {
        this.controller = controller;
    }

    public void mostrarFormulario() {
        Scanner scanner = new Scanner(System.in);
        int opcion = 0;

        do {
            System.out.println("\n===== CRUD ESTUDIANTES =====");
            System.out.println("1. Agregar estudiante");
            System.out.println("2. Actualizar estudiante");
            System.out.println("3. Eliminar estudiante");
            System.out.println("4. Mostrar todos");
            System.out.println("5. Salir");
            System.out.print("Seleccione una opcion: ");

            opcion = scanner.nextInt();
            scanner.nextLine();

            switch (opcion) {
                case 1:
                    System.out.print("Ingrese ID del estudiante: ");
                    int idAgregar = scanner.nextInt();
                    scanner.nextLine();

                    System.out.print("Ingrese nombre del estudiante: ");
                    String nombreAgregar = scanner.nextLine();

                    System.out.print("Ingrese edad del estudiante: ");
                    int edadAgregar = scanner.nextInt();
                    scanner.nextLine();

                    boolean agregado = controller.agregarEstudiante(idAgregar, nombreAgregar, edadAgregar);

                    if (agregado) {
                        System.out.println("Estudiante agregado correctamente.");
                    } else {
                        System.out.println("No se pudo agregar el estudiante.");
                    }

                    break;

                case 2:
                    System.out.print("Ingrese ID del estudiante a actualizar: ");
                    int idActualizar = scanner.nextInt();
                    scanner.nextLine();

                    System.out.print("Ingrese nuevo nombre: ");
                    String nombreActualizar = scanner.nextLine();

                    System.out.print("Ingrese nueva edad: ");
                    int edadActualizar = scanner.nextInt();
                    scanner.nextLine();

                    boolean actualizado = controller.actualizarEstudiante(idActualizar, nombreActualizar, edadActualizar);

                    if (actualizado) {
                        System.out.println("Estudiante actualizado correctamente.");
                    } else {
                        System.out.println("No se pudo actualizar el estudiante.");
                    }

                    break;

                case 3:
                    System.out.print("Ingrese ID del estudiante a eliminar: ");
                    int idEliminar = scanner.nextInt();
                    scanner.nextLine();

                    boolean eliminado = controller.eliminarEstudiante(idEliminar);

                    if (eliminado) {
                        System.out.println("Estudiante eliminado correctamente.");
                    } else {
                        System.out.println("No se pudo eliminar el estudiante.");
                    }

                    break;

                case 4:
                    mostrarEstudiantes();
                    break;

                case 5:
                    System.out.println("Saliendo del sistema...");
                    break;

                default:
                    System.out.println("Opcion no valida.");
                    break;
            }

        } while (opcion != 5);

        scanner.close();
    }

    public void mostrarEstudiantes() {
        List<Estudiante> estudiantes = controller.mostrarTodos();

        System.out.println("\n===== LISTA DE ESTUDIANTES =====");

        if (estudiantes.isEmpty()) {
            System.out.println("No existen estudiantes registrados.");
            return;
        }

        for (Estudiante estudiante : estudiantes) {
            System.out.println(estudiante);
        }
    }
}