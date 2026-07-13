const { verificarSesion, permitirSolo, verificarUltimoAdministrador } = require('../../../src/presentation/middlewares/authMiddleware');
const usuarioRepository = require('../../../src/data/repositories/usuarioRepository');
const sessionRepository = require('../../../src/data/repositories/sessionRepository');

jest.mock('../../../src/data/repositories/usuarioRepository');
jest.mock('../../../src/data/repositories/sessionRepository');

describe('Auth Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { headers: {}, params: {}, body: {}, method: 'GET' };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
    });

    test('RF-1.1: autoriza una sesión almacenada y carga identidad/rol desde servidor', async () => {
        req.headers['x-session-id'] = 'token-seguro';
        sessionRepository.validateAndTouch.mockResolvedValue({
            estado: 'ACTIVA',
            usuario: { id: 'user-1', role: 'COPROPIETARIO', username: 'casa1' }
        });

        await verificarSesion(req, res, next);

        expect(req.user).toEqual(expect.objectContaining({ id: 'user-1', role: 'COPROPIETARIO' }));
        expect(next).toHaveBeenCalled();
    });

    test('deniega una solicitud sin session_id aunque intente falsificar rol e id', async () => {
        req.headers['x-user-role'] = 'ADMINISTRADOR';
        req.headers['x-user-id'] = 'admin-falso';
        sessionRepository.validateAndTouch.mockResolvedValue({ estado: 'AUSENTE' });

        await verificarSesion(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('RNF-01: informa expiración tras dos horas de inactividad', async () => {
        req.headers['x-session-id'] = 'expirada';
        sessionRepository.validateAndTouch.mockResolvedValue({ estado: 'EXPIRADA' });

        await verificarSesion(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ sesionExpirada: true }));
    });

    test('permitirSolo usa el rol autenticado y no el enviado por el cliente', () => {
        req.user = { id: 'admin-1', role: 'ADMINISTRADOR' };
        permitirSolo('ADMINISTRADOR')(req, res, next);
        expect(next).toHaveBeenCalled();

        next.mockClear();
        req.user.role = 'COPROPIETARIO';
        permitirSolo('ADMINISTRADOR')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('RF-1.3: permite guardar sin cambios al único administrador', async () => {
        req.params.id = 'admin-1';
        req.method = 'PUT';
        req.body = { role: 'ADMINISTRADOR', status: 'ACTIVO' };
        req.user = { id: 'admin-1' };
        usuarioRepository.findById.mockResolvedValue({ id: 'admin-1', role: 'ADMINISTRADOR', status: 'ACTIVO' });

        await verificarUltimoAdministrador(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(usuarioRepository.countAdministrators).not.toHaveBeenCalled();
    });

    test('RF-1.3: bloquea degradar, desactivar o eliminar al último administrador activo', async () => {
        req.params.id = 'admin-1';
        req.method = 'PUT';
        req.body = { role: 'COPROPIETARIO', status: 'ACTIVO' };
        req.user = { id: 'admin-1' };
        usuarioRepository.findById.mockResolvedValue({ id: 'admin-1', role: 'ADMINISTRADOR', status: 'ACTIVO' });
        usuarioRepository.countAdministrators.mockResolvedValue(1);

        await verificarUltimoAdministrador(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('al menos un Administrador activo') }));
        expect(next).not.toHaveBeenCalled();
    });
});
