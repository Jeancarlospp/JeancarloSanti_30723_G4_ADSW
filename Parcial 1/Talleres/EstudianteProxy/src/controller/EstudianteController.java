package controller;

import model.Estudiante;
import repository.IEstudianteRepository;
import java.util.List;

public class EstudianteController {

    private IEstudianteRepository repositorio;

    public EstudianteController(IEstudianteRepository repositorio) {
        this.repositorio = repositorio;
    }

    public boolean agregarEstudiante(int id, String nombre, int edad) {
        Estudiante estudiante = new Estudiante(id, nombre, edad);
        return repositorio.agregar(estudiante);
    }

    public boolean actualizarEstudiante(int id, String nombre, int edad) {
        Estudiante estudiante = new Estudiante(id, nombre, edad);
        return repositorio.actualizar(estudiante);
    }

    public boolean eliminarEstudiante(int id) {
        return repositorio.eliminar(id);
    }

    public List<Estudiante> mostrarTodos() {
        return repositorio.mostrarTodos();
    }
}