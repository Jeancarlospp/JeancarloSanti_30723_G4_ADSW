package LogicaNegocio.Strategy;

import Datos.Estudiante;
import java.util.ArrayList;
import java.util.List;

public class BuscarPorID implements IEstrategiaBusqueda {
    @Override
    public List<Estudiante> buscar(List<Estudiante> estudiantes, String criterio) {
        List<Estudiante> resultado = new ArrayList<>();
        try {
            int idBuscado = Integer.parseInt(criterio);
            for (Estudiante est : estudiantes) {
                if (est.getId() == idBuscado) {
                    resultado.add(est);
                    break; // El ID es único
                }
            }
        } catch (NumberFormatException e) {
            System.out.println("[STRATEGY] Error: Para buscar por ID debe ingresar un número.");
        }
        return resultado;
    }
}