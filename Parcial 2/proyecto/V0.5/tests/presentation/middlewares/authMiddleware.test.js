const { verificarSesion, permitirSolo, verificarUltimoAdministrador } = require('../../../src/presentation/middlewares/authMiddleware');
const usuarioRepository = require('../../../src/data/repositories/usuarioRepository');

jest.mock('../../../src/data/repositories/usuarioRepository');

describe('Auth Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            headers: {},
            params: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
    });

    describe('verificarSesion', () => {
        test('Debería autorizar al usuario si los headers x-user-role y x-user-id son correctos', () => {
            mockReq.headers['x-user-role'] = 'COPROPIETARIO';
            mockReq.headers['x-user-id'] = '60c72b2f9b1d8b2bad123456';

            verificarSesion(mockReq, mockRes, nextFunction);

            expect(mockReq.user).toEqual({
                role: 'COPROPIETARIO',
                id: '60c72b2f9b1d8b2bad123456'
            });
            expect(nextFunction).toHaveBeenCalled();
        });

        test('Debería denegar el acceso (401) si no se pasa el rol en los headers', () => {
            verificarSesion(mockReq, mockRes, nextFunction);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining("No autorizado")
            }));
            expect(nextFunction).not.toHaveBeenCalled();
        });

        test('Debería denegar el acceso (403) si el rol es inválido', () => {
            mockReq.headers['x-user-role'] = 'INVITADO';
            
            verificarSesion(mockReq, mockRes, nextFunction);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining("Acceso denegado")
            }));
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });

    describe('permitirSolo', () => {
        test('Debería permitir paso si el rol coincide con los permitidos', () => {
            mockReq.headers['x-user-role'] = 'ADMINISTRADOR';
            const middleware = permitirSolo('ADMINISTRADOR', 'OTRO_ROL');

            middleware(mockReq, mockRes, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });

        test('Debería denegar con 403 si el rol del header no está permitido', () => {
            mockReq.headers['x-user-role'] = 'COPROPIETARIO';
            const middleware = permitirSolo('ADMINISTRADOR');

            middleware(mockReq, mockRes, nextFunction);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });

    describe('verificarUltimoAdministrador', () => {
        test('Debería pasar si no se envía id en params', async () => {
            await verificarUltimoAdministrador(mockReq, mockRes, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });

        test('Debería permitir la acción si el usuario a modificar no es ADMINISTRADOR', async () => {
            mockReq.params.id = '60c72b2f9b1d8b2bad123456';
            usuarioRepository.findById.mockResolvedValue({
                id: '60c72b2f9b1d8b2bad123456',
                role: 'COPROPIETARIO'
            });

            await verificarUltimoAdministrador(mockReq, mockRes, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });

        test('Debería permitir la acción si se modifica un administrador pero existen otros administradores activos', async () => {
            mockReq.params.id = 'admin-1';
            usuarioRepository.findById.mockResolvedValue({
                id: 'admin-1',
                role: 'ADMINISTRADOR'
            });
            usuarioRepository.countAdministrators.mockResolvedValue(2); // Quedan 2 admins

            await verificarUltimoAdministrador(mockReq, mockRes, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });

        test('Debería bloquear la acción (400) si se intenta eliminar o desactivar al último administrador activo del sistema', async () => {
            mockReq.params.id = 'ultimo-admin';
            usuarioRepository.findById.mockResolvedValue({
                id: 'ultimo-admin',
                role: 'ADMINISTRADOR'
            });
            usuarioRepository.countAdministrators.mockResolvedValue(1); // Solo queda 1 admin

            await verificarUltimoAdministrador(mockReq, mockRes, nextFunction);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining("No se puede eliminar o desactivar al último administrador")
            }));
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
});
