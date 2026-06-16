package com.aligest.sac.negocio.decorator;

import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.datos.entidades.EstadoCuenta;
import com.aligest.sac.datos.repositorios.RepositorioEstadoCuenta;
import com.aligest.sac.negocio.adapter.IFuenteCopropietario;
import java.util.List;

public class ValidacionCopropietarioDecorator extends ServicioCopropietarioDecorator {

    private RepositorioEstadoCuenta repositorioEstado;

    public ValidacionCopropietarioDecorator(IServicioCopropietario servicio,
                                             RepositorioEstadoCuenta repositorioEstado) {
        super(servicio);
        this.repositorioEstado = repositorioEstado;
    }

    @Override
    public List<String> importar(List<IFuenteCopropietario> filas) {
        for (IFuenteCopropietario fuente : filas) {
            if (!validarDatos(fuente)) {
                throw new IllegalArgumentException(
                    "Datos invalidos para: " + fuente.obtenerCedula()
                    + ". Verifique cedula, correo, telefono y numero de casa.");
            }
        }
        return servicio.importar(filas);
    }

    @Override
    public Copropietario actualizar(Copropietario copropietario) {
        if (copropietario.getCedula() == null || copropietario.getCedula().isEmpty()) {
            throw new IllegalArgumentException("La cedula no puede estar vacia.");
        }
        if (copropietario.getCorreo() == null || !copropietario.getCorreo().contains("@")) {
            throw new IllegalArgumentException("El correo no es valido.");
        }
        if (copropietario.getTelefono() == null || copropietario.getTelefono().isEmpty()) {
            throw new IllegalArgumentException("El telefono no puede estar vacio.");
        }
        return servicio.actualizar(copropietario);
    }

    @Override
    public void eliminar(int id) {
        if (tieneHistorialFinanciero(id)) {
            throw new IllegalStateException(
                "No se puede eliminar el copropietario ID " + id
                + " porque tiene historial financiero registrado.");
        }
        servicio.eliminar(id);
    }

    private boolean validarDatos(IFuenteCopropietario fuente) {
        if (fuente.obtenerCedula() == null || fuente.obtenerCedula().isEmpty()) return false;
        if (fuente.obtenerNombre() == null || fuente.obtenerNombre().isEmpty()) return false;
        if (fuente.obtenerCorreo() == null || !fuente.obtenerCorreo().contains("@")) return false;
        if (fuente.obtenerNumeroCasa() == null || fuente.obtenerNumeroCasa().isEmpty()) return false;
        return true;
    }

    private boolean tieneHistorialFinanciero(int id) {
        List<EstadoCuenta> estados = repositorioEstado.buscarPorCopropietario(id);
        return estados != null && !estados.isEmpty();
    }
}