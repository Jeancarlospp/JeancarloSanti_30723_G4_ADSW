const express = require('express');
const path = require('path');
const app = express();
const db = require('./config/database');
const authService = require('./src/core/business/services/AuthService');
const copropietarioService = require('./src/core/business/services/CopropietarioService');
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

        // El modo presentación es deliberadamente pequeño y limpio: dos cuentas
        // técnicas editables, sin pagos, deudas ni clientes ficticios importados.
        if (process.env.SEED_PRESENTATION === 'true') {
            const cuentasPresentacion = [
                {
                    cedula: '0210000014', nombre: 'Copropietario Casa 1', casa: 'Casa 1',
                    telefono: '0980000001', email: 'casa1@aligest.local', saldo: 0,
                    password: 'Casa1Demo!'
                },
                {
                    cedula: '0310000021', nombre: 'Copropietario Casa 2', casa: 'Casa 2',
                    telefono: '0980000002', email: 'casa2@aligest.local', saldo: 0,
                    password: 'Casa2Demo!'
                }
            ];
            const existentes = await copropietarioService.obtenerTodos();

            for (const cuenta of cuentasPresentacion) {
                if (existentes.some(copro => copro.casa === cuenta.casa)) continue;
                const creada = await copropietarioService.crearCopropietario(cuenta);
                const usuario = await usuarioRepository.findByUsername(creada.username);
                await authService.cambiarPassword(usuario.id, creada.passwordTemporal, cuenta.password);
            }
            console.log("✔ PRESENTACIÓN LIMPIA: creadas únicamente las cuentas casa1 y casa2, sin movimientos financieros.");
        }
    } catch (error) {
        console.error("✘ ERROR al conectar e inicializar base de datos:", error.message);
        throw error;
    }
};
if (process.env.NODE_ENV !== 'test') {
    (async () => {
        await inicializarDatos();
        let port = parseInt(process.env.PORT || '3000', 10);
        let servidor = null;

        for (let intento = 0; intento < 10 && !servidor; intento++) {
            try {
                servidor = await new Promise((resolve, reject) => {
                    const candidato = app.listen(port);
                    candidato.once('listening', () => resolve(candidato));
                    candidato.once('error', reject);
                });
            } catch (error) {
                if (error.code === 'EADDRINUSE' && process.env.AUTO_PORT === 'true') {
                    console.warn(`El puerto ${port} está ocupado; AliGest intentará el puerto ${port + 1}.`);
                    port++;
                } else {
                    throw error;
                }
            }
        }

        if (!servidor) throw new Error('No se encontró un puerto disponible después de 10 intentos.');
        console.log(`====================================================`);
        console.log(` Servidor de AliGest inicializado en puerto ${port}`);
        console.log(` Portal Visual Interactivo: http://localhost:${port}`);
        console.log(`====================================================`);
    })().catch(error => {
        console.error(`AliGest no pudo iniciar: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = app;
