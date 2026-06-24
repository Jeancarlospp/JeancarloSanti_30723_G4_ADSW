package LogicaNegocio.Strategy;

import Datos.Estudiante;
import java.util.List;

public interface IEstrategiaBusqueda {
    List<Estudiante> buscar(List<Estudiante> estudiantes, String criterio);
}