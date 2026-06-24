package presentacion;

import Datos.Estudiante;
import Datos.EstudianteExterno;
import LogicaNegocio.*;
import LogicaNegocio.Observer.AuditoriaObserver;
import LogicaNegocio.Observer.HistorialObserver;
import LogicaNegocio.Strategy.BuscarPorID;
import LogicaNegocio.Strategy.BuscarPorNombre;
import LogicaNegocio.Strategy.ContextoBusqueda;

import java.util.List;
import java.util.Scanner;


public class VistaEstudiante {
    private final Scanner scanner;
    private IServicioEstudiante servicioEstudiante;
    private final ServicioCRUDEstudiante servicioBaseOriginal;
    
    // U2T3 - Componentes de patrones de comportamiento
    private final HistorialObserver historialObserver;
    private final ContextoBusqueda contextoBusqueda;

    public VistaEstudiante() {
        this.scanner = new Scanner(System.in);
        this.servicioBaseOriginal = new ServicioCRUDEstudiante();
        this.servicioEstudiante = this.servicioBaseOriginal; 
        
        // [OBSERVER] Suscribir observadores
        this.historialObserver = new HistorialObserver();
        AuditoriaObserver auditoriaObserver = new AuditoriaObserver();
        
        this.servicioBaseOriginal.getGestorEventos().suscribir(auditoriaObserver);
        this.servicioBaseOriginal.getGestorEventos().suscribir(historialObserver);

        // [STRATEGY] Inicializar contexto
        this.contextoBusqueda = new ContextoBusqueda();
    }

    public void iniciar() {
        int opcion;
        do {
            mostrarMenu();
            opcion = leerEntero("Seleccione una opción: ");
            switch (opcion) {
                case 1: registrarEstudiante(); break;
                case 2: listarEstudiantes(); break;
                case 3: consultarEstudiante(); break;
                case 4: actualizarEstudiante(); break;
                case 5: eliminarEstudiante(); break;
                case 6: alternarDecorador(); break;
                case 7: simularCargaEstudianteExternoAdapter(); break;
                case 8: menuBusquedaDinamicaStrategy(); break;
                case 9: mostrarHistorialEventosObserver(); break;
                case 0: System.out.println("Saliendo del sistema..."); break;
                default: System.out.println("Opción no válida."); break;
            }
        } while (opcion != 0);
    }

    private void mostrarMenu() {
        String estadoDecorador = (servicioEstudiante instanceof AdaptadorAuditoriaValidacion) ? "ACTIVADO" : "DESACTIVADO";
        System.out.println("\n=======================================================");
        System.out.println(" CRUD DEL ESTUDIANTE - ARQUITECTURA INTEGRADA U2T3");
        System.out.println(" Decorator (Validaciones Extras): " + estadoDecorador);
        System.out.println("=======================================================");
        System.out.println("1. Registrar estudiante");
        System.out.println("2. Listar estudiantes");
        System.out.println("3. Consultar estudiante por ID");
        System.out.println("4. Actualizar estudiante");
        System.out.println("5. Eliminar estudiante");
        System.out.println("---------------- Patrones Estructurales ---------------");
        System.out.println("6. [DECORATOR] Alternar Decorador de Validacion");
        System.out.println("7. [ADAPTER] Cargar datos de EstudianteExterno");
        System.out.println("--------------- Patrones de Comportamiento ------------");
        System.out.println("8. [STRATEGY] Búsqueda Dinámica (Por ID o Nombre)");
        System.out.println("9. [OBSERVER] Ver Historial de Notificaciones");
        System.out.println("0. Salir");
        System.out.println("=======================================================");
    }

    private void registrarEstudiante() {
        System.out.println("\n--- Registrar estudiante ---");
        int id = leerEntero("Ingrese ID: ");
        String nombres = leerTexto("Ingrese nombres: ");
        int edad = leerEntero("Ingrese edad: ");
        String resultado = servicioEstudiante.registrarEstudiante(id, nombres, edad);
        System.out.println(resultado);
    }

    private void listarEstudiantes() {
        System.out.println("\n--- Lista de estudiantes ---");
        List<Estudiante> estudiantes = servicioEstudiante.listarEstudiantes();
        if (estudiantes.isEmpty()) { System.out.println("No hay estudiantes."); return; }
        for (Estudiante e : estudiantes) System.out.println("ID: " + e.getId() + " | Nombre: " + e.getNombres() + " | Edad: " + e.getEdad());
    }

    private void consultarEstudiante() {
        int id = leerEntero("\nIngrese ID a consultar: ");
        Estudiante e = servicioEstudiante.consultarEstudiantePorId(id);
        if (e == null) System.out.println("Estudiante no encontrado.");
        else System.out.println("Encontrado -> ID: " + e.getId() + " | Nombre: " + e.getNombres() + " | Edad: " + e.getEdad());
    }

    private void actualizarEstudiante() {
        System.out.println("\n--- Actualizar estudiante ---");
        int id = leerEntero("Ingrese ID del estudiante a actualizar: ");
        String nombres = leerTexto("Ingrese nuevos nombres: ");
        int edad = leerEntero("Ingrese nueva edad: ");
        System.out.println(servicioEstudiante.actualizarEstudiante(id, nombres, edad));
    }

    private void eliminarEstudiante() {
        int id = leerEntero("\nIngrese ID a eliminar: ");
        System.out.println(servicioEstudiante.eliminarEstudiante(id));
    }

    private void alternarDecorador() {
        if (this.servicioEstudiante instanceof AdaptadorAuditoriaValidacion) {
            this.servicioEstudiante = this.servicioBaseOriginal;
            System.out.println("\n[SISTEMA] Decorador Desactivado.");
        } else {
            this.servicioEstudiante = new AdaptadorAuditoriaValidacion(this.servicioBaseOriginal);
            System.out.println("\n[SISTEMA] Decorador Activado.");
        }
    }

    private void simularCargaEstudianteExternoAdapter() {
        System.out.println("\n--- Simulación de Adapter ---");
        EstudianteExterno datosExternos = new EstudianteExterno("8080", "Adapter Prueba", 20);
        Estudiante mapeado = new AdaptadorEntradaEstudiante().convertirAEstudiante(datosExternos);
        System.out.println(servicioEstudiante.registrarEstudiante(mapeado.getId(), mapeado.getNombres(), mapeado.getEdad()));
    }

    // ==========================================================
    // METODOS U2T3 - STRATEGY Y OBSERVER
    // ==========================================================

    private void menuBusquedaDinamicaStrategy() {
        System.out.println("\n--- [STRATEGY] Búsqueda Dinámica ---");
        System.out.println("1. Buscar por ID");
        System.out.println("2. Buscar por Nombre");
        int subOpcion = leerEntero("Seleccione estrategia: ");

        if (subOpcion == 1) {
            contextoBusqueda.setEstrategia(new BuscarPorID());
        } else if (subOpcion == 2) {
            contextoBusqueda.setEstrategia(new BuscarPorNombre());
        } else {
            System.out.println("Estrategia no válida.");
            return;
        }

        String criterio = leerTexto("Ingrese el valor a buscar: ");
        List<Estudiante> todos = servicioEstudiante.listarEstudiantes();
        
        System.out.println("\n[STRATEGY] Ejecutando algoritmo de búsqueda seleccionado...");
        List<Estudiante> resultados = contextoBusqueda.ejecutarBusqueda(todos, criterio);

        if (resultados.isEmpty()) {
            System.out.println("No se encontraron coincidencias.");
        } else {
            System.out.println("--- Resultados de Búsqueda ---");
            for (Estudiante e : resultados) {
                System.out.println("ID: " + e.getId() + " | Nombre: " + e.getNombres());
            }
        }
    }

    private void mostrarHistorialEventosObserver() {
        System.out.println("\n--- [OBSERVER] Historial de Notificaciones (Bitácora) ---");
        List<String> historial = historialObserver.obtenerHistorial();
        
        if (historial.isEmpty()) {
            System.out.println("No hay eventos registrados aún.");
        } else {
            for (String registro : historial) {
                System.out.println(registro);
            }
        }
    }

    private int leerEntero(String mensaje) {
        while (true) {
            try {
                System.out.print(mensaje);
                return Integer.parseInt(scanner.nextLine());
            } catch (NumberFormatException e) {
                System.out.println("Error: debe ingresar un número entero.");
            }
        }
    }

    private String leerTexto(String mensaje) {
        System.out.print(mensaje);
        return scanner.nextLine();
    }
}