const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();

// 1. Instanciar Base de Datos y Repositorio Directo para evitar fallos de importación
const db = require('./database');
const authService = require('./src/business/services/authService');
const copropietarioService = require('./src/business/services/copropietarioService');
const corePagoService = require('./src/business/services/pagoService');
const AuditPaymentServiceDecorator = require('./src/business/patterns/auditDecorator');
const decoratedPagoService = AuditPaymentServiceDecorator(corePagoService);

// 2. Middlewares Obligatorios de Captura de Datos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CAPA DE PRESENTACIÓN: ENDPOINTS DE LA API ---

// REQ001: Registro de Usuarios (Cifrado con BCrypt)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Campos incompletos" });
        }
        const user = await authService.registrarUsuario(username, password, role || 'ADMINISTRADOR');
        res.status(201).json({ mensaje: "Usuario registrado con éxito", user });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// REQ001: Autenticación / Inicio de Sesión
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const session = await authService.login(username, password);
        res.status(200).json({ mensaje: "Autenticación correcta", session });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

// REQ004: Importación Masiva (Adapter)
app.post('/api/copropietarios/importar', async (req, res) => {
    try {
        const filasExcelCrudas = req.body.filas;
        const importados = await copropietarioService.importarMasivoDesdeExcel(filasExcelCrudas);
        res.status(200).json({ mensaje: "Importación completada con éxito", copropietarios: importados });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REQ005: Consulta General de Copropietarios
app.get('/api/copropietarios', async (req, res) => {
    try {
        const lista = await copropietarioService.obtenerTodos();
        res.status(200).json(lista);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REQ009-REQ012: Procesar Transacción de Caja (Decorator + Strategy)
app.post('/api/pagos/registrar', async (req, res) => {
    try {
        const { copropietarioId, monto, comprobanteId } = req.body;
        const comprobanteDigital = await decoratedPagoService.procesarPago(copropietarioId, monto, comprobanteId);
        
        // REQ013 Alerta Automatizada Simulada de WhatsApp
        console.log(`[WhatsApp API Notification] Enviado al Copropietario ID: ${copropietarioId} -> Pago verificado formalmente.`);
        
        res.status(200).json({ mensaje: "Transacción inmutable procesada", comprobanteDigital });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- CAPA DE PRESENTACIÓN: RUTAS DEL NAVEGADOR (VISTAS HTML) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/presentation/views/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/presentation/views/dashboard.html'));
});

app.get('/pagos', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/presentation/views/pagos.html'));
});

// Manejo de errores globales para rutas no encontradas
app.use((req, res) => {
    res.status(404).send(`<h3>Error 404: La ruta [${req.method} ${req.url}] no está configurada en el servidor de AliGest.</h3>`);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Servidor de AliGest inicializado en puerto ${PORT}`);
    console.log(` Portal Visual Interactivo: http://localhost:3000`);
    console.log(`====================================================`);
});