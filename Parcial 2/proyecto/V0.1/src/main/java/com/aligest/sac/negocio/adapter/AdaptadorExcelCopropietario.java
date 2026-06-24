package com.aligest.sac.negocio.adapter;

import com.aligest.sac.datos.entidades.Copropietario;

public class AdaptadorExcelCopropietario implements IFuenteCopropietario {

    private FilaExcelCopropietario fila;

    public AdaptadorExcelCopropietario(FilaExcelCopropietario fila) {
        this.fila = fila;
    }

    @Override
    public String obtenerCedula() {
        if (fila.getCedulaTexto() == null) return "";
        return fila.getCedulaTexto().trim();
    }

    @Override
    public String obtenerNombre() {
        if (fila.getNombreCompletoTexto() == null) return "";
        return fila.getNombreCompletoTexto().trim();
    }

    @Override
    public String obtenerCorreo() {
        if (fila.getCorreoTexto() == null) return "";
        return fila.getCorreoTexto().trim().toLowerCase();
    }

    @Override
    public String obtenerTelefono() {
        if (fila.getTelefonoTexto() == null) return "";
        return fila.getTelefonoTexto().trim();
    }

    @Override
    public String obtenerNumeroCasa() {
        if (fila.getCasaTexto() == null) return "";
        return fila.getCasaTexto().trim();
    }

    public Copropietario convertirACopropietario() {
        Copropietario copropietario = new Copropietario();
        copropietario.setCedula(obtenerCedula());
        copropietario.setNombre(obtenerNombre());
        copropietario.setCorreo(obtenerCorreo());
        copropietario.setTelefono(obtenerTelefono());
        copropietario.setNumeroCasa(obtenerNumeroCasa());
        return copropietario;
    }

    @Override
    public String toString() {
        return "AdaptadorExcel{cedula=" + obtenerCedula() + ", nombre=" + obtenerNombre() + "}";
    }
}