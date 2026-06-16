package com.aligest.sac.datos.entidades;

import java.util.Date;

public class CodigoVerificacion {
    private String codigo;
    private int usuarioId;
    private Date fechaGeneracion;
    private Date fechaExpiracion;
    private boolean usado;

    public CodigoVerificacion() {}

    public CodigoVerificacion(String codigo, int usuarioId, Date fechaGeneracion, Date fechaExpiracion) {
        this.codigo = codigo;
        this.usuarioId = usuarioId;
        this.fechaGeneracion = fechaGeneracion;
        this.fechaExpiracion = fechaExpiracion;
        this.usado = false;
    }

    public boolean estaExpirado() {
        return new Date().after(this.fechaExpiracion);
    }

    public void marcarComoUsado() {
        this.usado = true;
    }

    // Getters y Setters
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public int getUsuarioId() { return usuarioId; }
    public void setUsuarioId(int usuarioId) { this.usuarioId = usuarioId; }

    public Date getFechaGeneracion() { return fechaGeneracion; }
    public void setFechaGeneracion(Date fechaGeneracion) { this.fechaGeneracion = fechaGeneracion; }

    public Date getFechaExpiracion() { return fechaExpiracion; }
    public void setFechaExpiracion(Date fechaExpiracion) { this.fechaExpiracion = fechaExpiracion; }

    public boolean isUsado() { return usado; }
    public void setUsado(boolean usado) { this.usado = usado; }

    @Override
    public String toString() {
        return "CodigoVerificacion{codigo=" + codigo + ", usuarioId=" + usuarioId + ", usado=" + usado + "}";
    }
}