package com.aligest.sac.negocio.servicios;

import com.aligest.sac.datos.entidades.EstadoCuenta;
import com.aligest.sac.datos.repositorios.RepositorioCopropietario;
import com.aligest.sac.datos.repositorios.RepositorioEstadoCuenta;
import com.aligest.sac.negocio.strategy.ContextoReporte;
import com.aligest.sac.negocio.strategy.IEstrategiaReporte;
import com.aligest.sac.negocio.strategy.ReporteEstadoCuenta;
import com.aligest.sac.negocio.strategy.ReporteMorosidad;
import com.aligest.sac.negocio.strategy.ReportePagos;
import java.util.List;

public class ServicioReportes {

    private RepositorioCopropietario repositorioCopropietario;
    private RepositorioEstadoCuenta repositorioEstadoCuenta;
    private ContextoReporte contextoReporte;

    public ServicioReportes(RepositorioCopropietario repositorioCopropietario,
                             RepositorioEstadoCuenta repositorioEstadoCuenta) {
        this.repositorioCopropietario = repositorioCopropietario;
        this.repositorioEstadoCuenta = repositorioEstadoCuenta;
        this.contextoReporte = new ContextoReporte(new ReporteEstadoCuenta());
    }

    public List<String> generarReporte(String tipoReporte, String filtro, String rolUsuario) {
        IEstrategiaReporte estrategia = seleccionarEstrategia(tipoReporte, rolUsuario);
        contextoReporte.establecerEstrategia(estrategia);
        List<EstadoCuenta> datos = repositorioEstadoCuenta.listarTodos();
        return contextoReporte.ejecutarReporte(filtro, datos);
    }

    private IEstrategiaReporte seleccionarEstrategia(String tipoReporte, String rolUsuario) {
        switch (tipoReporte.toUpperCase()) {
            case "PAGOS":
                return new ReportePagos();
            case "MOROSIDAD":
                if (!rolUsuario.equals("ADMINISTRADOR")) {
                    throw new SecurityException("Solo el administrador puede ver el reporte de morosidad.");
                }
                return new ReporteMorosidad();
            case "ESTADO_CUENTA":
                return new ReporteEstadoCuenta();
            default:
                throw new IllegalArgumentException("Tipo de reporte no reconocido: " + tipoReporte);
        }
    }

    public void imprimirReporte(List<String> reporte) {
        for (String linea : reporte) {
            System.out.println(linea);
        }
    }
}