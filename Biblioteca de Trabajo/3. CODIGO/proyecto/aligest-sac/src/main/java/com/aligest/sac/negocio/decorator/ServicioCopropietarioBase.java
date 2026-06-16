package com.aligest.sac.negocio.decorator;

import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.datos.repositorios.RepositorioCopropietario;
import com.aligest.sac.negocio.adapter.AdaptadorExcelCopropietario;
import com.aligest.sac.negocio.adapter.IFuenteCopropietario;
import java.util.ArrayList;
import java.util.List;

public class ServicioCopropietarioBase implements IServicioCopropietario {

    private RepositorioCopropietario repositorio;

    public ServicioCopropietarioBase(RepositorioCopropietario repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public List<String> importar(List<IFuenteCopropietario> filas) {
        List<String> resumen = new ArrayList<>();
        int importados = 0;
        int omitidos = 0;

        for (IFuenteCopropietario fuente : filas) {
            if (repositorio.existeCedula(fuente.obtenerCedula())) {
                resumen.add("OMITIDO (duplicado): " + fuente.obtenerCedula());
                omitidos++;
            } else {
                Copropietario nuevo = new Copropietario();
                nuevo.setCedula(fuente.obtenerCedula());
                nuevo.setNombre(fuente.obtenerNombre());
                nuevo.setCorreo(fuente.obtenerCorreo());
                nuevo.setTelefono(fuente.obtenerTelefono());
                nuevo.setNumeroCasa(fuente.obtenerNumeroCasa());
                repositorio.guardar(nuevo);
                resumen.add("IMPORTADO: " + fuente.obtenerNombre());
                importados++;
            }
        }

        resumen.add("--- Total importados: " + importados + " | Omitidos: " + omitidos + " ---");
        return resumen;
    }

    @Override
    public List<Copropietario> buscar(String criterio) {
        return repositorio.buscarPorCriterio(criterio);
    }

    @Override
    public Copropietario actualizar(Copropietario copropietario) {
        repositorio.actualizar(copropietario);
        return copropietario;
    }

    @Override
    public void eliminar(int id) {
        repositorio.eliminar(id);
    }
}