const xlsx = require('xlsx');
const copropietarioService = require('../../../../src/core/business/services/CopropietarioService');
const usuarioRepository = require('../../../../src/data/repositories/usuarioRepository');
const authService = require('../../../../src/core/business/services/AuthService');

jest.setTimeout(30000);

function generarCedulaValida(indice) {
    const provincia = String(((indice - 1) % 24) + 1).padStart(2, '0');
    const primerosNueve = `${provincia}1${String(indice).padStart(6, '0')}`;
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const suma = primerosNueve.split('').reduce((total, digito, posicion) => {
        const producto = Number(digito) * coeficientes[posicion];
        return total + (producto > 9 ? producto - 9 : producto);
    }, 0);
    return `${primerosNueve}${(10 - (suma % 10)) % 10}`;
}

function generarExcelTemporalDe60Filas() {
    const filas = Array.from({ length: 60 }, (_, posicion) => {
        const numero = posicion + 1;
        return {
            'Nombre Completo': `Registro temporal ${numero}`,
            'Número Casa': `Casa ${numero}`,
            'Cédula': generarCedulaValida(numero),
            'Correo Electrónico': `temporal${numero}@pruebas.local`,
            'Teléfono': `09${String(80000000 + numero)}`,
            'Saldo Inicial': 0
        };
    });
    const libro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(libro, xlsx.utils.json_to_sheet(filas), 'Copropietarios');
    return xlsx.write(libro, { type: 'buffer', bookType: 'xlsx' });
}

describe('Importación RF-2.1 aislada', () => {
    test('genera en memoria 60 filas, crea sus 60 cuentas y permite iniciar sesión', async () => {
        const inicio = Date.now();
        const resumen = await copropietarioService.importarMasivoDesdeExcel(generarExcelTemporalDe60Filas());
        const duracionMs = Date.now() - inicio;

        expect(resumen.totalProcesados).toBe(60);
        expect(resumen.exitosos).toBe(60);
        expect(resumen.fallidos).toBe(0);
        expect(duracionMs).toBeLessThan(10000);

        const usuarios = await usuarioRepository.findAll();
        expect(usuarios).toHaveLength(60);
        expect(usuarios.every(u => u.role === 'COPROPIETARIO')).toBe(true);

        const primeraCredencial = resumen.importados[0];
        const sesion = await authService.login(primeraCredencial.username, primeraCredencial.passwordTemporal);
        expect(sesion.role).toBe('COPROPIETARIO');
        expect(sesion.mustChangePassword).toBe(true);
        expect(sesion.sessionId).toMatch(/^[a-f0-9]{64}$/);
    });
});
