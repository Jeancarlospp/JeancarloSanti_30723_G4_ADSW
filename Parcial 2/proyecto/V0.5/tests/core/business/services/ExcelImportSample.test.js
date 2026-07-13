const fs = require('fs');
const path = require('path');
const copropietarioService = require('../../../../src/core/business/services/CopropietarioService');
const usuarioRepository = require('../../../../src/data/repositories/usuarioRepository');
const authService = require('../../../../src/core/business/services/AuthService');

jest.setTimeout(30000);

describe('Archivo de demostración RF-2.1', () => {
    test('importa las 60 casas, crea sus 60 cuentas y permite iniciar sesión', async () => {
        const archivo = path.join(__dirname, '../../../../archivos_prueba/Plantilla_Importacion_60_Copropietarios.xlsx');
        const inicio = Date.now();
        const resumen = await copropietarioService.importarMasivoDesdeExcel(fs.readFileSync(archivo));
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
