package com.aligest.sac.presentacion.vistas;

import com.aligest.sac.presentacion.controladores.ReporteController;
import java.util.List;
import java.util.Scanner;

public class VistaReportes {

    private ReporteController reporteController;
    private Scanner scanner;

    public VistaReportes(ReporteController reporteController) {
        this.reporteController = reporteController;
        this.scanner = new Scanner(System.in);
    }

    public void mostrarMenu(String rolUsuario) {
        int opcion = -1;
        while (opcion != 0) {
            System.out.println("\n=== REPORTES ===");
            System.out.println("1. Reporte de pagos");
            System.out.println("2. Reporte de morosidad (solo administrador)");
            System.out.println("3. Reporte de estado de cuenta");
            System.out.println("0. Salir");
            System.out.print("Opcion: ");
            opcion = Integer.parseInt(scanner.nextLine());

            switch (opcion) {
                case 1: generarReporte("PAGOS", rolUsuario); break;
                case 2: generarReporte("MOROSIDAD", rolUsuario); break;
                case 3: generarReporte("ESTADO_CUENTA", rolUsuario); break;
                case 0: System.out.println("Saliendo..."); break;
                default: System.out.println("Opcion invalida.");
            }
        }
    }

    private void generarReporte(String tipo, String rolUsuario) {
        System.out.print("Filtro (periodo, ej: 2026-01): ");
        String filtro = scanner.nextLine();
        List<String> reporte = reporteController.generarReporte(tipo, filtro, rolUsuario);
        System.out.println("\n--- Resultado ---");
        reporte.forEach(System.out::println);
    }
}