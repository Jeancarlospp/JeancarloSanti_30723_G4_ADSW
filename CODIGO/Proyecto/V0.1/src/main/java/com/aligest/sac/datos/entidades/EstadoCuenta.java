package com.aligest.sac.datos.entidades;

public class EstadoCuenta {
    private int copropietarioId;
    private String periodo;
    private double montoBase;
    private double recargoMora;
    private double saldoPendiente;
    private String estado;

    public EstadoCuenta() {}

    public EstadoCuenta(int copropietarioId, String periodo, double montoBase, double recargoMora) {
        this.copropietarioId = copropietarioId;
        this.periodo = periodo;
        this.montoBase = montoBase;
        this.recargoMora = recargoMora;
        this.saldoPendiente = montoBase + recargoMora;
        this.estado = "PENDIENTE";
    }

    public double calcularTotal() {
        return this.montoBase + this.recargoMora;
    }

    public boolean estaVencido() {
        return this.estado.equals("VENCIDO");
    }

    // Getters y Setters
    public int getCopropietarioId() { return copropietarioId; }
    public void setCopropietarioId(int copropietarioId) { this.copropietarioId = copropietarioId; }

    public String getPeriodo() { return periodo; }
    public void setPeriodo(String periodo) { this.periodo = periodo; }

    public double getMontoBase() { return montoBase; }
    public void setMontoBase(double montoBase) { this.montoBase = montoBase; }

    public double getRecargoMora() { return recargoMora; }
    public void setRecargoMora(double recargoMora) { this.recargoMora = recargoMora; }

    public double getSaldoPendiente() { return saldoPendiente; }
    public void setSaldoPendiente(double saldoPendiente) { this.saldoPendiente = saldoPendiente; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    @Override
    public String toString() {
        return "EstadoCuenta{copropietarioId=" + copropietarioId + ", periodo=" + periodo + ", total=" + calcularTotal() + ", estado=" + estado + "}";
    }
}