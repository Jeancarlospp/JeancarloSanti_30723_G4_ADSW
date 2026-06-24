package LogicaNegocio.Observer;

import Datos.Estudiante;

public interface IObservador {
    void notificar(String evento, Estudiante estudiante);
}