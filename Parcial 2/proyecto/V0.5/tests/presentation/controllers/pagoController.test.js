const request = require('supertest');
const app = require('../../../app');
const authService = require('../../../src/core/business/services/AuthService');
const copropietarioService = require('../../../src/core/business/services/CopropietarioService');
const usuarioRepository = require('../../../src/data/repositories/usuarioRepository');
const sessionRepository = require('../../../src/data/repositories/sessionRepository');
const pagoRepository = require('../../../src/data/repositories/pagoRepository');

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=', 'base64');

describe('PagoController - flujo completo de comprobantes', () => {
    let adminHeader;
    let coproHeader;

    beforeEach(async () => {
        await authService.registrarUsuario('adminpago', 'adminpago@correo.com', 'Password123!', 'ADMINISTRADOR');
        const adminSession = await authService.login('adminpago', 'Password123!');
        adminHeader = { 'x-session-id': adminSession.sessionId };

        const copro = await copropietarioService.crearCopropietario({
            cedula: '1721151247', nombre: 'Cliente Pago', casa: 'Casa 12',
            telefono: '0987654321', email: 'cliente.pago@correo.com', saldo: 100
        });
        const user = await usuarioRepository.findByUsername(copro.username);
        coproHeader = { 'x-session-id': await sessionRepository.create(user.id) };
    });

    async function registrarPago(referencia = 'REF-IMG-001') {
        return request(app)
            .post('/api/pagos/registrar')
            .set(coproHeader)
            .field('comprobanteId', referencia)
            .field('monto', '50')
            .field('metodo', 'TRANSFERENCIA')
            .field('periodo', '2026-07')
            .field('fechaPago', '2026-07-10')
            .attach('comprobante', PNG_1X1, { filename: 'comprobante.png', contentType: 'image/png' });
    }

    test('RF-3.1/RF-3.2: conserva la imagen y entrega el detalle para revisión administrativa', async () => {
        const registro = await registrarPago();
        expect(registro.status).toBe(200);
        expect(registro.body.solicitudId).toBeDefined();

        const pendientes = await request(app).get('/api/pagos/pendientes').set(adminHeader);
        expect(pendientes.status).toBe(200);
        expect(pendientes.body).toHaveLength(1);
        expect(pendientes.body[0].comprobante_img).toMatch(/^data:image\/png;base64,/);

        const detalle = await request(app)
            .get(`/api/pagos/${pendientes.body[0].id}/revision`)
            .set(adminHeader);
        expect(detalle.status).toBe(200);
        expect(detalle.body.pago.comprobante_img).toMatch(/^data:image\/png;base64,/);
        expect(detalle.body.copropietario.nombre).toBe('Cliente Pago');
    });

    test('RF-3.2/RF-3.4: permite aprobar desde la API y genera recibo inmutable', async () => {
        await registrarPago('REF-APROBAR');
        const pago = (await request(app).get('/api/pagos/pendientes').set(adminHeader)).body[0];

        const response = await request(app)
            .post(`/api/pagos/${pago.id}/aprobar`)
            .set(adminHeader);

        expect(response.status).toBe(200);
        const reciboId = response.body.comprobanteDigital.comprobante_id;
        expect(reciboId).toMatch(/^AGE-/);
        expect((await pagoRepository.findPagoById(pago.id)).estado).toBe('APROBADO');

        const pdf = await request(app).get(`/api/pagos/recibo/${reciboId}`).set(adminHeader);
        expect(pdf.status).toBe(200);
        expect(pdf.headers['content-type']).toContain('application/pdf');
        expect(pdf.body.subarray(0, 4).toString()).toBe('%PDF');

        const otro = await copropietarioService.crearCopropietario({
            cedula: '0926687856', nombre: 'Otro Cliente', casa: 'Casa 13',
            telefono: '0991234567', email: 'otro.cliente@correo.com', saldo: 0
        });
        const otroUsuario = await usuarioRepository.findByUsername(otro.username);
        const otroHeader = { 'x-session-id': await sessionRepository.create(otroUsuario.id) };
        const ajeno = await request(app).get(`/api/pagos/recibo/${reciboId}`).set(otroHeader);
        expect(ajeno.status).toBe(403);
    });

    test('RF-3.2: exige motivo y permite rechazar usando el ObjectId del pago', async () => {
        await registrarPago('REF-RECHAZAR');
        const pago = (await request(app).get('/api/pagos/pendientes').set(adminHeader)).body[0];

        const sinMotivo = await request(app).post(`/api/pagos/${pago.id}/rechazar`).set(adminHeader).send({ motivo: '' });
        expect(sinMotivo.status).toBe(400);

        const response = await request(app)
            .post(`/api/pagos/${pago.id}/rechazar`)
            .set(adminHeader)
            .send({ motivo: 'Comprobante ilegible' });
        expect(response.status).toBe(200);
        expect((await pagoRepository.findPagoById(pago.id)).motivo_rechazo).toBe('Comprobante ilegible');
    });

    test('RNF-04: rechaza un archivo que finge ser PNG pero no contiene una imagen', async () => {
        const response = await request(app)
            .post('/api/pagos/registrar')
            .set(coproHeader)
            .field('comprobanteId', 'REF-FALSA')
            .field('monto', '50')
            .field('metodo', 'TRANSFERENCIA')
            .field('periodo', '2026-07')
            .field('fechaPago', '2026-07-10')
            .attach('comprobante', Buffer.from('no-es-imagen'), { filename: 'falsa.png', contentType: 'image/png' });
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('contenido del archivo');
    });
});
