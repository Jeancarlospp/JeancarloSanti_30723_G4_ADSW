package com.aligest.sac.datos.repositorios;

import com.aligest.sac.datos.entidades.Copropietario;
import java.util.ArrayList;
import java.util.List;

public class RepositorioCopropietario {

    private List<Copropietario> copropietarios = new ArrayList<>();
    private int contadorId = 1;

    public List<Copropietario> buscarPorCriterio(String criterio) {
        List<Copropietario> resultado = new ArrayList<>();
        String criterioLower = criterio.toLowerCase();
        for (Copropietario c : copropietarios) {
            if (c.getNombre().toLowerCase().contains(criterioLower) ||
                c.getCedula().contains(criterio) ||
                c.getNumeroCasa().contains(criterio)) {
                resultado.add(c);
            }
        }
        return resultado;
    }

    public Copropietario buscarPorCedula(String cedula) {
        for (Copropietario c : copropietarios) {
            if (c.getCedula().equals(cedula)) {
                return c;
            }
        }
        return null;
    }

    public Copropietario buscarPorId(int id) {
        for (Copropietario c : copropietarios) {
            if (c.getId() == id) {
                return c;
            }
        }
        return null;
    }

    public void guardar(Copropietario copropietario) {
        copropietario.setId(contadorId++);
        copropietarios.add(copropietario);
    }

    public void actualizar(Copropietario copropietarioActualizado) {
        for (int i = 0; i < copropietarios.size(); i++) {
            if (copropietarios.get(i).getId() == copropietarioActualizado.getId()) {
                copropietarios.set(i, copropietarioActualizado);
                return;
            }
        }
    }

    public void eliminar(int id) {
        copropietarios.removeIf(c -> c.getId() == id);
    }

    public boolean existeCedula(String cedula) {
        for (Copropietario c : copropietarios) {
            if (c.getCedula().equals(cedula)) {
                return true;
            }
        }
        return false;
    }

    public List<Copropietario> listarTodos() {
        return new ArrayList<>(copropietarios);
    }
}