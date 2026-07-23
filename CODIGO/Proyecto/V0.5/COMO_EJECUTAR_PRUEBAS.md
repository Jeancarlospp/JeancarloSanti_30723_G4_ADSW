# Cómo ejecutar las pruebas unitarias de AliGest

Guía rápida para reproducir la ejecución de la suite de pruebas documentada en
`Plan_De_Pruebas_Unitarias.pdf`. No requiere base de datos externa ni archivo `.env`:
las pruebas usan `mongodb-memory-server` (una instancia de MongoDB efímera en memoria).

## Requisitos previos

- Node.js (v18 o superior).
- Ejecutar una sola vez, dentro de la carpeta del proyecto:

```bash
npm install
```

> La **primera** ejecución de la suite tarda más (~18 s) porque `mongodb-memory-server`
> descarga y cachea el binario de MongoDB. Las siguientes ejecuciones bajan a ~5 s.

## Ejecutar toda la suite (17 archivos, 86 pruebas)

```bash
npm test
```

Resultado esperado al final de la salida:

```
Test Suites: 17 passed, 17 total
Tests:       86 passed, 86 total
```

## Ver cada caso de prueba con su nombre (recomendado para la revisión)

```bash
npx jest --runInBand --verbose
```

Muestra el árbol completo con cada `describe`/`test` y una marca de aprobado por caso.

## Ejecutar un solo archivo de prueba

```bash
npx jest tests/core/business/services/PagoService.test.js
```

## Ejecutar un caso puntual por nombre (coincidencia de texto)

```bash
npx jest -t "amortización FIFO"
```

## Evidencia de ejecución ya generada

El archivo **`EVIDENCIA_PRUEBAS.txt`** (en esta misma carpeta) contiene el listado
completo de las 86 pruebas con su estado (OK) agrupadas por archivo, generado a partir
del reporte JSON de Jest. Sirve como evidencia impresa del rubro *"Evidencias de la
ejecución de los casos de pruebas"*.

## Correspondencia con el documento

| Documento | Contenido |
|---|---|
| `Plan_De_Pruebas_Unitarias.pdf` | Informe técnico del plan de pruebas (Tablas 3–5 con 17 suites / 86 pruebas / 12 de 13 REQ con cobertura completa). |
| `Plan_De_Pruebas_Unitarias.tex` | Fuente LaTeX del informe (compilable con `pdflatex`). |
| `EVIDENCIA_PRUEBAS.txt` | Salida detallada por caso de la última ejecución (`npm test`). |

## Mapa de archivos de prueba → requisito (resumen)

- **REQ001–003 (acceso, recuperación, perfiles):** `AuthService.test.js`,
  `authMiddleware.test.js`, `authController.test.js`, `sessionRepository.test.js`.
- **REQ004–008 (copropietarios: importar, consultar, modificar, eliminar):**
  `CopropietarioService.test.js`, `excelAdapter.test.js`, `ExcelImportSample.test.js`,
  `copropietarioController.test.js`.
- **REQ009–012 (pagos, validación, mora, comprobante):** `PagoService.test.js`,
  `moraStrategy.test.js`, `auditDecorator.test.js`, `pagoController.test.js`.
- **REQ013 (notificaciones):** `NotificationService.test.js`.
- **Transversal (dominio y objetos de valor):** `Usuario.test.js`, `Cedula.test.js`,
  `Telefono.test.js`.
- **Regresión de la vista:** `dashboard.test.js`.
