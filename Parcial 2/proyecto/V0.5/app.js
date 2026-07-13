const express = require('express');
const path = require('path');
const app = express();
const db = require('./config/database');
const authService = require('./src/core/business/services/AuthService');
const usuarioRepository = require('./src/data/repositories/usuarioRepository');

// Middlewares obligatorios
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/imagenes', express.static(path.join(__dirname, 'imagenes')));

// Cargar Controladores de Capa de Presentación
const authController = require('./src/presentation/controllers/authController');
const copropietarioController = require('./src/presentation/controllers/copropietarioController');
const pagoController = require('./src/presentation/controllers/pagoController');

// Asociar rutas de API
app.use('/api/auth', authController);
app.use('/api/copropietarios', copropietarioController);
app.use('/api/pagos', pagoController);

// Servir vistas HTML estáticas (Capa de Presentación)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/presentation/views/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/presentation/views/dashboard.html'));
});

app.get('/api/health', (req, res) => {
    const conectado = db.Usuario.db.readyState === 1;
    res.status(conectado ? 200 : 503).json({
        servicio: 'AliGest',
        estado: conectado ? 'DISPONIBLE' : 'SIN_BASE_DE_DATOS',
        timestamp: new Date().toISOString()
    });
});

// Manejador global para rutas inexistentes
app.use((req, res) => {
    res.status(404).send(`<h3>Error 404: La ruta [${req.method} ${req.url}] no está configurada en el servidor de AliGest.</h3>`);
});

// Inicialización de datos por defecto y conexión a base de datos
const inicializarDatos = async () => {
    try {
        await db.conectarBD();
        const users = await usuarioRepository.findAll();
        if (users.length === 0) {
            // Crear administrador predeterminado formal
            await authService.registrarUsuario('admin', 'admin@aligest.com', 'Admin123!', 'ADMINISTRADOR');
            console.log("✔ CONFIGURACIÓN INICIAL: Administrador 'admin' / 'Admin123!' creado con éxito.");
        }
    } catch (error) {
        console.error("✘ ERROR al conectar e inicializar base de datos:", error.message);
        throw error;
    }
};
if (process.env.NODE_ENV !== 'test') {
    (async () => {
        await inicializarDatos();
        const PORT = parseInt(process.env.PORT || '3000', 10);
        app.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(` Servidor de AliGest inicializado en puerto ${PORT}`);
            console.log(` Portal Visual Interactivo: http://localhost:${PORT}`);
            console.log(`====================================================`);
        });
    })().catch(error => {
        console.error(`AliGest no pudo iniciar: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = app;
