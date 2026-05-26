import controller.EstudianteController;
import repository.EstudianteRepositoryProxy;
import repository.EstudianteRepositoryReal;
import repository.IEstudianteRepository;
import view.EstudianteView;

public class Main {

    public static void main(String[] args) {

        EstudianteRepositoryReal repositorioReal = new EstudianteRepositoryReal();

        IEstudianteRepository repositorioProxy = new EstudianteRepositoryProxy(repositorioReal);

        EstudianteController controller = new EstudianteController(repositorioProxy);

        EstudianteView view = new EstudianteView(controller);

        view.mostrarFormulario();
    }
}