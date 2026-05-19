package com.crud.view;

import com.crud.model.Estudiante;
import javax.swing.*;
import java.awt.*;
import java.util.List;

/**
 * FormularioCrudEstudiante o Clase de Frontera. 
 * Recibe datos del actor (Administrador) y muestra resultados.
 * Aplica estereotipo <<boundary>> según la guía.
 */
public class FormularioCrudEstudiante extends JFrame {
    private JTextField txtId;
    private JTextField txtNombre;
    private JTextField txtEdad;
    
    private JButton btnCrear;
    private JButton btnListar;
    private JButton btnActualizar;
    private JButton btnEliminar;
    
    private JTextArea txtAreaConsola;

    public FormularioCrudEstudiante() {
        super("CRUD de Estudiantes - MVC (Análisis PlantUML)");
        initComponents();
    }

    private void initComponents() {
        txtId = new JTextField(10);
        txtNombre = new JTextField(15);
        txtEdad = new JTextField(10);

        // Botones acordes a los casos de uso: Agregar, Actualizar, Eliminar, Mostrar Todo
        btnCrear = new JButton("Agregar");
        btnListar = new JButton("Mostrar Todo");
        btnActualizar = new JButton("Actualizar");
        btnEliminar = new JButton("Eliminar");

        txtAreaConsola = new JTextArea(10, 35);
        txtAreaConsola.setEditable(false);

        JPanel panelEntrada = new JPanel(new GridLayout(3, 2, 5, 5));
        panelEntrada.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        panelEntrada.add(new JLabel("ID del Estudiante:"));
        panelEntrada.add(txtId);
        panelEntrada.add(new JLabel("Nombre:"));
        panelEntrada.add(txtNombre);
        panelEntrada.add(new JLabel("Edad:"));
        panelEntrada.add(txtEdad);

        JPanel panelBotones = new JPanel(new FlowLayout());
        panelBotones.add(btnCrear);
        panelBotones.add(btnActualizar);
        panelBotones.add(btnEliminar);
        panelBotones.add(btnListar);

        setLayout(new BorderLayout(10, 10));
        add(panelEntrada, BorderLayout.NORTH);
        add(panelBotones, BorderLayout.CENTER);
        add(new JScrollPane(txtAreaConsola), BorderLayout.SOUTH);

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(480, 420);
        setLocationRelativeTo(null);
    }

    // Métodos para interactuar con la vista, extrayendo datos como strings
    public String getTxtId() { return txtId.getText(); }
    public String getTxtNombre() { return txtNombre.getText(); }
    public String getTxtEdad() { return txtEdad.getText(); }

    public void limpiarCampos() {
        txtId.setText("");
        txtNombre.setText("");
        txtEdad.setText("");
    }

    // Mostrar mensaje usando alerta
    public void mostrarMensaje(String mensaje) {
        JOptionPane.showMessageDialog(this, mensaje);
    }

    // Mostrar tabla o lista en el text area inferior
    public void mostrarTabla(List<Estudiante> estudiantes) {
        if (estudiantes.isEmpty()) {
            txtAreaConsola.setText("No hay estudiantes registrados.");
        } else {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("%-10s %-20s %-10s\n", "ID", "Nombre", "Edad"));
            sb.append("--------------------------------------------------\n");
            for (Estudiante e : estudiantes) {
                sb.append(String.format("%-10s %-20s %-10d\n", e.getId(), e.getNombre(), e.getEdad()));
            }
            txtAreaConsola.setText(sb.toString());
        }
    }

    // Exponer eventos para que el controlador (<<control>>) los procese
    public JButton getBtnCrear() { return btnCrear; }
    public JButton getBtnListar() { return btnListar; }
    public JButton getBtnActualizar() { return btnActualizar; }
    public JButton getBtnEliminar() { return btnEliminar; }
}
