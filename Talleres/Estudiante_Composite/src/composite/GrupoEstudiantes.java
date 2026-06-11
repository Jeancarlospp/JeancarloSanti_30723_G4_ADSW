package composite;
import  java.util.ArrayList;
import java.util.List;
public class GrupoEstudiantes  implements  ComponenteAcademico{
    private String nombreGrupo;
    private List<ComponenteAcademico> componentes;

    public GrupoEstudiantes(String nombreGrupo) {
        this.nombreGrupo = nombreGrupo;
        this.componentes = new ArrayList<>();
    }

    public void agregar(ComponenteAcademico componente) {
        componentes.add(componente);
    }

    public void eliminar(ComponenteAcademico componente){
        componentes.remove(componente);
    }

    @Override
    public String mostrarInformacion() {
        StringBuilder informacion = new StringBuilder();

        informacion.append("Grupo: ").append(nombreGrupo).append("\n");

        for (ComponenteAcademico componente : componentes) {
            informacion.append(" - ")
                    .append(componente.mostrarInformacion())
                    .append("\n");
        }

        return informacion.toString();
    }

}
