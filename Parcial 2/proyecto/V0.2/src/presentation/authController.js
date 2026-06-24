const express = require('express');
const router = express.Router();
const authService = require('../business/services/authService');

// Nota: Aquí se define como '/' o '/register' dependiendo de cómo lo llamemos.
// Para mantener consistencia con tu vista que llama a '/api/auth/register':
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const user = await authService.registrarUsuario(username, password, role);
        res.status(201).json({ mensaje: "Usuario registrado con éxito", user });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const session = await authService.login(username, password);
        res.status(200).json({ mensaje: "Autenticación correcta", session });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

module.exports = router; // <-- CRÍTICO: Asegúrate de que esta línea exista