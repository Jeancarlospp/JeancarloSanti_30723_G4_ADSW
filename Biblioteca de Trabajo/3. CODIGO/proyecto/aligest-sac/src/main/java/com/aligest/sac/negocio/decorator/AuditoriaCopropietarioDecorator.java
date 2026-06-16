package com.aligest.sac.negocio.decorator;

import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.negocio.adapter.IFuenteCopropietario;
import java.util.Date;
import java.util.List;

public class AuditoriaCopropietarioDecorator extends ServicioCopropietarioDecorator {

    private String usuarioActual;
    private static final java.util.List<java.util.function.Consumer<String>> logListeners = new java.util.ArrayList<>();

    public static void registrarListenerLog(java.util.function.Consumer<String> listener) {
        synchronized (logListeners) {
            logListeners.add(listener);
        }
    }

    public AuditoriaCopropietarioDecorator(IServicioCopropietario servicio, String usuarioActual) {
        super(servicio);
        this.usuarioActual = usuarioActual;
    }

    public void setUsuarioActual(String usuarioActual) {
        this.usuarioActual = usuarioActual;
    }

    @Override
    public List<String> importar(List<IFuenteCopropietario> filas) {
        List<String> resultado = servicio.importar(filas);
        registrarAuditoria("IMPORTAR", "Se importaron " + filas.size() + " filas.");
        return resultado;
    }

    @Override
    public Copropietario actualizar(Copropietario copropietario) {
        Copropietario resultado = servicio.actualizar(copropietario);
        registrarAuditoria("ACTUALIZAR", "Copropietario ID: " + copropietario.getId()
                + " | Nombre: " + copropietario.getNombre());
        return resultado;
    }

    @Override
    public void eliminar(int id) {
        servicio.eliminar(id);
        registrarAuditoria("ELIMINAR", "Copropietario ID: " + id);
    }

    private void registrarAuditoria(String accion, String detalle) {
        String log = "[AUDITORIA] " + new Date()
                + " | Usuario: " + usuarioActual
                + " | Accion: " + accion
                + " | Detalle: " + detalle;
        System.out.println(log);
        synchronized (logListeners) {
            for (java.util.function.Consumer<String> listener : logListeners) {
                try {
                    listener.accept(log);
                } catch (Exception e) {
                    // Ignorar excepciones de listeners
                }
            }
        }
    }
}