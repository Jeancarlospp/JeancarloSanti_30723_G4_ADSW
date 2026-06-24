package LogicaNegocio.Observer;

import Datos.Estudiante;
import java.util.ArrayList;
import java.util.List;

public class GestorEventosEstudiante {
    private final List<IObservador> observadores = new ArrayList<>();

    public void suscribir(IObservador observador) {
        observadores.add(observador);
    }

    public void desuscribir(IObservador observador) {
        observadores.remove(observador);
    }

    public void notificar(String evento, Estudiante estudiante) {
        for (IObservador obs : observadores) {
            obs.notificar(evento, estudiante);
        }
    }
}