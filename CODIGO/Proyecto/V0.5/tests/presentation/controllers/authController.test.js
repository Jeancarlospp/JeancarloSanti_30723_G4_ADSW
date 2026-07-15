const request = require('supertest');
const app = require('../../../app');
const authService = require('../../../src/core/business/services/AuthService');
const copropietarioService = require('../../../src/core/business/services/CopropietarioService');
const usuarioRepository = require('../../../src/data/repositories/usuarioRepository');
const sessionRepository = require('../../../src/data/repositories/sessionRepository');

describe('AuthController', () => {
    test('RF-1.1: rechaza el registro público de cuentas', async () => {
        const response = await request(app).post('/api/auth/register').send({
            username: 'intruso', email: 'intruso@correo.com', password: 'Password123!'
        });
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Administrador');
    });

    test('RF-1.3: Configurar promueve un copropietario e invalida su sesión anterior', async () => {
        await authService.registrarUsuario('adminperfil', 'adminperfil@correo.com', 'Password123!', 'ADMINISTRADOR');
        const adminSession = await authService.login('adminperfil', 'Password123!');
        const creado = await copropietarioService.crearCopropietario({
            cedula: '1721151247', nombre: 'Residente Perfil', casa: 'Casa 8',
            telefono: '0987654321', email: 'perfil@correo.com'
        });
        const target = await usuarioRepository.findByUsername(creado.username);
        const targetToken = await sessionRepository.create(target.id);

        const response = await request(app)
            .put(`/api/auth/usuarios/${target.id}`)
            .set('x-session-id', adminSession.sessionId)
            .send({ role: 'ADMINISTRADOR', status: 'ACTIVO' });

        expect(response.status).toBe(200);
        expect((await usuarioRepository.findById(target.id)).role).toBe('ADMINISTRADOR');
        expect((await sessionRepository.validateAndTouch(targetToken)).estado).toBe('INVALIDA');
    });

    test('RF-1.3: el listado incluye nombre y casa del residente vinculado', async () => {
        await authService.registrarUsuario('adminlista', 'adminlista@correo.com', 'Password123!', 'ADMINISTRADOR');
        const adminSession = await authService.login('adminlista', 'Password123!');
        await copropietarioService.crearCopropietario({
            cedula: '1721151247', nombre: 'María Residente', casa: 'Casa 9',
            telefono: '0987654321', email: 'maria.lista@correo.com'
        });

        const response = await request(app)
            .get('/api/auth/usuarios')
            .set('x-session-id', adminSession.sessionId);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.arrayContaining([
            expect.objectContaining({ username: 'casa9', nombre: 'María Residente', casa: 'Casa 9' })
        ]));
    });

    test('RF-1.3: no permite degradar al único administrador', async () => {
        await authService.registrarUsuario('adminunico', 'adminunico@correo.com', 'Password123!', 'ADMINISTRADOR');
        const admin = await usuarioRepository.findByUsername('adminunico');
        const session = await authService.login('adminunico', 'Password123!');

        const response = await request(app)
            .put(`/api/auth/usuarios/${admin.id}`)
            .set('x-session-id', session.sessionId)
            .send({ role: 'COPROPIETARIO', status: 'ACTIVO' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('al menos un Administrador activo');
    });
});
