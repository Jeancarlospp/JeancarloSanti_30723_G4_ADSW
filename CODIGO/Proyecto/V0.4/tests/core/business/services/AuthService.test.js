const authService = require('../../../../src/core/business/services/AuthService');
const usuarioRepository = require('../../../../src/data/repositories/usuarioRepository');

describe('AuthService (Integration with MongoDB Memory Server)', () => {
    beforeEach(async () => {
        // La base de datos es limpiada automáticamente en setup.js antes de cada test
    });

    test('Debería registrar un usuario de forma pública (rol COPROPIETARIO) con contraseña cifrada', async () => {
        const username = 'casa15';
        const email = 'casa15@correo.com';
        const password = 'Password123!';

        const result = await authService.registrarUsuarioPublico(username, email, password);

        expect(result.username).toBe(username);
        expect(result.email).toBe(email);
        expect(result.role).toBe('COPROPIETARIO');
        expect(result.must_change_password).toBe(0);

        // Validar persistencia en base de datos
        const userInDb = await usuarioRepository.findByUsername(username);
        expect(userInDb).toBeDefined();
        expect(userInDb.password).not.toBe(password); // Cifrada
    });

    test('Debería arrojar error si el nombre de usuario o correo electrónico ya existen al registrar', async () => {
        await authService.registrarUsuarioPublico('casa15', 'casa15@correo.com', 'Password123!');
        
        await expect(authService.registrarUsuarioPublico('casa15', 'otro@correo.com', 'Password123!'))
            .rejects.toThrow("El nombre de usuario ya está registrado.");

        await expect(authService.registrarUsuarioPublico('otra-casa', 'casa15@correo.com', 'Password123!'))
            .rejects.toThrow("El correo electrónico ya está registrado.");
    });

    test('Debería iniciar sesión correctamente con credenciales válidas', async () => {
        const username = 'casa15';
        const password = 'Password123!';
        await authService.registrarUsuarioPublico(username, 'casa15@correo.com', password);

        const session = await authService.login(username, password);

        expect(session.username).toBe(username);
        expect(session.role).toBe('COPROPIETARIO');
        expect(session.mustChangePassword).toBe(false);
    });

    test('Debería bloquear la cuenta por 15 minutos en el tercer intento fallido de inicio de sesión', async () => {
        const username = 'bloqueable';
        const passwordCorrecta = 'Password123!';
        await authService.registrarUsuarioPublico(username, 'bloqueo@correo.com', passwordCorrecta);

        // Primer intento fallido
        await expect(authService.login(username, 'Incorrecta')).rejects.toThrow("Le quedan 2 intentos");
        // Segundo intento fallido
        await expect(authService.login(username, 'Incorrecta')).rejects.toThrow("Le quedan 1 intentos");
        
        // Tercer intento fallido - Bloquea la cuenta
        await expect(authService.login(username, 'Incorrecta'))
            .rejects.toThrow("Cuenta bloqueada temporalmente por múltiples intentos fallidos");

        // Intentar ingresar con la contraseña CORRECTA en cuenta bloqueada
        await expect(authService.login(username, passwordCorrecta))
            .rejects.toThrow("Cuenta bloqueada temporalmente");
    });

    test('Debería generar un código OTP de recuperación de 6 dígitos con vigencia de 10 minutos', async () => {
        const email = 'recuperar@correo.com';
        await authService.registrarUsuarioPublico('recuperable', email, 'Password123!');

        const result = await authService.generarCodigoRecuperacion(email);

        expect(result.mensaje).toBe("Código enviado correctamente.");
        expect(result.codigoSimulado).toHaveLength(6);
        expect(result.username).toBe('recuperable');

        // Validar que se guardó en BD
        const userInDb = await usuarioRepository.findByUsername('recuperable');
        expect(userInDb.recovery_code).toBe(result.codigoSimulado);
        expect(userInDb.recovery_code_expires_at).toBeDefined();
    });

    test('Debería restablecer la contraseña utilizando un código de recuperación válido', async () => {
        const username = 'cambiaclave';
        const email = 'cambiaclave@correo.com';
        await authService.registrarUsuarioPublico(username, email, 'OldPassword123!');
        
        const optGen = await authService.generarCodigoRecuperacion(email);
        const res = await authService.recuperarContrasena(username, optGen.codigoSimulado, 'NewPassword123!');

        expect(res.mensaje).toBe("Contraseña restablecida correctamente.");

        // Intentar login con la clave anterior (debe fallar)
        await expect(authService.login(username, 'OldPassword123!')).rejects.toThrow();

        // Login con la clave nueva (debe ingresar)
        const session = await authService.login(username, 'NewPassword123!');
        expect(session.username).toBe(username);
    });

    test('Debería fallar al cambiar clave si el código OTP ha expirado', async () => {
        const username = 'expirable';
        const email = 'expirable@correo.com';
        await authService.registrarUsuarioPublico(username, email, 'OldPassword123!');

        // Generamos fecha de expiración en el pasado
        await authService.generarCodigoRecuperacion(email);
        const expiracionPasada = new Date(Date.now() - 10 * 1000).toISOString(); // Hace 10 segundos
        
        const user = await usuarioRepository.findByUsername(username);
        await usuarioRepository.updateRecoveryCode(username, user.recovery_code, expiracionPasada);

        await expect(authService.recuperarContrasena(username, user.recovery_code, 'NewPassword123!'))
            .rejects.toThrow("El código de verificación ha expirado. Solicite uno nuevo.");
    });
});
