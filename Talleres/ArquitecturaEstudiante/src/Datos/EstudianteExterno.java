package Datos;

public class EstudianteExterno {
    private String codigo;
    private String nombreCompleto;
    private int anios;

    public EstudianteExterno(String codigo, String nombreCompleto, int anios) {
        this.codigo = codigo;
        this.nombreCompleto = nombreCompleto;
        this.anios = anios;
    }

    public String getCodigo() { return codigo; }
    public String getNombreCompleto() { return nombreCompleto; }
    public int getAnios() { return anios; }
}