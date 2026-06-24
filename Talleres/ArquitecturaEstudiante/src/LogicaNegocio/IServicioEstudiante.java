package LogicaNegocio;

import Datos.Estudiante;
import java.util.List;

public interface IServicioEstudiante {
    String registrarEstudiante(int id, String nombres, int edad);
    List<Estudiante> listarEstudiantes();
    Estudiante consultarEstudiantePorId(int id);
    String actualizarEstudiante(int id, String nuevosNombres, int nuevaEdad);
    String eliminarEstudiante(int id);
}