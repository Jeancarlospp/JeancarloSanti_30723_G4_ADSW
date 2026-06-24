package LogicaNegocio;

import Datos.Estudiante;
import Datos.EstudianteExterno;

public class AdaptadorEntradaEstudiante implements IAdaptadorEntradaEstudiante {
    
    @Override
    public Estudiante convertirAEstudiante(EstudianteExterno externo) {
        if (externo == null) {
            throw new IllegalArgumentException("Los datos externos no pueden ser nulos.");
        }
        
        int idInterno = 0;
        try {
            idInterno = Integer.parseInt(externo.getCodigo());
        } catch (NumberFormatException e) {
            idInterno = 0; 
        }

        return new Estudiante(idInterno, externo.getNombreCompleto(), externo.getAnios());
    }
}