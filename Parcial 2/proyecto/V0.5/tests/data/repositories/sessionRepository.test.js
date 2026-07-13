const sessionRepository = require('../../../src/data/repositories/sessionRepository');
const { Usuario, Sesion } = require('../../../config/database');

describe('SessionRepository', () => {
    test('RF-1.1: genera un identificador de sesión aleatorio y carga permisos desde la BD', async () => {
        const user = await Usuario.create({
            username: 'sesion1', email: 'sesion1@correo.com', password: 'hash',
            role: 'COPROPIETARIO', status: 'ACTIVO'
        });
        const token = await sessionRepository.create(user._id.toString());

        expect(token).toMatch(/^[a-f0-9]{64}$/);
        const resultado = await sessionRepository.validateAndTouch(token);
        expect(resultado.estado).toBe('ACTIVA');
        expect(resultado.usuario.role).toBe('COPROPIETARIO');
    });

    test('RNF-01: elimina la sesión después de más de dos horas de inactividad', async () => {
        const user = await Usuario.create({
            username: 'sesion2', email: 'sesion2@correo.com', password: 'hash',
            role: 'ADMINISTRADOR', status: 'ACTIVO'
        });
        const token = await sessionRepository.create(user._id.toString());
        await Sesion.updateOne({ session_id: token }, {
            last_activity_at: new Date(Date.now() - (2 * 60 * 60 * 1000 + 1)).toISOString()
        });

        const resultado = await sessionRepository.validateAndTouch(token);
        expect(resultado.estado).toBe('EXPIRADA');
        expect(await Sesion.findOne({ session_id: token })).toBeNull();
    });

    test('RF-1.3: permite invalidar todas las sesiones cuando cambia el perfil', async () => {
        const user = await Usuario.create({
            username: 'sesion3', email: 'sesion3@correo.com', password: 'hash',
            role: 'COPROPIETARIO', status: 'ACTIVO'
        });
        const token = await sessionRepository.create(user._id.toString());
        await sessionRepository.invalidateUserSessions(user._id.toString());
        expect((await sessionRepository.validateAndTouch(token)).estado).toBe('INVALIDA');
    });
});
