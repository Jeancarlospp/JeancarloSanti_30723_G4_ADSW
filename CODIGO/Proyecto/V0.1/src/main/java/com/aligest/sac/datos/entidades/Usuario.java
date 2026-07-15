package com.aligest.sac.datos.entidades;

public class Usuario {
    private int id;
    private String nombre;
    private String correo;
    private String contrasenaHash;
    private String rol;
    private int intentosFallidos;
    private String estado;

    public Usuario() {}

    public Usuario(int id, String nombre, String correo, String contrasenaHash, String rol) {
        this.id = id;
        this.nombre = nombre;
        this.correo = correo;
        this.contrasenaHash = contrasenaHash;
        this.rol = rol;
        this.intentosFallidos = 0;
        this.estado = "ACTIVO";
    }

    public boolean validarPassword(String passwordIngresada) {
        return this.contrasenaHash.equals(passwordIngresada);
    }

    public void incrementarIntentoFallido() {
        this.intentosFallidos++;
    }

    public void resetearIntentos() {
        this.intentosFallidos = 0;
    }

    public void actualizarContrasena(String nuevaHash) {
        this.contrasenaHash = nuevaHash;
    }

    public void cambiarRol(String nuevoRol) {
        this.rol = nuevoRol;
    }

    // Getters y Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getContrasenaHash() { return contrasenaHash; }
    public void setContrasenaHash(String contrasenaHash) { this.contrasenaHash = contrasenaHash; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public int getIntentosFallidos() { return intentosFallidos; }
    public void setIntentosFallidos(int intentosFallidos) { this.intentosFallidos = intentosFallidos; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    @Override
    public String toString() {
        return "Usuario{id=" + id + ", nombre=" + nombre + ", rol=" + rol + ", estado=" + estado + "}";
    }
}