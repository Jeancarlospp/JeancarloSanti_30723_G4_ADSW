const bcrypt = require('bcrypt');
const usuarioRepository = require('../../data/usuarioRepository');

class AuthService {
    async registrarUsuario(username, password, role) {
        const hashedPassword = await bcrypt.hash(password, 12);
        return await usuarioRepository.create(username, hashedPassword, role);
    }

    async login(username, password) {
        const user = await usuarioRepository.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado.");
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Credenciales inválidas.");
        
        return { id: user.id, username: user.username, role: user.role };
    }
}

module.exports = new AuthService();