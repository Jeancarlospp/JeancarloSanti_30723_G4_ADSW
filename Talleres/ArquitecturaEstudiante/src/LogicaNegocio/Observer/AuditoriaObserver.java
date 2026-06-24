package LogicaNegocio.Observer;

import Datos.Estudiante;

public class AuditoriaObserver implements IObservador {
    @Override
    public void notificar(String evento, Estudiante estudiante) {
        System.out.println("  --> [OBSERVER - AUDITORÍA EN VIVO] Se detectó una operación de [" + evento + "] sobre el estudiante ID: " + estudiante.getId());
    }
}