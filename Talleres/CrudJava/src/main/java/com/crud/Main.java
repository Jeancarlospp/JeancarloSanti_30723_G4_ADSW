package com.crud;

import com.crud.controller.ControlEstudiante;
import com.crud.repository.RepositorioEstudiante;
import com.crud.view.FormularioCrudEstudiante;

import javax.swing.SwingUtilities;

public class Main {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            // Inicializar las piezas según la arquitectura de análisis: Repositorio e Interfaz
            RepositorioEstudiante repositorio = new RepositorioEstudiante(); 
            FormularioCrudEstudiante formulario = new FormularioCrudEstudiante();                   
            
            // Instanciar el control pasándole las piezas correspondientes
            ControlEstudiante control = new ControlEstudiante(repositorio, formulario);
            
            // Lanzar
            control.iniciar();
        });
    }
}