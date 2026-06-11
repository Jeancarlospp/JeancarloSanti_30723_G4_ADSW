package composite;

public class Estudiante implements ComponenteAcademico{
    private int id;
    private String nombre;
    private int edad;

    public Estudiante(int id, String nombre, int edad){
        this.id = id;
        this.nombre = nombre;
        this.edad = edad;
    }

    public int getId(){
        return id;
    }

    public String getNombre(){
        return nombre;
    }
    public int getEdad(){
        return edad;
    }
    public void setNombre(String nombre){
        this.nombre = nombre;
    }

    public void setEdad(int edad){
        this.edad = edad;
    }

    @Override
    public String mostrarInformacion(){
        return "Estudiante [ID: " + id + ", Nombre: " + nombre + ", Edad: " + edad + "]";
     }
}
