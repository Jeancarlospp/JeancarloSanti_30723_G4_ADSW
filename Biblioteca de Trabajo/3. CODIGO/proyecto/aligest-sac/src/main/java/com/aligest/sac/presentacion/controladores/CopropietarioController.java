package com.aligest.sac.presentacion.controladores;

import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.negocio.adapter.IFuenteCopropietario;
import com.aligest.sac.negocio.decorator.IServicioCopropietario;
import com.aligest.sac.negocio.strategy.ContextoBusquedaCopropietario;
import com.aligest.sac.negocio.strategy.IEstrategiaBusqueda;
import com.aligest.sac.negocio.strategy.BusquedaPorCasa;
import com.aligest.sac.negocio.strategy.BusquedaPorNombre;
import com.aligest.sac.negocio.strategy.BusquedaPorEstadoCuenta;
import com.aligest.sac.negocio.strategy.BusquedaPorPerfil;
import com.aligest.sac.datos.repositorios.RepositorioCopropietario;
import com.aligest.sac.datos.repositorios.RepositorioEstadoCuenta;
import com.aligest.sac.datos.repositorios.RepositorioUsuario;
import java.util.List;

public class CopropietarioController {

    private IServicioCopropietario servicioCopropietario;
    private ContextoBusquedaCopropietario contextoBusqueda;
    private RepositorioCopropietario repositorioCopropietario;
    private RepositorioEstadoCuenta repositorioEstado;
    private RepositorioUsuario repositorioUsuario;

    public CopropietarioController(IServicioCopropietario servicioCopropietario,
                                    RepositorioCopropietario repositorioCopropietario,
                                    RepositorioEstadoCuenta repositorioEstado,
                                    RepositorioUsuario repositorioUsuario) {
        this.servicioCopropietario = servicioCopropietario;
        this.repositorioCopropietario = repositorioCopropietario;
        this.repositorioEstado = repositorioEstado;
        this.repositorioUsuario = repositorioUsuario;
        this.contextoBusqueda = new ContextoBusquedaCopropietario(new BusquedaPorNombre());
    }

    public IServicioCopropietario getServicioCopropietario() {
        return this.servicioCopropietario;
    }

    public List<String> importarDesdeExcel(List<IFuenteCopropietario> filas) {
        try {
            return servicioCopropietario.importar(filas);
        } catch (IllegalArgumentException e) {
            return List.of("ERROR: " + e.getMessage());
        }
    }

    public List<Copropietario> consultarCopropietarios(String tipoBusqueda, String criterio) {
        IEstrategiaBusqueda estrategia;
        switch (tipoBusqueda.toUpperCase()) {
            case "CASA":
                estrategia = new BusquedaPorCasa();
                break;
            case "NOMBRE":
                estrategia = new BusquedaPorNombre();
                break;
            case "ESTADO":
                estrategia = new BusquedaPorEstadoCuenta(repositorioEstado);
                break;
            case "PERFIL":
                estrategia = new BusquedaPorPerfil(repositorioUsuario);
                break;
            default:
                estrategia = new BusquedaPorNombre();
        }
        contextoBusqueda.establecerEstrategia(estrategia);
        List<Copropietario> todos = repositorioCopropietario.listarTodos();
        return contextoBusqueda.ejecutarBusqueda(criterio, todos);
    }

    public String modificarCopropietario(Copropietario copropietario) {
        try {
            servicioCopropietario.actualizar(copropietario);
            return "OK: Copropietario actualizado correctamente.";
        } catch (IllegalArgumentException e) {
            return "ERROR: " + e.getMessage();
        } catch (IllegalStateException e) {
            return "ERROR: " + e.getMessage();
        }
    }

    public String eliminarCopropietario(int id) {
        try {
            servicioCopropietario.eliminar(id);
            return "OK: Copropietario eliminado correctamente.";
        } catch (IllegalStateException e) {
            return "ERROR: " + e.getMessage();
        }
    }
}