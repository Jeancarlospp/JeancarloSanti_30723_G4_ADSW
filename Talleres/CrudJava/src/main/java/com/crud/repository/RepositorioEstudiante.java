package com.crud.repository;

import com.crud.model.Estudiante;
import java.util.ArrayList;
import java.util.List;

/**
 * Repositorio / Colección. Conserva y recupera registros.
 * Aplica estereotipo <<repository>> según la guía.
 */
public class RepositorioEstudiante {
    private List<Estudiante> estudiantes;

    public RepositorioEstudiante() {
        this.estudiantes = new ArrayList<>();
    }

    public boolean existeId(String id) {
        return buscarPorId(id) != null;
    }

    public void guardar(Estudiante estudiante) {
        estudiantes.add(estudiante);
    }

    public Estudiante buscarPorId(String id) {
        for (Estudiante e : estudiantes) {
            if (e.getId().equals(id)) {
                return e;
            }
        }
        return null;
    }

    public void actualizar(Estudiante estudiante) {
        Estudiante e = buscarPorId(estudiante.getId());
        if (e != null) {
            e.setNombre(estudiante.getNombre());
            e.setEdad(estudiante.getEdad());
        }
    }

    public void eliminar(String id) {
        Estudiante estudiante = buscarPorId(id);
        if (estudiante != null) {
            estudiantes.remove(estudiante);
        }
    }

    public List<Estudiante> listarTodos() {
        return estudiantes;
    }
}