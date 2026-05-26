package repository;
import model.Estudiante;
import java.util.List;
public interface IEstudianteRepository {
    boolean agregar(Estudiante estudiante);

    boolean actualizar(Estudiante estudiante);

    boolean eliminar(int id);

    List<Estudiante> mostrarTodos();

    Estudiante buscarPorId(int id);
}
