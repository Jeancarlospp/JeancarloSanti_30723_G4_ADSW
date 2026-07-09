const request = require('supertest');
const app = require('../../../app');
const { Copropietario, Usuario, Pago } = require('../../../config/database');

describe('CopropietarioController Integration Tests', () => {
    let adminTokenHeaders;
    let coproTokenHeaders;
    let coproId;
    let usuarioId;

    beforeEach(async () => {
        // Registrar administrador mock
        const admin = await Usuario.create({
            username: 'admin_test',
            email: 'admin_test@correo.com',
            password: 'HashedPassword123!',
            role: 'ADMINISTRADOR',
            status: 'ACTIVO'
        });

        adminTokenHeaders = {
            'x-user-role': 'ADMINISTRADOR',
            'x-user-id': admin._id.toString()
        };

        // Registrar copropietario mock
        const userCopro = await Usuario.create({
            username: 'villa14',
            email: 'resident_test@correo.com',
            password: 'HashedPassword123!',
            role: 'COPROPIETARIO',
            status: 'ACTIVO'
        });

        usuarioId = userCopro._id.toString();

        const coproDoc = await Copropietario.create({
            cedula: '1721151247',
            nombre: 'Juan Perez',
            casa: 'Villa 14',
            telefono: '+593987654321',
            email: 'resident_test@correo.com',
            saldo: 100.0,
            usuario_id: userCopro._id
        });

        coproId = coproDoc._id.toString();

        coproTokenHeaders = {
            'x-user-role': 'COPROPIETARIO',
            'x-user-id': userCopro._id.toString()
        };
    });

    test('GET /api/copropietarios - Debería retornar todos los copropietarios si está autenticado', async () => {
        const response = await request(app)
            .get('/api/copropietarios')
            .set(adminTokenHeaders);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].nombre).toBe('Juan Perez');
    });

    test('GET /api/copropietarios - Debería filtrar residentes por nombre', async () => {
        // Crear un segundo residente
        await Copropietario.create({
            cedula: '0921151247',
            nombre: 'Maria Gomez',
            casa: 'Villa 20',
            telefono: '+593987654322',
            email: 'maria@correo.com',
            saldo: 0.0
        });

        const response = await request(app)
            .get('/api/copropietarios?nombre=Maria')
            .set(adminTokenHeaders);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].nombre).toBe('Maria Gomez');
    });

    test('DELETE /api/copropietarios/:id - Debería denegar con 202 y advertencia si tiene historial de pagos sin confirmar', async () => {
        // Añadir historial de pagos
        await Pago.create({
            comprobante_id: 'DEP-777',
            copropietario_id: coproId,
            monto_pagado: 100.0,
            estado: 'APROBADO',
            fecha_registro: new Date().toISOString()
        });

        // Intentar borrar sin confirmar
        const response = await request(app)
            .delete(`/api/copropietarios/${coproId}`)
            .set(adminTokenHeaders);

        expect(response.status).toBe(202);
        expect(response.body.advertencia).toBe('HISTORIAL_ACTIVO');
        expect(response.body.mensaje).toContain("historial de pagos registrado");
    });

    test('DELETE /api/copropietarios/:id - Debería borrar con 200 si se confirma con el parámetro confirmar=true', async () => {
        // Añadir historial de pagos
        await Pago.create({
            comprobante_id: 'DEP-777',
            copropietario_id: coproId,
            monto_pagado: 100.0,
            estado: 'APROBADO',
            fecha_registro: new Date().toISOString()
        });

        // Borrar con confirmación
        const response = await request(app)
            .delete(`/api/copropietarios/${coproId}?confirmar=true`)
            .set(adminTokenHeaders);

        expect(response.status).toBe(200);
        expect(response.body.mensaje).toContain("eliminado del sistema con éxito");

        // Validar borrado lógico
        const dbCopro = await Copropietario.findOne({ _id: coproId });
        expect(dbCopro.is_deleted).toBe(1);
    });
});
