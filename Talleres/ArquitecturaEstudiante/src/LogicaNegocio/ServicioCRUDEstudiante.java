package LogicaNegocio;

import Datos.Estudiante;
import Datos.RepositorioEstudiante;
import LogicaNegocio.Observer.GestorEventosEstudiante;

import java.util.List;

public class ServicioCRUDEstudiante implements IServicioEstudiante {
    private final RepositorioEstudiante repositorioEstudiante;
    // [OBSERVER] Instancia del sujeto (Subject)
    private final GestorEventosEstudiante gestorEventos;

    public ServicioCRUDEstudiante() {
        this.repositorioEstudiante = new RepositorioEstudiante();
        this.gestorEventos = new GestorEventosEstudiante();
    }

    public GestorEventosEstudiante getGestorEventos() {
        return gestorEventos;
    }

    @Override
    public String registrarEstudiante(int id, String nombres, int edad) {
        if (id <= 0) return "Error: el ID debe ser mayor que cero.";
        if (nombres == null || nombres.trim().isEmpty()) return "Error: los nombres no pueden estar vacíos.";
        if (edad <= 0 || edad > 120) return "Error: la edad ingresada no es válida.";

        Estudiante estudiante = new Estudiante(id, nombres, edad);
        boolean guardado = repositorioEstudiante.guardar(estudiante);

        if (guardado) {
            // [OBSERVER] Notificar creación
            gestorEventos.notificar("REGISTRO", estudiante);
            return "Estudiante registrado correctamente.";
        } else {
            return "Error: ya existe un estudiante con ese ID.";
        }
    }

    @Override
    public List<Estudiante> listarEstudiantes() {
        return repositorioEstudiante.listar();
    }

    @Override
    public Estudiante consultarEstudiantePorId(int id) {
        if (id <= 0) return null;
        return repositorioEstudiante.buscarPorId(id);
    }

    @Override
    public String actualizarEstudiante(int id, String nuevosNombres, int nuevaEdad) {
        if (id <= 0 || nuevosNombres == null || nuevosNombres.trim().isEmpty() || nuevaEdad <= 0 || nuevaEdad > 120) {
            return "Error: datos de actualización no válidos.";
        }

        boolean actualizado = repositorioEstudiante.actualizar(id, nuevosNombres, nuevaEdad);

        if (actualizado) {
            // [OBSERVER] Notificar actualización
            Estudiante estActualizado = repositorioEstudiante.buscarPorId(id);
            gestorEventos.notificar("ACTUALIZACIÓN", estActualizado);
            return "Estudiante actualizado correctamente.";
        } else {
            return "Error: no existe un estudiante con ese ID.";
        }
    }

    @Override
    public String eliminarEstudiante(int id) {
        if (id <= 0) return "Error: el ID debe ser mayor que cero.";

        Estudiante estAEliminar = repositorioEstudiante.buscarPorId(id);
        if (estAEliminar == null) return "Error: no existe un estudiante con ese ID.";

        boolean eliminado = repositorioEstudiante.eliminar(id);

        if (eliminado) {
            // [OBSERVER] Notificar eliminación
            gestorEventos.notificar("ELIMINACIÓN", estAEliminar);
            return "Estudiante eliminado correctamente.";
        } else {
            return "Error al eliminar el estudiante.";
        }
    }
}