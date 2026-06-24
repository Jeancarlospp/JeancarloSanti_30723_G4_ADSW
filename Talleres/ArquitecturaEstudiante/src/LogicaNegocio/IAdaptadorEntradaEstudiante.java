package LogicaNegocio;

import Datos.Estudiante;
import Datos.EstudianteExterno;

public interface IAdaptadorEntradaEstudiante {
    Estudiante convertirAEstudiante(EstudianteExterno externo);
}