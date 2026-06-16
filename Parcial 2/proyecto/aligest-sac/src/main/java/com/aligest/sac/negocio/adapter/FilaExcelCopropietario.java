package com.aligest.sac.negocio.adapter;

public class FilaExcelCopropietario {

    private String cedulaTexto;
    private String nombreCompletoTexto;
    private String correoTexto;
    private String telefonoTexto;
    private String casaTexto;

    public FilaExcelCopropietario() {}

    public FilaExcelCopropietario(String cedulaTexto, String nombreCompletoTexto,
                                   String correoTexto, String telefonoTexto,
                                   String casaTexto) {
        this.cedulaTexto = cedulaTexto;
        this.nombreCompletoTexto = nombreCompletoTexto;
        this.correoTexto = correoTexto;
        this.telefonoTexto = telefonoTexto;
        this.casaTexto = casaTexto;
    }

    // Getters y Setters
    public String getCedulaTexto() { return cedulaTexto; }
    public void setCedulaTexto(String cedulaTexto) { this.cedulaTexto = cedulaTexto; }

    public String getNombreCompletoTexto() { return nombreCompletoTexto; }
    public void setNombreCompletoTexto(String nombreCompletoTexto) { this.nombreCompletoTexto = nombreCompletoTexto; }

    public String getCorreoTexto() { return correoTexto; }
    public void setCorreoTexto(String correoTexto) { this.correoTexto = correoTexto; }

    public String getTelefonoTexto() { return telefonoTexto; }
    public void setTelefonoTexto(String telefonoTexto) { this.telefonoTexto = telefonoTexto; }

    public String getCasaTexto() { return casaTexto; }
    public void setCasaTexto(String casaTexto) { this.casaTexto = casaTexto; }

    @Override
    public String toString() {
        return "FilaExcel{cedula=" + cedulaTexto + ", nombre=" + nombreCompletoTexto + ", casa=" + casaTexto + "}";
    }
}