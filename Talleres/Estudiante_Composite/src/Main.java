import composite.Estudiante;
import composite.GrupoEstudiantes;

public class Main {
    public static void main (String[] args) {

        Estudiante estudiante1 = new Estudiante(1, "Jeancarlo", 15);
        Estudiante estudiante2 = new Estudiante(2, "Ana", 18);
        Estudiante estudiante3 = new Estudiante(3, "Luis", 20);

        GrupoEstudiantes grupoPrincipal = new GrupoEstudiantes("Sexto Semestre");

        grupoPrincipal.agregar(estudiante1);
        grupoPrincipal.agregar(estudiante2);
        grupoPrincipal.agregar(estudiante3);

        System.out.println(grupoPrincipal.mostrarInformacion());

    }
}