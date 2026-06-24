package LogicaNegocio.Strategy;

import Datos.Estudiante;
import java.util.List;

public class ContextoBusqueda {
    private IEstrategiaBusqueda estrategia;

    public void setEstrategia(IEstrategiaBusqueda estrategia) {
        this.estrategia = estrategia;
    }

    public List<Estudiante> ejecutarBusqueda(List<Estudiante> estudiantes, String criterio) {
        if (estrategia == null) {
            throw new IllegalStateException("Estrategia de búsqueda no configurada.");
        }
        return estrategia.buscar(estudiantes, criterio);
    }
}