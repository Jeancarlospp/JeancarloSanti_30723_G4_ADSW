package Datos;

public class Estudiante {
    private int id;
    private String nombres;
    private int edad;

    public Estudiante(int id, String nombres, int edad) {
        this.id = id;
        this.nombres = nombres;
        this.edad = edad;
    }

    public int getId(){
        return id;
    }

    public String getNombres(){
        return nombres;
    }

    public int getEdad() {
        return edad;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public void setEdad(int edad) {
        this.edad = edad;
    }

    @Override
    public String toString() {
        return "ID: " + id +
                " | Nombres: " + nombres +
                " | Edad: " + edad;
    }
}
