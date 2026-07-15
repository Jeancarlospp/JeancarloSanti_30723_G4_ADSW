const Usuario = require('../../../../src/core/domain/models/Usuario');

describe('Usuario Domain Model', () => {
    test('Debería crear una instancia válida de Usuario', () => {
        const u = new Usuario({
            username: 'admin',
            email: 'admin@aligest.com',
            password: 'Password123!',
            role: 'ADMINISTRADOR'
        });
        expect(u.validarFormato()).toBe(true);
    });

    test('Debería fallar si el nombre de usuario tiene menos de 3 o más de 20 caracteres', () => {
        const uMin = new Usuario({ username: 'ad', email: 'a@a.com', password: 'Password123!', role: 'ADMINISTRADOR' });
        expect(() => uMin.validarFormato()).toThrow("El nombre de usuario debe tener entre 3 y 20 caracteres.");

        const uMax = new Usuario({ username: 'a'.repeat(21), email: 'a@a.com', password: 'Password123!', role: 'ADMINISTRADOR' });
        expect(() => uMax.validarFormato()).toThrow("El nombre de usuario debe tener entre 3 y 20 caracteres.");
    });

    test('Debería fallar si el correo electrónico es inválido', () => {
        const u = new Usuario({ username: 'admin', email: 'adminaligest.com', password: 'Password123!', role: 'ADMINISTRADOR' });
        expect(() => u.validarFormato()).toThrow("El correo electrónico no tiene un formato válido.");
    });

    test('Debería fallar si la contraseña es obligatoria pero no está presente', () => {
        const u = new Usuario({ username: 'admin', email: 'admin@aligest.com', password: '', role: 'ADMINISTRADOR' });
        expect(() => u.validarFormato()).toThrow("La contraseña es obligatoria.");
    });

    test('Debería fallar si la contraseña no cumple la complejidad requerida', () => {
        // Corta (< 8)
        const u1 = new Usuario({ username: 'admin', email: 'admin@aligest.com', password: 'Pass1!', role: 'ADMINISTRADOR' });
        expect(() => u1.validarFormato()).toThrow("La contraseña debe tener al menos 8 caracteres.");

        // Sin Mayúscula
        const u2 = new Usuario({ username: 'admin', email: 'admin@aligest.com', password: 'password123!', role: 'ADMINISTRADOR' });
        expect(() => u2.validarFormato()).toThrow("La contraseña debe contener al menos una letra mayúscula.");

        // Sin Minúscula
        const u3 = new Usuario({ username: 'admin', email: 'admin@aligest.com', password: 'PASSWORD123!', role: 'ADMINISTRADOR' });
        expect(() => u3.validarFormato()).toThrow("La contraseña debe contener al menos una letra minúscula.");

        // Sin Número
        const u4 = new Usuario({ username: 'admin', email: 'admin@aligest.com', password: 'Password!', role: 'ADMINISTRADOR' });
        expect(() => u4.validarFormato()).toThrow("La contraseña debe contener al menos un número.");

        // Sin especial
        const u5 = new Usuario({ username: 'admin', email: 'admin@aligest.com', password: 'Password123', role: 'ADMINISTRADOR' });
        expect(() => u5.validarFormato()).toThrow("La contraseña debe contener al menos un carácter especial");
    });

    test('Debería aceptar contraseñas ya hasheadas por bcrypt (saltarse la complejidad)', () => {
        const hash = '$2b$12$somehashedpasswordstring1234567890';
        const u = new Usuario({
            username: 'admin',
            email: 'admin@aligest.com',
            password: hash,
            role: 'ADMINISTRADOR'
        });
        expect(u.validarFormato()).toBe(true);
    });

    test('Debería validar el estado de bloqueo', () => {
        const uActivo = new Usuario({ status: 'ACTIVO' });
        expect(uActivo.esBloqueado()).toBe(false);

        const uBloqueadoInfinito = new Usuario({ status: 'BLOQUEADO', lockoutUntil: null });
        expect(uBloqueadoInfinito.esBloqueado()).toBe(true);

        const hoy = new Date();
        const futuro = new Date(hoy.getTime() + 10 * 60 * 1000).toISOString(); // 10 min en futuro
        const uBloqueadoTemporal = new Usuario({ status: 'BLOQUEADO', lockoutUntil: futuro });
        expect(uBloqueadoTemporal.esBloqueado()).toBe(true);

        const pasado = new Date(hoy.getTime() - 10 * 60 * 1000).toISOString(); // 10 min en pasado
        const uDesbloqueadoTemporal = new Usuario({ status: 'BLOQUEADO', lockoutUntil: pasado });
        expect(uDesbloqueadoTemporal.esBloqueado()).toBe(false);
    });
});
