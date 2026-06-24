package LogicaNegocio.Observer;

import Datos.Estudiante;
import java.util.ArrayList;
import java.util.List;

public class HistorialObserver implements IObservador {
    private final List<String> historial = new ArrayList<>();

    @Override
    public void notificar(String evento, Estudiante estudiante) {
        String registro = "Evento: " + evento + " | Estudiante: " + estudiante.getNombres() + " (ID: " + estudiante.getId() + ")";
        historial.add(registro);
    }

    public List<String> obtenerHistorial() {
        return historial;
    }
}