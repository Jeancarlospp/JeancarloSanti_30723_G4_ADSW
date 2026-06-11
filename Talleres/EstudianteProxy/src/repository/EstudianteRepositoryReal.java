package repository;

import model.Estudiante;

import java.util.ArrayList;
import java.util.List;

public class EstudianteRepositoryReal implements IEstudianteRepository{

    private List<Estudiante> estudiantes;

    public EstudianteRepositoryReal(){
        this.estudiantes = new ArrayList<>();
    }

    @Override
    public boolean agregar(Estudiante estudiante) {
        estudiantes.add(estudiante);
        return true;
    }

    @Override
    public boolean actualizar(Estudiante estudiante) {
        for (Estudiante estudianteActual: estudiantes) {
            if (estudianteActual.getId() == estudiante.getId()){
                estudianteActual.setNombre(estudiante.getNombre());
                estudianteActual.setEdad(estudiante.getEdad());
                return true;
            }
        }
        return  false;
    }
    @Override
    public boolean eliminar(int id){
        for (Estudiante estudiante : estudiantes ) {
            if (estudiante.getId() == id) {
                estudiantes.remove(estudiante);
                return true;
            }
        }
        return false;
    }

    @Override
    public List<Estudiante> mostrarTodos(){
        return estudiantes;
    }

    @Override
    public Estudiante buscarPorId(int id) {
        for (Estudiante estudiante : estudiantes){
            if (estudiante.getId() == id){
                return estudiante;
            }
        }
        return null;
    }
}
