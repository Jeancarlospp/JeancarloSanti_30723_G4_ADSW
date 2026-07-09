const express = require('express');
const router = express.Router();
const authService = require('../../core/business/services/AuthService');
const usuarioRepository = require('../../data/repositories/usuarioRepository');
const { verificarSesion, permitirSolo, verificarUltimoAdministrador } = require('../middlewares/authMiddleware');

// Iniciar Sesión (RF-1.1)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const session = await authService.login(username, password);
        res.status(200).json({ mensaje: "Autenticación correcta", session });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

// REQ001-5 / REQ001-6: Registro público de usuarios
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const result = await authService.registrarUsuarioPublico(username, email, password);
        res.status(201).json({
            mensaje: 'Usuario registrado correctamente.',
            usuario: result
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Cambiar contraseña (para primer ingreso o cambio regular)
router.post('/cambiar-password', verificarSesion, async (req, res) => {
    try {
        const { passwordActual, passwordNuevo } = req.body;
        const userId = req.user.id;
        
        await authService.cambiarPassword(userId, passwordActual, passwordNuevo);
        res.status(200).json({ mensaje: "Contraseña actualizada con éxito." });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// RF-1.2: Solicitar código de recuperación por Correo Electrónico
router.post('/recuperar-codigo', async (req, res) => {
    try {
        const { email } = req.body;
        const result = await authService.generarCodigoRecuperacion(email);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// RF-1.2: Restablecer contraseña con código de verificación
router.post('/recuperar-confirmar', async (req, res) => {
    try {
        const { username, codigo, nuevaContrasena } = req.body;
        const result = await authService.recuperarContrasena(username, codigo, nuevaContrasena);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// RF-1.3: Listado de perfiles (ADMINISTRADOR únicamente)
router.get('/usuarios', verificarSesion, permitirSolo('ADMINISTRADOR'), async (req, res) => {
    try {
        const list = await usuarioRepository.findAll();
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RF-1.3: Modificar perfil y estado (ADMINISTRADOR únicamente)
router.put('/usuarios/:id', verificarSesion, permitirSolo('ADMINISTRADOR'), verificarUltimoAdministrador, async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status } = req.body;
        
        if (!role || !status) {
            return res.status(400).json({ error: "El rol y el estado son campos obligatorios." });
        }

        await usuarioRepository.updatePerfil(id, role, status);
        res.status(200).json({ mensaje: "Perfil de usuario modificado correctamente." });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Eliminar perfiles de usuarios (ADMINISTRADOR únicamente)
router.delete('/usuarios/:id', verificarSesion, permitirSolo('ADMINISTRADOR'), verificarUltimoAdministrador, async (req, res) => {
    try {
        const { id } = req.params;
        await usuarioRepository.delete(id);
        res.status(200).json({ mensaje: "Perfil eliminado con éxito del sistema." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
