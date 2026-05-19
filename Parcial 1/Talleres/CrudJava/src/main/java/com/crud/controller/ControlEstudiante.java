package com.crud.controller;

import com.crud.model.Estudiante;
import com.crud.repository.RepositorioEstudiante;
import com.crud.view.FormularioCrudEstudiante;
import java.util.List;

/**
 * ControlEstudiante o Clase de Control.
 * Coordina la lógica de cada caso de uso y cumple el rol de <<control>> según la guía.
 */
public class ControlEstudiante {

    private RepositorioEstudiante repositorio;
    private FormularioCrudEstudiante formulario;

    public ControlEstudiante(RepositorioEstudiante repositorio, FormularioCrudEstudiante formulario) {
        this.repositorio = repositorio;
        this.formulario = formulario;

        // Suscripción de eventos a los botones definidos en el formulario
        this.formulario.getBtnCrear().addActionListener(e -> agregarEstudiante());
        this.formulario.getBtnActualizar().addActionListener(e -> actualizarEstudiante());
        this.formulario.getBtnEliminar().addActionListener(e -> eliminarEstudiante());
        this.formulario.getBtnListar().addActionListener(e -> mostrarTodos());
    }

    public void iniciar() {
        formulario.setVisible(true);
    }

    /**
     * Corresponde al comportamiento <<include>>: Validar datos del estudiante (UC5)
     */
    public boolean validarDatos(String id, String nombre, String edadStr) {
        if (id == null || id.trim().isEmpty()) {
            formulario.mostrarMensaje("Error: El ID es obligatorio y no puede estar vacío.");
            return false;
        }
        if (nombre == null || nombre.trim().isEmpty()) {
            formulario.mostrarMensaje("Error: El Nombre es obligatorio.");
            return false;
        }
        
        try {
            int edadVal = Integer.parseInt(edadStr.trim());
            if (edadVal <= 0) {
                formulario.mostrarMensaje("Error: La Edad debe ser mayor que 0.");
                return false;
            }
        } catch (NumberFormatException e) {
            formulario.mostrarMensaje("Error: La Edad debe ser numérica.");
            return false;
        }
        
        return true;
    }

    /**
     * Secuencia de Agregar estudiante.
     */
    public void agregarEstudiante() {
        String idStr = formulario.getTxtId();
        String nombre = formulario.getTxtNombre();
        String edadStr = formulario.getTxtEdad();
        
        if (validarDatos(idStr, nombre, edadStr)) {
            if (repositorio.existeId(idStr)) {
                formulario.mostrarMensaje("Error: Ya existe un estudiante con el ID " + idStr);
            } else {
                int edad = Integer.parseInt(edadStr.trim());
                Estudiante nuevo = new Estudiante(idStr, nombre, edad);
                repositorio.guardar(nuevo);
                formulario.mostrarMensaje("¡Estudiante agregado correctamente!");
                formulario.limpiarCampos();
                mostrarTodos();
            }
        }
    }

    /**
     * Secuencia de Actualizar estudiante.
     */
    public void actualizarEstudiante() {
        String idStr = formulario.getTxtId();
        String nombre = formulario.getTxtNombre();
        String edadStr = formulario.getTxtEdad();

        if (validarDatos(idStr, nombre, edadStr)) {
            if (repositorio.existeId(idStr)) {
                int edad = Integer.parseInt(edadStr.trim());
                Estudiante modificado = new Estudiante(idStr, nombre, edad);
                repositorio.actualizar(modificado);
                formulario.mostrarMensaje("¡Estudiante actualizado correctamente!");
                formulario.limpiarCampos();
                mostrarTodos();
            } else {
                formulario.mostrarMensaje("Error: Estudiante no encontrado para actualizar.");
            }
        }
    }

    /**
     * Secuencia de Eliminar estudiante.
     */
    public void eliminarEstudiante() {
        String idStr = formulario.getTxtId();
        if (idStr == null || idStr.trim().isEmpty()) {
            formulario.mostrarMensaje("Error: Ingrese un ID válido para eliminar.");
            return;
        }
        
        if (repositorio.existeId(idStr)) {
            repositorio.eliminar(idStr);
            formulario.mostrarMensaje("¡Estudiante eliminado correctamente!");
            formulario.limpiarCampos();
            mostrarTodos();
        } else {
            formulario.mostrarMensaje("Error: Estudiante no encontrado para eliminar.");
        }
    }

    /**
     * Secuencia de Mostrar Todos.
     */
    public void mostrarTodos() {
        List<Estudiante> lista = repositorio.listarTodos();
        formulario.mostrarTabla(lista);
    }
}
