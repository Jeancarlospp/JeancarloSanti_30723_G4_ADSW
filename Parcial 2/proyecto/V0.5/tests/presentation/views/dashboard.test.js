const fs = require('fs');
const path = require('path');

describe('Dashboard - enlaces de acciones con ObjectId', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../../src/presentation/views/dashboard.html'), 'utf8');

    test('los ObjectId de pagos y perfiles se envían como cadenas JavaScript válidas', () => {
        expect(html).toContain("verEvidenciaPago('${p.id}')");
        expect(html).toContain("aprobarPago('${p.id}')");
        expect(html).toContain("abrirRechazoPago('${p.id}')");
        expect(html).toContain("abrirEdicionPerfil('${u.id}'");
        expect(html).not.toContain('verEvidenciaPago(${p.id})');
        expect(html).not.toContain('abrirEdicionPerfil(${u.id}');
    });

    test('la revisión muestra imagen, datos del pago y desglose de mora/FIFO', () => {
        expect(html).toContain('id="evidenceImage"');
        expect(html).toContain('id="evidencePaymentInfo"');
        expect(html).toContain('id="evidenceDebtBreakdown"');
        expect(html).toContain('/revision`');
    });
});
