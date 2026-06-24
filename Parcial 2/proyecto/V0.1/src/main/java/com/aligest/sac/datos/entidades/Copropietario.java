package com.aligest.sac.datos.entidades;

import java.util.Date;

public class Copropietario {
    private int id;
    private String cedula;
    private String nombre;
    private String correo;
    private String telefono;
    private String numeroCasa;
    private int usuarioId;
    private Date fechaRegistro;

    public Copropietario() {}

    public Copropietario(int id, String cedula, String nombre, String correo,
                         String telefono, String numeroCasa) {
        this.id = id;
        this.cedula = cedula;
        this.nombre = nombre;
        this.correo = correo;
        this.telefono = telefono;
        this.numeroCasa = numeroCasa;
        this.fechaRegistro = new Date();
    }

    public void actualizarDatos(Copropietario datos) {
        this.nombre = datos.getNombre();
        this.correo = datos.getCorreo();
        this.telefono = datos.getTelefono();
        this.numeroCasa = datos.getNumeroCasa();
    }

    public boolean esDuplicado(String otraCedula) {
        return this.cedula.equals(otraCedula);
    }

    // Getters y Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getCedula() { return cedula; }
    public void setCedula(String cedula) { this.cedula = cedula; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getNumeroCasa() { return numeroCasa; }
    public void setNumeroCasa(String numeroCasa) { this.numeroCasa = numeroCasa; }

    public int getUsuarioId() { return usuarioId; }
    public void setUsuarioId(int usuarioId) { this.usuarioId = usuarioId; }

    public Date getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(Date fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    @Override
    public String toString() {
        return "Copropietario{id=" + id + ", cedula=" + cedula + ", nombre=" + nombre + ", casa=" + numeroCasa + "}";
    }
}