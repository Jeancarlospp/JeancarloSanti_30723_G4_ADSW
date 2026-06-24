package LogicaNegocio.Strategy;

import Datos.Estudiante;
import java.util.ArrayList;
import java.util.List;

public class BuscarPorNombre implements IEstrategiaBusqueda {
    @Override
    public List<Estudiante> buscar(List<Estudiante> estudiantes, String criterio) {
        List<Estudiante> resultado = new ArrayList<>();
        String criterioLower = criterio.toLowerCase();
        for (Estudiante est : estudiantes) {
            if (est.getNombres().toLowerCase().contains(criterioLower)) {
                resultado.add(est);
            }
        }
        return resultado;
    }
}