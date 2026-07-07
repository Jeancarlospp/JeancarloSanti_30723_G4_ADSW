const bcrypt = require('bcrypt');
const usuarioRepository = require('../../../data/repositories/usuarioRepository');
const Usuario = require('../../domain/models/Usuario');

class AuthService {
    async registrarUsuario(username, email, password, role) {
        // Validar reglas del dominio
        const tempUser = new Usuario({ username, email, password, role });
        tempUser.validarFormato();

        const existenteUser = await usuarioRepository.findByUsername(username);
        if (existenteUser) {
            throw new Error("El nombre de usuario ya está registrado.");
        }

        const existenteEmail = await usuarioRepository.findByEmail(email);
        if (existenteEmail) {
            throw new Error("El correo electrónico ya está registrado.");
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        return await usuarioRepository.create(username, email, hashedPassword, role);
    }

    async login(username, password) {
        if (!username || !password) {
            throw new Error("El usuario y la contraseña son obligatorios.");
        }

        const user = await usuarioRepository.findByUsername(username);
        if (!user) {
            throw new Error("Nombre de usuario o contraseña incorrectos. Intente nuevamente.");
        }

        // Instanciar entidad para verificar bloqueos
        const domainUser = new Usuario(user);
        
        if (domainUser.esBloqueado()) {
            const limite = new Date(user.lockout_until);
            const ahora = new Date();
            const minRestantes = Math.ceil((limite - ahora) / (1000 * 60));
            throw new Error(`Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente en ${minRestantes} minutos o recupere su contraseña.`);
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            // Incrementar contador de intentos fallidos
            await usuarioRepository.incrementFailedAttempts(username);
            const updatedUser = await usuarioRepository.findByUsername(username);
            
            if (updatedUser.failed_attempts >= 3) {
                // Bloqueo temporal por 15 minutos exactos (RNF-01)
                const lockoutTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                await usuarioRepository.lockoutUser(username, lockoutTime);
                throw new Error("Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente en 15 minutos o recupere su contraseña.");
            } else {
                const intentosRestantes = 3 - updatedUser.failed_attempts;
                throw new Error(`Nombre de usuario o contraseña incorrectos. Le quedan ${intentosRestantes} intentos antes de bloquear la cuenta.`);
            }
        }

        // Login exitoso: limpiar intentos fallidos y fechas de bloqueo
        await usuarioRepository.resetFailedAttempts(username);

        return { id: user.id, username: user.username, email: user.email, role: user.role, mustChangePassword: user.must_change_password === 1 };
    }

    async generarCodigoRecuperacion(email) {
        if (!email) {
            throw new Error("El correo electrónico es obligatorio para recuperar contraseña.");
        }

        const user = await usuarioRepository.findByEmail(email);
        if (!user) {
            throw new Error("El correo electrónico ingresado no está registrado en el sistema. Contacte al administrador.");
        }

        // Generar código numérico aleatorio de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Código con vigencia de 10 minutos exactos (RF-1.2)
        const fechaExpiracion = new Date(Date.now() + 10 * 60 * 1000);
        
        await usuarioRepository.updateRecoveryCode(user.username, codigo, fechaExpiracion.toISOString());

        // Simulación formal de despacho de correo
        console.log(`\n======================================================`);
        console.log(`[SMTP EMAIL OUTBOX SIMULATOR]`);
        console.log(`De: soporte@aligest.com`);
        console.log(`Para: ${email}`);
        console.log(`Asunto: Restablecimiento de contraseña - Código ${codigo}`);
        console.log(`Contenido: Estimado ${user.username},`);
        console.log(`Su código de verificación es: ${codigo}`);
        console.log(`Este código expira en 10 minutos (${fechaExpiracion.toLocaleTimeString()}).`);
        console.log(`======================================================\n`);

        return { mensaje: "Código enviado correctamente.", codigoSimulado: codigo, username: user.username };
    }

    async recuperarContrasena(username, codigo, nuevaContrasena) {
        if (!username || !codigo || !nuevaContrasena) {
            throw new Error("El usuario, código y nueva contraseña son obligatorios.");
        }

        const user = await usuarioRepository.findByUsername(username);
        if (!user) {
            throw new Error("El usuario no existe.");
        }

        if (!user.recovery_code || user.recovery_code !== codigo) {
            throw new Error("Código de verificación incorrecto.");
        }

        const ahora = new Date();
        const expiracion = new Date(user.recovery_code_expires_at);
        if (ahora > expiracion) {
            throw new Error("El código de verificación ha expirado. Solicite uno nuevo.");
        }

        // Validar reglas del dominio para la nueva contraseña
        const tempUser = new Usuario({ username, email: user.email, password: nuevaContrasena, role: user.role });
        tempUser.validarFormato();

        // Encriptar y guardar contraseña
        const hashedPassword = await bcrypt.hash(nuevaContrasena, 12);
        await usuarioRepository.updatePasswordAndClearRecovery(username, hashedPassword);

        return { mensaje: "Contraseña restablecida correctamente." };
    }

    async cambiarPassword(userId, passwordActual, passwordNuevo) {
        if (!userId || !passwordActual || !passwordNuevo) {
            throw new Error("Todos los campos son obligatorios.");
        }

        const user = await usuarioRepository.findById(userId);
        if (!user) {
            throw new Error("El usuario no existe.");
        }

        // Validar contraseña actual
        const valid = await bcrypt.compare(passwordActual, user.password);
        if (!valid) {
            throw new Error("La contraseña actual es incorrecta.");
        }

        // Validar reglas de dominio para la nueva contraseña
        const tempUser = new Usuario({ username: user.username, email: user.email, password: passwordNuevo, role: user.role });
        tempUser.validarFormato();

        // Encriptar y guardar contraseña
        const hashedPassword = await bcrypt.hash(passwordNuevo, 12);
        
        // Actualizar contraseña y quitar bandera de cambio obligatorio
        await usuarioRepository.updatePasswordAndClearMustChange(user.username, hashedPassword);
    }
}

module.exports = new AuthService();
