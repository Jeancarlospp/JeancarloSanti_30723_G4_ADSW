package Datos;

import java.util.ArrayList;
import java.util.List;

public class RepositorioEstudiante {
    private final List<Estudiante> estudiantes;

    public RepositorioEstudiante() {
        this.estudiantes = new ArrayList<>();
    }

    public boolean guardar(Estudiante estudiante) {
        if (buscarPorId(estudiante.getId()) != null) {
            return false;
        }

        estudiantes.add(estudiante);
        return true;
    }

    public List<Estudiante> listar() {
        return estudiantes;
    }

    public Estudiante buscarPorId(int id) {
        for (Estudiante estudiante : estudiantes) {
            if (estudiante.getId() == id) {
                return estudiante;
            }
        }

        return null;
    }

    public boolean actualizar(int id, String nuevosNombres, int nuevaEdad) {
        Estudiante estudiante = buscarPorId(id);

        if (estudiante == null) {
            return false;
        }

        estudiante.setNombres(nuevosNombres);
        estudiante.setEdad(nuevaEdad);
        return true;
    }

    public boolean eliminar(int id) {
        Estudiante estudiante = buscarPorId(id);

        if (estudiante == null) {
            return false;
        }

        estudiantes.remove(estudiante);
        return true;
    }
}
