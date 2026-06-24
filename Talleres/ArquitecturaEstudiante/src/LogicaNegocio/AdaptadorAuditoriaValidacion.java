package LogicaNegocio;

import Datos.Estudiante;
import java.util.List;

public class AdaptadorAuditoriaValidacion implements IServicioEstudiante {
    private final IServicioEstudiante servicioBase;

    public AdaptadorAuditoriaValidacion(IServicioEstudiante servicioBase) {
        this.servicioBase = servicioBase;
    }

    @Override
    public String registrarEstudiante(int id, String nombres, int edad) {
        // Validación en caliente solicitada en la guía autónoma para el decorador
        if (edad <= 0) {
            return "Error de Validación [DECORATOR]: La edad debe ser mayor a cero.";
        }

        // Bloque estructural de comportamiento extendido (Auditoría)
        System.out.println("\n========================================================");
        System.out.println("[AUDITORÍA DECORATOR] -> Ejecutando operación: Registrar");
        System.out.println("[AUDITORÍA DECORATOR] -> Datos evaluados: ID: " + id + " | Nombre: " + nombres + " | Edad: " + edad);

        // Delegación al método real de tu servicio base
        String resultado = this.servicioBase.registrarEstudiante(id, nombres, edad);

        System.out.println("[AUDITORÍA DECORATOR] -> Resultado del registro base: " + resultado);
        System.out.println("========================================================\n");

        return resultado;
    }

    @Override
    public List<Estudiante> listarEstudiantes() {
        return this.servicioBase.listarEstudiantes();
    }

    @Override
    public Estudiante consultarEstudiantePorId(int id) {
        return this.servicioBase.consultarEstudiantePorId(id);
    }

    @Override
    public String actualizarEstudiante(int id, String nuevosNombres, int nuevaEdad) {
        // Comportamiento extendido de auditoría para la actualización
        System.out.println("\n========================================================");
        System.out.println("[AUDITORÍA DECORATOR] -> Ejecutando operación: Actualizar");
        System.out.println("[AUDITORÍA DECORATOR] -> Intentando modificar ID: " + id);
        
        String resultado = this.servicioBase.actualizarEstudiante(id, nuevosNombres, nuevaEdad);
        
        System.out.println("[AUDITORÍA DECORATOR] -> Fin de actualización transaccional.");
        System.out.println("========================================================\n");
        return resultado;
    }

    @Override
    public String eliminarEstudiante(int id) {
        return this.servicioBase.eliminarEstudiante(id);
    }
}