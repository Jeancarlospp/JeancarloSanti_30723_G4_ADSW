package repository;

import model.Estudiante;
import java.util.List;

public class EstudianteRepositoryProxy implements IEstudianteRepository {

    private EstudianteRepositoryReal repositorioReal;

    public EstudianteRepositoryProxy(EstudianteRepositoryReal repositorioReal) {
        this.repositorioReal = repositorioReal;
    }

    @Override
    public boolean agregar(Estudiante estudiante) {
        if (!validarEstudiante(estudiante)) {
            System.out.println("Proxy: No se puede agregar. Los datos del estudiante no son validos.");
            return false;
        }

        if (repositorioReal.buscarPorId(estudiante.getId()) != null) {
            System.out.println("Proxy: No se puede agregar. Ya existe un estudiante con ese ID.");
            return false;
        }

        System.out.println("Proxy: Validacion correcta. Delegando agregar al repositorio real.");
        return repositorioReal.agregar(estudiante);
    }

    @Override
    public boolean actualizar(Estudiante estudiante) {
        if (!validarEstudiante(estudiante)) {
            System.out.println("Proxy: No se puede actualizar. Los datos del estudiante no son validos.");
            return false;
        }

        if (repositorioReal.buscarPorId(estudiante.getId()) == null) {
            System.out.println("Proxy: No se puede actualizar. No existe un estudiante con ese ID.");
            return false;
        }

        System.out.println("Proxy: Validacion correcta. Delegando actualizar al repositorio real.");
        return repositorioReal.actualizar(estudiante);
    }

    @Override
    public boolean eliminar(int id) {
        if (id <= 0) {
            System.out.println("Proxy: No se puede eliminar. El ID debe ser mayor que cero.");
            return false;
        }

        if (repositorioReal.buscarPorId(id) == null) {
            System.out.println("Proxy: No se puede eliminar. No existe un estudiante con ese ID.");
            return false;
        }

        System.out.println("Proxy: Validacion correcta. Delegando eliminar al repositorio real.");
        return repositorioReal.eliminar(id);
    }

    @Override
    public List<Estudiante> mostrarTodos() {
        System.out.println("Proxy: Delegando mostrar todos al repositorio real.");
        return repositorioReal.mostrarTodos();
    }

    @Override
    public Estudiante buscarPorId(int id) {
        if (id <= 0) {
            return null;
        }

        return repositorioReal.buscarPorId(id);
    }

    private boolean validarEstudiante(Estudiante estudiante) {
        if (estudiante == null) {
            return false;
        }

        if (estudiante.getId() <= 0) {
            return false;
        }

        if (estudiante.getNombre() == null || estudiante.getNombre().trim().isEmpty()) {
            return false;
        }

        if (estudiante.getEdad() <= 0) {
            return false;
        }

        return true;
    }
}