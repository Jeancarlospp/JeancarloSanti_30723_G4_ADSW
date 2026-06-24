package com.aligest.sac.presentacion.vistas;

import com.aligest.sac.datos.entidades.CodigoVerificacion;
import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.datos.entidades.EstadoCuenta;
import com.aligest.sac.datos.entidades.Usuario;
import com.aligest.sac.datos.repositorios.RepositorioCodigoVerificacion;
import com.aligest.sac.datos.repositorios.RepositorioCopropietario;
import com.aligest.sac.datos.repositorios.RepositorioEstadoCuenta;
import com.aligest.sac.datos.repositorios.RepositorioUsuario;
import com.aligest.sac.negocio.adapter.AdaptadorExcelCopropietario;
import com.aligest.sac.negocio.adapter.FilaExcelCopropietario;
import com.aligest.sac.negocio.adapter.IFuenteCopropietario;
import com.aligest.sac.negocio.decorator.AuditoriaCopropietarioDecorator;
import com.aligest.sac.presentacion.controladores.AccesoController;
import com.aligest.sac.presentacion.controladores.CopropietarioController;
import com.aligest.sac.presentacion.controladores.PerfilController;
import com.aligest.sac.presentacion.controladores.ReporteController;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.List;

public class VistaPrincipalGui extends JFrame {

    private final AccesoController accesoCtrl;
    private final PerfilController perfilCtrl;
    private final CopropietarioController coproCtrl;
    private final ReporteController reporteCtrl;

    private final RepositorioUsuario repoUsuario;
    private final RepositorioCopropietario repoCopropietario;
    private final RepositorioEstadoCuenta repoEstadoCuenta;
    private final RepositorioCodigoVerificacion repoCodigoVerificacion;

    private Usuario usuarioLogueado = null;

    // GUI Layout Components
    private CardLayout cardLayout;
    private JPanel mainContainer;

    // Login Panel Components
    private JTextField txtLoginCorreo;
    private JPasswordField txtLoginContrasena;
    private JLabel lblLoginMensaje;

    // Dashboard Panel Components
    private JLabel lblUsuarioNombre;
    private JLabel lblUsuarioRol;
    private JPanel cardsPanel;
    private CardLayout dashboardCardLayout;

    // Sidebar Tab Buttons
    private final List<JButton> sidebarButtons = new ArrayList<>();

    // Copropietarios Tab Components
    private DefaultTableModel copropietariosModel;
    private JTable tblCopropietarios;
    private JComboBox<String> cmbCriterioBusqueda;
    private JTextField txtBuscarCopropietario;

    // Users/Perfiles Tab Components
    private DefaultTableModel usuariosModel;
    private JTable tblUsuarios;
    private JComboBox<String> cmbNuevoRol;

    // Reportes Tab Components
    private JComboBox<String> cmbTipoReporte;
    private JTextField txtReportePeriodo;
    private JComboBox<String> cmbRolReporte;
    private JTextArea txtAreaReporte;

    // Log Auditoria Panel Components
    private JTextArea txtAreaAuditoriaLogs;

    // Color Palette
    private final Color COLOR_BG = new Color(18, 18, 18);
    private final Color COLOR_CARD = new Color(30, 30, 30);
    private final Color COLOR_INPUT = new Color(45, 45, 45);
    private final Color COLOR_ACCENT = new Color(0, 122, 204);
    private final Color COLOR_TEXT_WHITE = new Color(225, 225, 225);
    private final Color COLOR_TEXT_GRAY = new Color(160, 160, 160);
    private final Color COLOR_BORDER = new Color(60, 60, 60);
    private final Color COLOR_SUCCESS = new Color(3, 218, 198);
    private final Color COLOR_ERROR = new Color(207, 102, 121);

    public VistaPrincipalGui(AccesoController accesoCtrl,
                               PerfilController perfilCtrl,
                               CopropietarioController coproCtrl,
                               ReporteController reporteCtrl,
                               RepositorioUsuario repoUsuario,
                               RepositorioCopropietario repoCopropietario,
                               RepositorioEstadoCuenta repoEstadoCuenta,
                               RepositorioCodigoVerificacion repoCodigoVerificacion) {
        this.accesoCtrl = accesoCtrl;
        this.perfilCtrl = perfilCtrl;
        this.coproCtrl = coproCtrl;
        this.reporteCtrl = reporteCtrl;
        this.repoUsuario = repoUsuario;
        this.repoCopropietario = repoCopropietario;
        this.repoEstadoCuenta = repoEstadoCuenta;
        this.repoCodigoVerificacion = repoCodigoVerificacion;

        // Initialize Window
        setTitle("ALIGEST SAC - Sistema de Administración de Condominios");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(980, 680);
        setLocationRelativeTo(null);
        setMinimumSize(new Dimension(850, 580));

        // Configure Layout
        cardLayout = new CardLayout();
        mainContainer = new JPanel(cardLayout);
        mainContainer.setBackground(COLOR_BG);

        // Build Panels
        JPanel loginPanel = crearPanelLogin();
        JPanel dashboardPanel = crearPanelDashboard();

        mainContainer.add(loginPanel, "LOGIN");
        mainContainer.add(dashboardPanel, "DASHBOARD");

        setContentPane(mainContainer);
        cardLayout.show(mainContainer, "LOGIN");

        // Subscribe to Audit Logs
        AuditoriaCopropietarioDecorator.registrarListenerLog(log -> {
            SwingUtilities.invokeLater(() -> {
                if (txtAreaAuditoriaLogs != null) {
                    txtAreaAuditoriaLogs.append(log + "\n");
                    txtAreaAuditoriaLogs.setCaretPosition(txtAreaAuditoriaLogs.getDocument().getLength());
                }
            });
        });
    }

    // ==========================================
    // LOGIN PANEL CREATION
    // ==========================================
    private JPanel crearPanelLogin() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBackground(COLOR_BG);

        // Login Card
        JPanel card = new JPanel();
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setBackground(COLOR_CARD);
        card.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(COLOR_BORDER, 1),
                new EmptyBorder(30, 40, 30, 40)
        ));

        // Title
        JLabel lblTitulo = new JLabel("ALIGEST SAC");
        lblTitulo.setFont(new Font("Segoe UI", Font.BOLD, 28));
        lblTitulo.setForeground(COLOR_TEXT_WHITE);
        lblTitulo.setAlignmentX(Component.CENTER_ALIGNMENT);

        JLabel lblSubtitulo = new JLabel("Administración de Condominios");
        lblSubtitulo.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        lblSubtitulo.setForeground(COLOR_TEXT_GRAY);
        lblSubtitulo.setAlignmentX(Component.CENTER_ALIGNMENT);

        // Inputs
        JLabel lblCorreo = crearLabel("Correo Electrónico");
        txtLoginCorreo = crearTextField();
        txtLoginCorreo.setMaximumSize(new Dimension(320, 35));
        txtLoginCorreo.setText("admin@aligest.com");

        JLabel lblContrasena = crearLabel("Contraseña");
        txtLoginContrasena = crearPasswordField();
        txtLoginContrasena.setMaximumSize(new Dimension(320, 35));
        txtLoginContrasena.setText("Admin123!");

        // Error message
        lblLoginMensaje = new JLabel(" ");
        lblLoginMensaje.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        lblLoginMensaje.setForeground(COLOR_ERROR);
        lblLoginMensaje.setAlignmentX(Component.CENTER_ALIGNMENT);

        // Action Buttons
        JButton btnLogin = crearBotonPrimario("Iniciar Sesión");
        btnLogin.setMaximumSize(new Dimension(320, 40));
        btnLogin.setAlignmentX(Component.CENTER_ALIGNMENT);
        btnLogin.addActionListener(e -> ejecutarLogin());

        JButton btnRecuperar = crearBotonLink("¿Olvidó su contraseña?");
        btnRecuperar.setAlignmentX(Component.CENTER_ALIGNMENT);
        btnRecuperar.addActionListener(e -> mostrarDialogoRecuperacion());

        // Assembly
        card.add(lblTitulo);
        card.add(Box.createRigidArea(new Dimension(0, 5)));
        card.add(lblSubtitulo);
        card.add(Box.createRigidArea(new Dimension(0, 30)));
        card.add(lblCorreo);
        card.add(Box.createRigidArea(new Dimension(0, 5)));
        card.add(txtLoginCorreo);
        card.add(Box.createRigidArea(new Dimension(0, 15)));
        card.add(lblContrasena);
        card.add(Box.createRigidArea(new Dimension(0, 5)));
        card.add(txtLoginContrasena);
        card.add(Box.createRigidArea(new Dimension(0, 10)));
        card.add(lblLoginMensaje);
        card.add(Box.createRigidArea(new Dimension(0, 15)));
        card.add(btnLogin);
        card.add(Box.createRigidArea(new Dimension(0, 15)));
        card.add(btnRecuperar);

        panel.add(card);
        return panel;
    }

    private void ejecutarLogin() {
        String correo = txtLoginCorreo.getText().trim();
        String contrasena = new String(txtLoginContrasena.getPassword());

        if (correo.isEmpty() || contrasena.isEmpty()) {
            lblLoginMensaje.setText("Por favor, llene todos los campos.");
            return;
        }

        String resultado = accesoCtrl.iniciarSesion(correo, contrasena);
        if (resultado.startsWith("OK:")) {
            String[] partes = resultado.split(":");
            String rol = partes[1];
            String nombre = partes[2];

            usuarioLogueado = repoUsuario.buscarPorCorreo(correo);

            // Update Auditor decorator username
            if (coproCtrl.getServicioCopropietario() instanceof AuditoriaCopropietarioDecorator) {
                ((AuditoriaCopropietarioDecorator) coproCtrl.getServicioCopropietario()).setUsuarioActual(nombre);
            }

            // Load view state
            lblUsuarioNombre.setText(nombre);
            lblUsuarioRol.setText(usuarioLogueado != null ? usuarioLogueado.getRol() : rol);
            txtLoginContrasena.setText("");
            lblLoginMensaje.setText(" ");

            // Enable or disable Admin features based on role
            configurarVistasSegunRol(usuarioLogueado != null ? usuarioLogueado.getRol() : rol);

            // Switch to Dashboard
            cardLayout.show(mainContainer, "DASHBOARD");
            cambiarPestañaDashboard("COPROPIETARIOS");
        } else {
            lblLoginMensaje.setText(resultado);
        }
    }

    private void configurarVistasSegunRol(String rol) {
        boolean esAdmin = rol.equals("ADMINISTRADOR") || rol.equals("VISTA_ADMIN");
        // Disable admin-only tabs/buttons if not admin
        for (JButton btn : sidebarButtons) {
            String action = btn.getActionCommand();
            if (action.equals("IMPORTAR") || action.equals("PERFILES") || action.equals("AUDITORIA")) {
                btn.setVisible(esAdmin);
            }
        }
    }

    // ==========================================
    // RECUPERAR CONTRASEÑA DIALOG
    // ==========================================
    private void mostrarDialogoRecuperacion() {
        JDialog dialog = new JDialog(this, "Recuperar Contraseña", true);
        dialog.setSize(400, 320);
        dialog.setLocationRelativeTo(this);
        dialog.getContentPane().setBackground(COLOR_CARD);
        dialog.setLayout(new GridBagLayout());

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 15, 8, 15);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;

        JLabel lblInfo = new JLabel("Ingrese su correo registrado para recibir un código:");
        lblInfo.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        lblInfo.setForeground(COLOR_TEXT_GRAY);
        gbc.gridx = 0; gbc.gridy = 0; gbc.gridwidth = 2;
        dialog.add(lblInfo, gbc);

        JTextField txtCorreo = crearTextField();
        gbc.gridy = 1;
        dialog.add(txtCorreo, gbc);

        JButton btnEnviarCodigo = crearBotonPrimario("Enviar Código");
        gbc.gridy = 2; gbc.gridwidth = 2;
        dialog.add(btnEnviarCodigo, gbc);

        JLabel lblCodigoInfo = new JLabel("Ingrese el código de verificación y su nueva clave:");
        lblCodigoInfo.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        lblCodigoInfo.setForeground(COLOR_TEXT_GRAY);
        lblCodigoInfo.setVisible(false);
        gbc.gridy = 3;
        dialog.add(lblCodigoInfo, gbc);

        JPanel inputGroup = new JPanel(new GridLayout(2, 2, 10, 10));
        inputGroup.setBackground(COLOR_CARD);
        inputGroup.setVisible(false);

        JLabel lblCod = new JLabel("Código:");
        lblCod.setForeground(COLOR_TEXT_WHITE);
        JTextField txtCodigo = crearTextField();
        JLabel lblNuevaClave = new JLabel("Nueva clave:");
        lblNuevaClave.setForeground(COLOR_TEXT_WHITE);
        JPasswordField txtNuevaClave = crearPasswordField();

        inputGroup.add(lblCod);
        inputGroup.add(txtCodigo);
        inputGroup.add(lblNuevaClave);
        inputGroup.add(txtNuevaClave);

        gbc.gridy = 4;
        dialog.add(inputGroup, gbc);

        JButton btnActualizar = crearBotonPrimario("Actualizar Contraseña");
        btnActualizar.setVisible(false);
        gbc.gridy = 5;
        dialog.add(btnActualizar, gbc);

        JLabel lblResultado = new JLabel(" ", SwingConstants.CENTER);
        lblResultado.setFont(new Font("Segoe UI", Font.BOLD, 12));
        lblResultado.setForeground(COLOR_SUCCESS);
        gbc.gridy = 6;
        dialog.add(lblResultado, gbc);

        // Actions
        btnEnviarCodigo.addActionListener(e -> {
            String email = txtCorreo.getText().trim();
            if (email.isEmpty()) {
                lblResultado.setForeground(COLOR_ERROR);
                lblResultado.setText("Ingrese un correo electrónico.");
                return;
            }
            String res = accesoCtrl.solicitarRecuperacion(email);
            if (res.startsWith("OK")) {
                lblResultado.setForeground(COLOR_SUCCESS);
                lblResultado.setText("Código enviado (Ver consola o logs).");

                // Get simulated code directly from repo for convenience
                Usuario u = repoUsuario.buscarPorCorreo(email);
                if (u != null) {
                    CodigoVerificacion cv = repoCodigoVerificacion.buscarPorUsuario(u.getId());
                    if (cv != null) {
                        lblResultado.setText("Código enviado: " + cv.getCodigo() + " (Auto-llenado)");
                        txtCodigo.setText(cv.getCodigo());
                    }
                }

                // Show second stage
                lblCodigoInfo.setVisible(true);
                inputGroup.setVisible(true);
                btnActualizar.setVisible(true);
                btnEnviarCodigo.setVisible(false);
                txtCorreo.setEditable(false);
                dialog.pack();
                dialog.setSize(400, 380);
            } else {
                lblResultado.setForeground(COLOR_ERROR);
                lblResultado.setText(res);
            }
        });

        btnActualizar.addActionListener(e -> {
            String email = txtCorreo.getText().trim();
            String code = txtCodigo.getText().trim();
            String pass = new String(txtNuevaClave.getPassword());

            if (code.isEmpty() || pass.isEmpty()) {
                lblResultado.setForeground(COLOR_ERROR);
                lblResultado.setText("Llene el código y la contraseña.");
                return;
            }

            String res = accesoCtrl.validarCodigoYActualizarContrasena(email, code, pass);
            if (res.startsWith("OK")) {
                lblResultado.setForeground(COLOR_SUCCESS);
                lblResultado.setText("Contraseña actualizada exitosamente.");
                Timer t = new Timer(1500, evt -> dialog.dispose());
                t.setRepeats(false);
                t.start();
            } else {
                lblResultado.setForeground(COLOR_ERROR);
                lblResultado.setText(res);
            }
        });

        dialog.pack();
        dialog.setSize(400, 320);
        dialog.setVisible(true);
    }

    // ==========================================
    // DASHBOARD PANEL CREATION
    // ==========================================
    private JPanel crearPanelDashboard() {
        JPanel mainPanel = new JPanel(new BorderLayout());
        mainPanel.setBackground(COLOR_BG);

        // Sidebar
        JPanel sidebar = new JPanel();
        sidebar.setLayout(new BoxLayout(sidebar, BoxLayout.Y_AXIS));
        sidebar.setBackground(COLOR_CARD);
        sidebar.setBorder(BorderFactory.createMatteBorder(0, 0, 0, 1, COLOR_BORDER));
        sidebar.setPreferredSize(new Dimension(220, 0));

        // Sidebar Header
        JPanel sbHeader = new JPanel();
        sbHeader.setLayout(new BoxLayout(sbHeader, BoxLayout.Y_AXIS));
        sbHeader.setBackground(COLOR_CARD);
        sbHeader.setBorder(new EmptyBorder(20, 15, 20, 15));
        sbHeader.setAlignmentX(Component.CENTER_ALIGNMENT);

        JLabel lblAvatar = new JLabel("👤");
        lblAvatar.setFont(new Font("Segoe UI", Font.PLAIN, 40));
        lblAvatar.setForeground(COLOR_TEXT_WHITE);
        lblAvatar.setAlignmentX(Component.CENTER_ALIGNMENT);

        lblUsuarioNombre = new JLabel("Nombre Usuario");
        lblUsuarioNombre.setFont(new Font("Segoe UI", Font.BOLD, 14));
        lblUsuarioNombre.setForeground(COLOR_TEXT_WHITE);
        lblUsuarioNombre.setAlignmentX(Component.CENTER_ALIGNMENT);

        lblUsuarioRol = new JLabel("ROL");
        lblUsuarioRol.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        lblUsuarioRol.setForeground(COLOR_ACCENT);
        lblUsuarioRol.setAlignmentX(Component.CENTER_ALIGNMENT);

        sbHeader.add(lblAvatar);
        sbHeader.add(Box.createRigidArea(new Dimension(0, 8)));
        sbHeader.add(lblUsuarioNombre);
        sbHeader.add(Box.createRigidArea(new Dimension(0, 4)));
        sbHeader.add(lblUsuarioRol);

        // Sidebar Tabs Navigation
        JPanel sbNav = new JPanel(new GridLayout(6, 1, 5, 5));
        sbNav.setBackground(COLOR_CARD);
        sbNav.setBorder(new EmptyBorder(10, 10, 10, 10));

        JButton btnCopropietarios = crearBotonSidebar("Copropietarios", "COPROPIETARIOS");
        JButton btnImportar = crearBotonSidebar("Importar Excel", "IMPORTAR");
        JButton btnReportes = crearBotonSidebar("Reportes", "REPORTES");
        JButton btnPerfiles = crearBotonSidebar("Perfiles/Roles", "PERFILES");
        JButton btnAuditoria = crearBotonSidebar("Auditoría", "AUDITORIA");

        sbNav.add(btnCopropietarios);
        sbNav.add(btnImportar);
        sbNav.add(btnReportes);
        sbNav.add(btnPerfiles);
        sbNav.add(btnAuditoria);

        // Sidebar Footer (Logout)
        JPanel sbFooter = new JPanel(new BorderLayout());
        sbFooter.setBackground(COLOR_CARD);
        sbFooter.setBorder(new EmptyBorder(10, 10, 15, 10));
        JButton btnLogout = crearBotonPrimario("Cerrar Sesión");
        btnLogout.setBackground(new Color(120, 40, 40));
        btnLogout.addActionListener(e -> {
            usuarioLogueado = null;
            cardLayout.show(mainContainer, "LOGIN");
        });
        sbFooter.add(btnLogout, BorderLayout.CENTER);

        sidebar.add(sbHeader);
        sidebar.add(new JSeparator(SwingConstants.HORIZONTAL));
        sidebar.add(sbNav);
        sidebar.add(Box.createVerticalGlue());
        sidebar.add(sbFooter);

        // Right Content Area (Cards)
        dashboardCardLayout = new CardLayout();
        cardsPanel = new JPanel(dashboardCardLayout);
        cardsPanel.setBackground(COLOR_BG);

        // Create individual cards
        cardsPanel.add(crearCardCopropietarios(), "COPROPIETARIOS");
        cardsPanel.add(crearCardImportar(), "IMPORTAR");
        cardsPanel.add(crearCardReportes(), "REPORTES");
        cardsPanel.add(crearCardPerfiles(), "PERFILES");
        cardsPanel.add(crearCardAuditoria(), "AUDITORIA");

        mainPanel.add(sidebar, BorderLayout.WEST);
        mainPanel.add(cardsPanel, BorderLayout.CENTER);

        return mainPanel;
    }

    private JButton crearBotonSidebar(String label, String actionCommand) {
        JButton btn = new JButton(label);
        btn.setActionCommand(actionCommand);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btn.setForeground(COLOR_TEXT_WHITE);
        btn.setBackground(COLOR_CARD);
        btn.setFocusPainted(false);
        btn.setOpaque(true);
        btn.setContentAreaFilled(true);
        btn.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(btn.getBackground(), 1),
                new EmptyBorder(8, 15, 8, 15)
        ));
        btn.setHorizontalAlignment(SwingConstants.LEFT);
        btn.addMouseListener(new MouseAdapter() {
            public void mouseEntered(MouseEvent e) {
                if (!btn.getBackground().equals(COLOR_ACCENT)) {
                    btn.setBackground(new Color(50, 50, 50));
                }
                btn.setBorder(BorderFactory.createCompoundBorder(
                        new LineBorder(btn.getBackground(), 1),
                        new EmptyBorder(8, 15, 8, 15)
                ));
            }
            public void mouseExited(MouseEvent e) {
                if (!btn.getBackground().equals(COLOR_ACCENT)) {
                    btn.setBackground(COLOR_CARD);
                }
                btn.setBorder(BorderFactory.createCompoundBorder(
                        new LineBorder(btn.getBackground(), 1),
                        new EmptyBorder(8, 15, 8, 15)
                ));
            }
        });
        btn.addActionListener(e -> cambiarPestañaDashboard(actionCommand));
        sidebarButtons.add(btn);
        return btn;
    }

    private void cambiarPestañaDashboard(String cardName) {
        // Highlight correct button
        for (JButton btn : sidebarButtons) {
            if (btn.getActionCommand().equals(cardName)) {
                btn.setBackground(COLOR_ACCENT);
            } else {
                btn.setBackground(COLOR_CARD);
            }
            btn.setBorder(BorderFactory.createCompoundBorder(
                    new LineBorder(btn.getBackground(), 1),
                    new EmptyBorder(8, 15, 8, 15)
            ));
        }
        // Load data on tab select
        if (cardName.equals("COPROPIETARIOS")) {
            actualizarTablaCopropietarios();
        } else if (cardName.equals("PERFILES")) {
            actualizarTablaUsuarios();
        }

        dashboardCardLayout.show(cardsPanel, cardName);
    }

    // ==========================================
    // TAB CARDS CREATION
    // ==========================================

    // 1. COPROPIETARIOS TAB
    private JPanel crearCardCopropietarios() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBackground(COLOR_BG);
        panel.setBorder(new EmptyBorder(20, 20, 20, 20));

        // Top Filter Bar
        JPanel filterBar = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));
        filterBar.setBackground(COLOR_BG);

        JLabel lblFiltro = new JLabel("Buscar por:");
        lblFiltro.setForeground(COLOR_TEXT_WHITE);
        lblFiltro.setFont(new Font("Segoe UI", Font.BOLD, 13));

        cmbCriterioBusqueda = new JComboBox<>(new String[]{"NOMBRE", "CASA", "ESTADO", "PERFIL"});
        styleComboBox(cmbCriterioBusqueda);

        txtBuscarCopropietario = crearTextField();
        txtBuscarCopropietario.setPreferredSize(new Dimension(200, 28));

        JButton btnBuscar = crearBotonPrimario("Buscar");
        btnBuscar.setPreferredSize(new Dimension(85, 28));
        btnBuscar.addActionListener(e -> ejecutarBusquedaCopropietarios());

        JButton btnRestablecer = crearBotonPrimario("Restablecer");
        btnRestablecer.setBackground(new Color(60, 60, 60));
        btnRestablecer.setPreferredSize(new Dimension(100, 28));
        btnRestablecer.addActionListener(e -> {
            txtBuscarCopropietario.setText("");
            actualizarTablaCopropietarios();
        });

        filterBar.add(lblFiltro);
        filterBar.add(cmbCriterioBusqueda);
        filterBar.add(txtBuscarCopropietario);
        filterBar.add(btnBuscar);
        filterBar.add(btnRestablecer);

        // Center Table
        copropietariosModel = new DefaultTableModel(
                new Object[]{"ID", "Cédula", "Nombre", "Correo", "Teléfono", "Casa", "Usuario ID"}, 0
        ) {
            public boolean isCellEditable(int row, int col) { return false; }
        };
        tblCopropietarios = new JTable(copropietariosModel);
        styleTable(tblCopropietarios);
        JScrollPane scrollPane = new JScrollPane(tblCopropietarios);
        scrollPane.setBorder(new LineBorder(COLOR_BORDER));

        // Right/Bottom CRUD action panel
        JPanel crudPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        crudPanel.setBackground(COLOR_BG);

        JButton btnAgregar = crearBotonPrimario("Nuevo Copropietario");
        btnAgregar.addActionListener(e -> mostrarDialogoFormularioCopropietario(null));

        JButton btnEditar = crearBotonPrimario("Editar");
        btnEditar.setBackground(new Color(80, 80, 80));
        btnEditar.addActionListener(e -> {
            int selectedRow = tblCopropietarios.getSelectedRow();
            if (selectedRow == -1) {
                JOptionPane.showMessageDialog(this, "Seleccione un copropietario de la lista.", "Atención", JOptionPane.WARNING_MESSAGE);
                return;
            }
            int id = (int) copropietariosModel.getValueAt(selectedRow, 0);
            Copropietario c = repoCopropietario.buscarPorId(id);
            mostrarDialogoFormularioCopropietario(c);
        });

        JButton btnEliminar = crearBotonPrimario("Eliminar");
        btnEliminar.setBackground(COLOR_ERROR);
        btnEliminar.addActionListener(e -> ejecutarEliminarCopropietario());

        crudPanel.add(btnAgregar);
        crudPanel.add(btnEditar);
        crudPanel.add(btnEliminar);

        panel.add(filterBar, BorderLayout.NORTH);
        panel.add(scrollPane, BorderLayout.CENTER);
        panel.add(crudPanel, BorderLayout.SOUTH);

        return panel;
    }

    private void ejecutarBusquedaCopropietarios() {
        String tipo = (String) cmbCriterioBusqueda.getSelectedItem();
        String criterio = txtBuscarCopropietario.getText().trim();
        List<Copropietario> resultados = coproCtrl.consultarCopropietarios(tipo, criterio);

        copropietariosModel.setRowCount(0);
        for (Copropietario c : resultados) {
            copropietariosModel.addRow(new Object[]{
                    c.getId(),
                    c.getCedula(),
                    c.getNombre(),
                    c.getCorreo(),
                    c.getTelefono(),
                    c.getNumeroCasa(),
                    c.getUsuarioId() == 0 ? "Ninguno" : c.getUsuarioId()
            });
        }
    }

    private void actualizarTablaCopropietarios() {
        copropietariosModel.setRowCount(0);
        List<Copropietario> todos = repoCopropietario.listarTodos();
        for (Copropietario c : todos) {
            copropietariosModel.addRow(new Object[]{
                    c.getId(),
                    c.getCedula(),
                    c.getNombre(),
                    c.getCorreo(),
                    c.getTelefono(),
                    c.getNumeroCasa(),
                    c.getUsuarioId() == 0 ? "Ninguno" : c.getUsuarioId()
            });
        }
    }

    private void mostrarDialogoFormularioCopropietario(Copropietario coproExistente) {
        boolean esNuevo = (coproExistente == null);
        JDialog dialog = new JDialog(this, esNuevo ? "Nuevo Copropietario" : "Editar Copropietario", true);
        dialog.setSize(400, 360);
        dialog.setLocationRelativeTo(this);
        dialog.getContentPane().setBackground(COLOR_CARD);
        dialog.setLayout(new GridBagLayout());

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 15, 8, 15);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.weightx = 1.0;

        JTextField txtCedula = crearTextField();
        JTextField txtNombre = crearTextField();
        JTextField txtCorreo = crearTextField();
        JTextField txtTelefono = crearTextField();
        JTextField txtCasa = crearTextField();

        if (!esNuevo) {
            txtCedula.setText(coproExistente.getCedula());
            txtNombre.setText(coproExistente.getNombre());
            txtCorreo.setText(coproExistente.getCorreo());
            txtTelefono.setText(coproExistente.getTelefono());
            txtCasa.setText(coproExistente.getNumeroCasa());
        }

        // Add fields
        gbc.gridx = 0; gbc.gridy = 0; dialog.add(crearLabel("Cédula"), gbc);
        gbc.gridx = 1; dialog.add(txtCedula, gbc);

        gbc.gridx = 0; gbc.gridy = 1; dialog.add(crearLabel("Nombre Completo"), gbc);
        gbc.gridx = 1; dialog.add(txtNombre, gbc);

        gbc.gridx = 0; gbc.gridy = 2; dialog.add(crearLabel("Correo"), gbc);
        gbc.gridx = 1; dialog.add(txtCorreo, gbc);

        gbc.gridx = 0; gbc.gridy = 3; dialog.add(crearLabel("Teléfono"), gbc);
        gbc.gridx = 1; dialog.add(txtTelefono, gbc);

        gbc.gridx = 0; gbc.gridy = 4; dialog.add(crearLabel("Casa"), gbc);
        gbc.gridx = 1; dialog.add(txtCasa, gbc);

        JButton btnGuardar = crearBotonPrimario("Guardar");
        gbc.gridx = 0; gbc.gridy = 5; gbc.gridwidth = 2;
        dialog.add(btnGuardar, gbc);

        JLabel lblError = new JLabel(" ", SwingConstants.CENTER);
        lblError.setForeground(COLOR_ERROR);
        lblError.setFont(new Font("Segoe UI", Font.BOLD, 12));
        gbc.gridy = 6;
        dialog.add(lblError, gbc);

        btnGuardar.addActionListener(e -> {
            String cedula = txtCedula.getText().trim();
            String nombre = txtNombre.getText().trim();
            String correo = txtCorreo.getText().trim();
            String telefono = txtTelefono.getText().trim();
            String casa = txtCasa.getText().trim();

            if (cedula.isEmpty() || nombre.isEmpty() || correo.isEmpty() || casa.isEmpty()) {
                lblError.setText("Por favor, llene los campos obligatorios.");
                return;
            }

            try {
                if (esNuevo) {
                    // Create manual row data using Adapter mapping pattern
                    IFuenteCopropietario fuenteForm = new IFuenteCopropietario() {
                        public String obtenerCedula() { return cedula; }
                        public String obtenerNombre() { return nombre; }
                        public String obtenerCorreo() { return correo; }
                        public String obtenerTelefono() { return telefono; }
                        public String obtenerNumeroCasa() { return casa; }
                    };
                    List<String> res = coproCtrl.getServicioCopropietario().importar(List.of(fuenteForm));
                    if (res.get(0).startsWith("OMITIDO")) {
                        lblError.setText("Cédula ya registrada.");
                        return;
                    }
                } else {
                    coproExistente.setCedula(cedula);
                    coproExistente.setNombre(nombre);
                    coproExistente.setCorreo(correo);
                    coproExistente.setTelefono(telefono);
                    coproExistente.setNumeroCasa(casa);

                    String res = coproCtrl.modificarCopropietario(coproExistente);
                    if (res.startsWith("ERROR")) {
                        lblError.setText(res);
                        return;
                    }
                }
                actualizarTablaCopropietarios();
                dialog.dispose();
            } catch (Exception ex) {
                lblError.setText("ERROR: " + ex.getMessage());
            }
        });

        dialog.pack();
        dialog.setSize(400, 360);
        dialog.setVisible(true);
    }

    private void ejecutarEliminarCopropietario() {
        int selectedRow = tblCopropietarios.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, "Seleccione un copropietario de la lista.", "Atención", JOptionPane.WARNING_MESSAGE);
            return;
        }

        int id = (int) copropietariosModel.getValueAt(selectedRow, 0);
        String nombre = (String) copropietariosModel.getValueAt(selectedRow, 2);

        int confirm = JOptionPane.showConfirmDialog(this,
                "¿Está seguro de eliminar al copropietario: " + nombre + "?",
                "Confirmación", JOptionPane.YES_NO_OPTION);

        if (confirm == JOptionPane.YES_OPTION) {
            String resultado = coproCtrl.eliminarCopropietario(id);
            if (resultado.startsWith("ERROR")) {
                JOptionPane.showMessageDialog(this, resultado, "Error de Operación (Regla de Negocio)", JOptionPane.ERROR_MESSAGE);
            } else {
                JOptionPane.showMessageDialog(this, resultado, "Éxito", JOptionPane.INFORMATION_MESSAGE);
                actualizarTablaCopropietarios();
            }
        }
    }

    // 2. IMPORTAR TAB (Adapter Pattern)
    private JPanel crearCardImportar() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBackground(COLOR_BG);
        panel.setBorder(new EmptyBorder(25, 25, 25, 25));

        // Instructions
        JPanel txtContainer = new JPanel();
        txtContainer.setLayout(new BoxLayout(txtContainer, BoxLayout.Y_AXIS));
        txtContainer.setBackground(COLOR_CARD);
        txtContainer.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(COLOR_BORDER),
                new EmptyBorder(15, 20, 15, 20)
        ));

        JLabel title = new JLabel("Importar Copropietarios desde Hoja de Cálculo (Patrón Adapter)");
        title.setFont(new Font("Segoe UI", Font.BOLD, 16));
        title.setForeground(COLOR_TEXT_WHITE);

        JTextArea info = new JTextArea(
                "Este módulo utiliza el Patrón Adapter para traducir datos tabulares en formato plano\n" +
                "(filas tipo Excel / CSV) al dominio de negocio interno de ALIGEST SAC.\n\n" +
                "Filas preparadas para simulación:\n" +
                "  1. Ced: 1712345679 | Torres Vega Lucia | lucia.torres@email.com | 0961122334 | Casa-03\n" +
                "  2. Ced: 1756789012 | Sanchez Ruiz Elena | elena.sanchez@email.com | 0955566677 | Casa-04"
        );
        info.setEditable(false);
        info.setBackground(COLOR_CARD);
        info.setForeground(COLOR_TEXT_GRAY);
        info.setFont(new Font("Segoe UI", Font.PLAIN, 13));

        txtContainer.add(title);
        txtContainer.add(Box.createRigidArea(new Dimension(0, 10)));
        txtContainer.add(info);

        // Run Adapter Button
        JPanel buttonGroup = new JPanel(new FlowLayout(FlowLayout.CENTER));
        buttonGroup.setBackground(COLOR_BG);
        JButton btnImportar = crearBotonPrimario("Ejecutar Simulación de Importación (Adaptar Excel)");
        btnImportar.setPreferredSize(new Dimension(380, 45));

        JTextArea resultArea = new JTextArea(5, 50);
        resultArea.setBackground(COLOR_CARD);
        resultArea.setForeground(COLOR_SUCCESS);
        resultArea.setFont(new Font("Consolas", Font.PLAIN, 12));
        resultArea.setEditable(false);
        resultArea.setBorder(new LineBorder(COLOR_BORDER));
        JScrollPane scroll = new JScrollPane(resultArea);

        btnImportar.addActionListener(e -> {
            List<FilaExcelCopropietario> filasExcel = new ArrayList<>();
            filasExcel.add(new FilaExcelCopropietario("1712345679", "Torres Vega Lucia", "lucia.torres@email.com", "0961122334", "Casa-03"));
            filasExcel.add(new FilaExcelCopropietario("1756789012", "Sanchez Ruiz Elena", "elena.sanchez@email.com", "0955566677", "Casa-04"));

            List<IFuenteCopropietario> fuentesAdaptadas = new ArrayList<>();
            for (FilaExcelCopropietario fila : filasExcel) {
                fuentesAdaptadas.add(new AdaptadorExcelCopropietario(fila));
            }

            List<String> res = coproCtrl.importarDesdeExcel(fuentesAdaptadas);
            resultArea.setText("=== LOG DE IMPORTACIÓN DEL ADAPTADOR ===\n");
            for (String line : res) {
                resultArea.append(line + "\n");
            }
            actualizarTablaCopropietarios();
        });

        buttonGroup.add(btnImportar);

        panel.add(txtContainer, BorderLayout.NORTH);
        panel.add(scroll, BorderLayout.CENTER);
        panel.add(buttonGroup, BorderLayout.SOUTH);

        return panel;
    }

    // 3. REPORTES TAB (Strategy Pattern)
    private JPanel crearCardReportes() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBackground(COLOR_BG);
        panel.setBorder(new EmptyBorder(20, 20, 20, 20));

        // Config Controls
        JPanel configBar = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 5));
        configBar.setBackground(COLOR_CARD);
        configBar.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(COLOR_BORDER),
                new EmptyBorder(10, 10, 10, 10)
        ));

        cmbTipoReporte = new JComboBox<>(new String[]{"PAGOS", "MOROSIDAD", "ESTADO_CUENTA"});
        styleComboBox(cmbTipoReporte);

        txtReportePeriodo = crearTextField();
        txtReportePeriodo.setPreferredSize(new Dimension(100, 28));
        txtReportePeriodo.setText("2026-05");

        cmbRolReporte = new JComboBox<>(new String[]{"ADMINISTRADOR", "COPROPIETARIO"});
        styleComboBox(cmbRolReporte);

        JButton btnReporte = crearBotonPrimario("Generar Reporte");
        btnReporte.addActionListener(e -> generarReporteVisual());

        configBar.add(crearLabel("Tipo de Reporte:"));
        configBar.add(cmbTipoReporte);
        configBar.add(crearLabel("Periodo:"));
        configBar.add(txtReportePeriodo);
        configBar.add(crearLabel("Consultar como:"));
        configBar.add(cmbRolReporte);
        configBar.add(btnReporte);

        // Display text area
        txtAreaReporte = new JTextArea();
        txtAreaReporte.setBackground(COLOR_CARD);
        txtAreaReporte.setForeground(new Color(200, 220, 200));
        txtAreaReporte.setFont(new Font("Consolas", Font.PLAIN, 13));
        txtAreaReporte.setEditable(false);
        txtAreaReporte.setBorder(new EmptyBorder(10, 10, 10, 10));

        JScrollPane scroll = new JScrollPane(txtAreaReporte);
        scroll.setBorder(new LineBorder(COLOR_BORDER));

        panel.add(configBar, BorderLayout.NORTH);
        panel.add(scroll, BorderLayout.CENTER);

        return panel;
    }

    private void generarReporteVisual() {
        String tipo = (String) cmbTipoReporte.getSelectedItem();
        String periodo = txtReportePeriodo.getText().trim();
        String rol = (String) cmbRolReporte.getSelectedItem();

        if (periodo.isEmpty()) {
            txtAreaReporte.setText("Error: Defina un periodo válido.");
            return;
        }

        List<String> lineas = reporteCtrl.generarReporte(tipo, periodo, rol);
        txtAreaReporte.setText("");
        for (String l : lineas) {
            txtAreaReporte.append(l + "\n");
        }
    }

    // 4. PERFILES/ROLES TAB
    private JPanel crearCardPerfiles() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBackground(COLOR_BG);
        panel.setBorder(new EmptyBorder(20, 20, 20, 20));

        // Users Table
        usuariosModel = new DefaultTableModel(new Object[]{"ID", "Nombre", "Correo", "Rol", "Estado"}, 0) {
            public boolean isCellEditable(int row, int col) { return false; }
        };
        tblUsuarios = new JTable(usuariosModel);
        styleTable(tblUsuarios);
        JScrollPane scroll = new JScrollPane(tblUsuarios);
        scroll.setBorder(new LineBorder(COLOR_BORDER));

        // Actions panel
        JPanel actionPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 15, 0));
        actionPanel.setBackground(COLOR_BG);

        cmbNuevoRol = new JComboBox<>(new String[]{"ADMINISTRADOR", "COPROPIETARIO"});
        styleComboBox(cmbNuevoRol);

        JButton btnActualizarRol = crearBotonPrimario("Cambiar Rol");
        btnActualizarRol.addActionListener(e -> ejecutarCambioRol());

        actionPanel.add(crearLabel("Nuevo Rol para el usuario seleccionado:"));
        actionPanel.add(cmbNuevoRol);
        actionPanel.add(btnActualizarRol);

        panel.add(scroll, BorderLayout.CENTER);
        panel.add(actionPanel, BorderLayout.SOUTH);

        return panel;
    }

    private void actualizarTablaUsuarios() {
        usuariosModel.setRowCount(0);
        List<Usuario> todos = repoUsuario.listarTodos();
        for (Usuario u : todos) {
            usuariosModel.addRow(new Object[]{
                    u.getId(),
                    u.getNombre(),
                    u.getCorreo(),
                    u.getRol(),
                    u.getEstado()
            });
        }
    }

    private void ejecutarCambioRol() {
        int selectedRow = tblUsuarios.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, "Seleccione un usuario de la lista.", "Atención", JOptionPane.WARNING_MESSAGE);
            return;
        }

        int id = (int) usuariosModel.getValueAt(selectedRow, 0);
        String nuevoRol = (String) cmbNuevoRol.getSelectedItem();

        String res = perfilCtrl.cambiarPerfil(id, nuevoRol);
        JOptionPane.showMessageDialog(this, res, "Perfil Actualizado", JOptionPane.INFORMATION_MESSAGE);
        actualizarTablaUsuarios();
    }

    // 5. AUDITORÍA LOGS TAB (Decorator Log Visualizer)
    private JPanel crearCardAuditoria() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBackground(COLOR_BG);
        panel.setBorder(new EmptyBorder(20, 20, 20, 20));

        JLabel title = new JLabel("Consola de Auditoría (Patrón Decorator logs en tiempo real)");
        title.setFont(new Font("Segoe UI", Font.BOLD, 15));
        title.setForeground(COLOR_TEXT_WHITE);

        txtAreaAuditoriaLogs = new JTextArea();
        txtAreaAuditoriaLogs.setBackground(new Color(15, 15, 15));
        txtAreaAuditoriaLogs.setForeground(new Color(250, 180, 80));
        txtAreaAuditoriaLogs.setFont(new Font("Consolas", Font.PLAIN, 12));
        txtAreaAuditoriaLogs.setEditable(false);
        txtAreaAuditoriaLogs.setBorder(new EmptyBorder(8, 8, 8, 8));

        JScrollPane scroll = new JScrollPane(txtAreaAuditoriaLogs);
        scroll.setBorder(new LineBorder(COLOR_BORDER));

        JButton btnClear = crearBotonPrimario("Limpiar Consola");
        btnClear.setBackground(new Color(80, 80, 80));
        btnClear.addActionListener(e -> txtAreaAuditoriaLogs.setText(""));

        panel.add(title, BorderLayout.NORTH);
        panel.add(scroll, BorderLayout.CENTER);
        panel.add(btnClear, BorderLayout.SOUTH);

        return panel;
    }

    // ==========================================
    // STYLING HELPERS
    // ==========================================
    private JLabel crearLabel(String text) {
        JLabel lbl = new JLabel(text);
        lbl.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lbl.setForeground(COLOR_TEXT_WHITE);
        return lbl;
    }

    private JTextField crearTextField() {
        JTextField field = new JTextField();
        field.setBackground(COLOR_INPUT);
        field.setForeground(COLOR_TEXT_WHITE);
        field.setCaretColor(COLOR_TEXT_WHITE);
        field.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        field.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(COLOR_BORDER, 1),
                new EmptyBorder(4, 8, 4, 8)
        ));
        return field;
    }

    private JPasswordField crearPasswordField() {
        JPasswordField field = new JPasswordField();
        field.setBackground(COLOR_INPUT);
        field.setForeground(COLOR_TEXT_WHITE);
        field.setCaretColor(COLOR_TEXT_WHITE);
        field.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        field.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(COLOR_BORDER, 1),
                new EmptyBorder(4, 8, 4, 8)
        ));
        return field;
    }

    private JButton crearBotonPrimario(String label) {
        JButton btn = new JButton(label);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btn.setForeground(COLOR_TEXT_WHITE);
        btn.setBackground(COLOR_ACCENT);
        btn.setFocusPainted(false);
        btn.setOpaque(true);
        btn.setContentAreaFilled(true);
        btn.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(btn.getBackground(), 1),
                new EmptyBorder(8, 20, 8, 20)
        ));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.addMouseListener(new MouseAdapter() {
            public void mouseEntered(MouseEvent e) {
                btn.setBackground(btn.getBackground().brighter());
                btn.setBorder(BorderFactory.createCompoundBorder(
                        new LineBorder(btn.getBackground(), 1),
                        new EmptyBorder(8, 20, 8, 20)
                ));
            }
            public void mouseExited(MouseEvent e) {
                if (btn.getBackground().brighter().equals(COLOR_ACCENT.brighter())) {
                    btn.setBackground(COLOR_ACCENT);
                } else if (btn.getBackground().equals(COLOR_ERROR.brighter())) {
                    btn.setBackground(COLOR_ERROR);
                }
                btn.setBorder(BorderFactory.createCompoundBorder(
                        new LineBorder(btn.getBackground(), 1),
                        new EmptyBorder(8, 20, 8, 20)
                ));
            }
        });
        return btn;
    }

    private JButton crearBotonLink(String label) {
        JButton btn = new JButton(label);
        btn.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        btn.setForeground(COLOR_ACCENT);
        btn.setBackground(COLOR_CARD);
        btn.setBorder(null);
        btn.setOpaque(false);
        btn.setContentAreaFilled(false);
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.addMouseListener(new MouseAdapter() {
            public void mouseEntered(MouseEvent e) {
                btn.setForeground(COLOR_ACCENT.brighter());
            }
            public void mouseExited(MouseEvent e) {
                btn.setForeground(COLOR_ACCENT);
            }
        });
        return btn;
    }

    private void styleComboBox(JComboBox<String> combo) {
        combo.setBackground(COLOR_INPUT);
        combo.setForeground(COLOR_TEXT_WHITE);
        combo.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        combo.setBorder(new LineBorder(COLOR_BORDER));
        combo.setFocusable(false);
    }

    private void styleTable(JTable table) {
        table.setBackground(COLOR_CARD);
        table.setForeground(COLOR_TEXT_WHITE);
        table.setSelectionBackground(COLOR_ACCENT);
        table.setSelectionForeground(COLOR_TEXT_WHITE);
        table.setGridColor(COLOR_BORDER);
        table.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        table.setRowHeight(25);
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);

        // Header Styling
        JTableHeader header = table.getTableHeader();
        header.setBackground(COLOR_BG);
        header.setForeground(COLOR_TEXT_WHITE);
        header.setFont(new Font("Segoe UI", Font.BOLD, 13));
        header.setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, COLOR_BORDER));

        // Cell Alignment / Rendering
        DefaultTableCellRenderer centerRenderer = new DefaultTableCellRenderer();
        centerRenderer.setHorizontalAlignment(JLabel.CENTER);
        table.setDefaultRenderer(Object.class, new DefaultTableCellRenderer() {
            public Component getTableCellRendererComponent(JTable t, Object v, boolean s, boolean f, int r, int c) {
                Component comp = super.getTableCellRendererComponent(t, v, s, f, r, c);
                comp.setForeground(COLOR_TEXT_WHITE);
                if (s) {
                    comp.setBackground(COLOR_ACCENT);
                } else {
                    comp.setBackground(r % 2 == 0 ? COLOR_CARD : new Color(38, 38, 38));
                }
                setBorder(BorderFactory.createEmptyBorder(0, 5, 0, 5));
                return comp;
            }
        });
    }
}
