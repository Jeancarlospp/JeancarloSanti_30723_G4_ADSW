package com.aligest.sac.presentacion.vistas;

import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.negocio.adapter.AdaptadorExcelCopropietario;
import com.aligest.sac.negocio.adapter.FilaExcelCopropietario;
import com.aligest.sac.negocio.adapter.IFuenteCopropietario;
import com.aligest.sac.presentacion.controladores.CopropietarioController;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class VistaGestionCopropietarios {

    private CopropietarioController copropietarioController;
    private Scanner scanner;

    public VistaGestionCopropietarios(CopropietarioController copropietarioController) {
        this.copropietarioController = copropietarioController;
        this.scanner = new Scanner(System.in);
    }

    public void mostrarMenu() {
        int opcion = -1;
        while (opcion != 0) {
            System.out.println("\n=== GESTION DE COPROPIETARIOS ===");
            System.out.println("1. Importar copropietarios (simulacion Excel)");
            System.out.println("2. Consultar copropietarios");
            System.out.println("3. Modificar copropietario");
            System.out.println("4. Eliminar copropietario");
            System.out.println("0. Salir");
            System.out.print("Opcion: ");
            opcion = Integer.parseInt(scanner.nextLine());

            switch (opcion) {
                case 1: mostrarImportacion(); break;
                case 2: mostrarConsulta(); break;
                case 3: mostrarModificacion(); break;
                case 4: mostrarEliminacion(); break;
                case 0: System.out.println("Saliendo..."); break;
                default: System.out.println("Opcion invalida.");
            }
        }
    }

    private void mostrarImportacion() {
        System.out.println("\n--- Importar desde Excel (simulacion) ---");
        List<IFuenteCopropietario> filas = new ArrayList<>();
        filas.add(new AdaptadorExcelCopropietario(
                new FilaExcelCopropietario("1234567890", "Juan Perez",
                        "juan@mail.com", "0991234567", "A-01")));
        filas.add(new AdaptadorExcelCopropietario(
                new FilaExcelCopropietario("0987654321", "Maria Lopez",
                        "maria@mail.com", "0997654321", "B-02")));
        List<String> resumen = copropietarioController.importarDesdeExcel(filas);
        resumen.forEach(System.out::println);
    }

    private void mostrarConsulta() {
        System.out.println("\n--- Consultar copropietarios ---");
        System.out.println("Buscar por: NOMBRE / CASA / ESTADO / PERFIL");
        System.out.print("Tipo de busqueda: ");
        String tipo = scanner.nextLine();
        System.out.print("Criterio: ");
        String criterio = scanner.nextLine();
        List<Copropietario> resultados = copropietarioController
                .consultarCopropietarios(tipo, criterio);
        if (resultados.isEmpty()) {
            System.out.println("No se encontraron resultados.");
        } else {
            resultados.forEach(System.out::println);
        }
    }

    private void mostrarModificacion() {
        System.out.println("\n--- Modificar copropietario ---");
        System.out.print("ID del copropietario: ");
        int id = Integer.parseInt(scanner.nextLine());
        System.out.print("Nuevo nombre: ");
        String nombre = scanner.nextLine();
        System.out.print("Nuevo correo: ");
        String correo = scanner.nextLine();
        System.out.print("Nuevo telefono: ");
        String telefono = scanner.nextLine();
        System.out.print("Nuevo numero de casa: ");
        String casa = scanner.nextLine();
        Copropietario copropietario = new Copropietario();
        copropietario.setId(id);
        copropietario.setNombre(nombre);
        copropietario.setCorreo(correo);
        copropietario.setTelefono(telefono);
        copropietario.setNumeroCasa(casa);
        System.out.println(copropietarioController.modificarCopropietario(copropietario));
    }

    private void mostrarEliminacion() {
        System.out.println("\n--- Eliminar copropietario ---");
        System.out.print("ID del copropietario a eliminar: ");
        int id = Integer.parseInt(scanner.nextLine());
        System.out.println(copropietarioController.eliminarCopropietario(id));
    }
}