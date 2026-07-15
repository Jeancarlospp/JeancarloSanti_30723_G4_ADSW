# Plan de Pruebas Unitarias - Sistema AliGest Condominios

Este documento define el plan estratégico y el diseño de los casos de prueba unitaria para validar los Requisitos Funcionales (RF) del prototipo **AliGest (Versión 0.4)**. Las pruebas se centran en verificar la lógica de negocio, validaciones del dominio y patrones de diseño implementados, garantizando el aislamiento de la infraestructura (Base de Datos y APIs externas) a través de dobles de prueba (mocks/stubs).

---

## 1. Introducción y Objetivos
El objetivo principal de este plan es asegurar la calidad y estabilidad de la lógica de negocio central del sistema AliGest.
- **Aislamiento**: Cada prueba unitaria evaluará un componente individual en aislamiento absoluto.
- **Velocidad y Automatización**: Las pruebas deben ejecutarse en pocos segundos para facilitar la integración continua.
- **Cobertura**: Validar caminos de éxito (happy paths), condiciones límite y control de errores en los flujos de negocio.

---

## 2. Alcance y Arquitectura de Pruebas

El sistema AliGest sigue una arquitectura en tres capas alineada con DDD (Domain-Driven Design). El plan cubre las pruebas unitarias para las siguientes clases y módulos:

1. **Objetos de Valor (Value Objects)**:
   - [Cedula.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/domain/valueObjects/Cedula.js)
   - [Telefono.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/domain/valueObjects/Telefono.js)
2. **Entidades de Dominio (Entities)**:
   - [Usuario.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/domain/models/Usuario.js)
   - [Copropietario.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/domain/models/Copropietario.js)
   - [Deuda.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/domain/models/Deuda.js)
   - [Pago.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/domain/models/Pago.js)
3. **Servicios de Negocio (Core Services)**:
   - [AuthService.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/business/services/AuthService.js)
   - [CopropietarioService.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/business/services/CopropietarioService.js)
   - [PagoService.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/business/services/PagoService.js)
   - [NotificationService.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/business/services/NotificationService.js)
4. **Patrones de Diseño**:
   - **Strategy**: [moraStrategy.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/business/patterns/moraStrategy.js)
   - **Adapter**: [excelAdapter.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/business/patterns/excelAdapter.js)
   - **Decorator**: [auditDecorator.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/src/core/business/patterns/auditDecorator.js)

### Fuera de Alcance
- Conectores directos a SQLite3 ([database.js](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/config/database.js)).
- Rutas Express de Presentación (Controllers).
- Generación visual o renderizado HTML en el navegador.

---

## 3. Estrategia y Framework de Pruebas

- **Framework**: **Jest** (u alternativamente Mocha/Chai).
- **Mocks y Stubs**: Se implementarán mocks para los repositorios de datos:
  - `usuarioRepository`
  - `copropietarioRepository`
  - `pagoRepository`
- **Simulador de APIs Externas**: Se interceptará la llamada al envío de WhatsApp en `NotificationService` para evitar consumo de red durante las pruebas.

---

## 4. Matriz de Casos de Prueba por Requisito Funcional (RF)

### 📌 RF-1: Gestión de Autenticación y Cuentas de Usuario

#### RF-1.1: Registro de Usuarios
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF1.1-01** | `AuthService` | Registrar un usuario válido (Happy Path). | `username`: "erick_s", `email`: "erick@test.com", `password`: "Clave123!", `role`: "ADMINISTRADOR" | Éxito. Retorna los datos del usuario creado. La contraseña se hashea antes de guardarse en base de datos. |
| **UT-RF1.1-02** | `AuthService` | Registrar usuario con nombre duplicado. | `username`: "admin" (ya existe), otros campos válidos. | Lanza un error: *"El nombre de usuario ya está registrado."* |
| **UT-RF1.1-03** | `AuthService` | Registrar usuario con email duplicado. | `email`: "admin@aligest.com" (ya existe), otros campos válidos. | Lanza un error: *"El correo electrónico ya está registrado."* |
| **UT-RF1.1-04** | `AuthService` | Registrar usuario con contraseña insegura (sin mayúscula ni número). | `password`: "secreta!", otros campos válidos. | Lanza error de validación de contraseña. |

#### RF-1.2: Inicio de Sesión (Login) y Bloqueo de Cuenta
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF1.2-01** | `AuthService` | Login exitoso con credenciales correctas. | `username`: "admin", `password`: "Admin123!" | Éxito. Retorna un objeto con la sesión (id, username, email, role, mustChangePassword). Restablece intentos fallidos. |
| **UT-RF1.2-02** | `AuthService` | Login con credenciales incorrectas (Primer y Segundo intento). | `username`: "admin", `password`: "Erronea" | Lanza un error informando los intentos restantes antes del bloqueo. |
| **UT-RF1.2-03** | `AuthService` | Bloqueo automático de cuenta tras 3 intentos fallidos consecutivos. | `username`: "admin", `password`: "Erronea" (3 veces) | Lanza un error indicando el bloqueo temporal. La base de datos actualiza `lockout_until` con una marca de tiempo de +15 minutos. |
| **UT-RF1.2-04** | `AuthService` | Intento de login en cuenta bloqueada temporalmente antes de expirar el tiempo. | `username`: "admin", cuenta actualmente bloqueada. | Lanza un error informando los minutos restantes de bloqueo sin comprobar la contraseña. |

#### RF-1.3: Generación de Código de Recuperación
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF1.3-01** | `AuthService` | Generar código de recuperación para email registrado. | `email`: "admin@aligest.com" | Éxito. Genera código de 6 dígitos con vigencia de 10 minutos exactos y actualiza en BD. Imprime envío en outbox simulado. |
| **UT-RF1.3-02** | `AuthService` | Intentar recuperar con email no registrado. | `email`: "inexistente@correo.com" | Lanza un error: *"El correo electrónico ingresado no está registrado..."* |

#### RF-1.4: Recuperación de Contraseña
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF1.4-01** | `AuthService` | Restablecer contraseña con código correcto y vigente. | `username`: "admin", `codigo`: "123456", `nuevaContrasena`: "NuevaClave99!" | Éxito. Hashea la nueva contraseña, actualiza la base de datos y limpia los campos de recuperación. |
| **UT-RF1.4-02** | `AuthService` | Restablecer contraseña con código inválido o incorrecto. | `codigo`: "000000" (incorrecto) | Lanza un error: *"Código de verificación incorrecto."* |
| **UT-RF1.4-03** | `AuthService` | Restablecer contraseña con código expirado. | `codigo`: "123456" (pero `recovery_code_expires_at` en el pasado) | Lanza un error: *"El código de verificación ha expirado..."* |

#### RF-1.5: Cambio de Contraseña
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF1.5-01** | `AuthService` | Cambio de contraseña con clave actual correcta y nueva contraseña válida. | `userId`: 1, `passwordActual`: "Admin123!", `passwordNuevo`: "Segura123!" | Éxito. Guarda la nueva contraseña encriptada y limpia el flag `must_change_password`. |
| **UT-RF1.5-02** | `AuthService` | Intento de cambio con clave actual incorrecta. | `passwordActual`: "ClaveIncorrecta" | Lanza un error: *"La contraseña actual es incorrecta."* |

---

### 📌 RF-2: Gestión de Copropietarios (Residentes)

#### RF-2.1: Importación Masiva desde Excel (Garantía de Atomicidad)
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF2.1-01** | `CopropietarioService` | Importar archivo Excel válido con múltiples registros nuevos (Happy Path). | Buffer de Excel con 3 registros válidos, sin cédulas o casas duplicadas en BD ni en lote. | Éxito. Inserta dinámicamente perfiles de usuario, genera credenciales temporales únicas (ej: `temp-1234!`), calcula saldos y retorna el lote de residentes importados. |
| **UT-RF2.1-02** | `CopropietarioService` | Importar Excel que contiene una cédula duplicada dentro del propio archivo (Fallo del Lote). | Buffer de Excel donde fila 1 y fila 3 tienen la cédula `1723456789`. | Falla toda la transacción (Atomicidad). Lanza error de validación listando la fila del error y no inserta ningún registro en la BD. |
| **UT-RF2.1-03** | `CopropietarioService` | Importar Excel que contiene una cédula que ya está registrada en la Base de Datos. | Buffer con un registro cuya cédula ya existe en la base de datos simulada. | Falla la transacción completa por colisión de BD. No se inserta ningún registro (Garantía de atomicidad). |
| **UT-RF2.1-04** | `CopropietarioService` | Importar Excel vacío o con formato corrupto. | Buffer de texto plano o archivo vacío. | Lanza un error: *"El archivo no es un archivo Excel válido..."* o *"El archivo Excel está vacío."* |

#### RF-2.3: Actualizar Datos de Copropietario
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF2.3-01** | `CopropietarioService` | Actualizar teléfono y correo de un copropietario registrado. | `cedula`: "1715076402", `datos`: `{ telefono: "0998765432", email: "nuevo@aligest.com" }` | Éxito. Valida formatos mediante objetos de valor y actualiza el registro en BD. |
| **UT-RF2.3-02** | `CopropietarioService` | Intentar cambiar el número de casa/villa de un copropietario a una villa que ya está ocupada. | `datos`: `{ casa: "Casa 15" }` (Villa ocupada por otro usuario) | Lanza un error indicando que la villa ya se encuentra registrada. |

#### RF-2.4: Eliminar Copropietario (Validación Financiera)
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF2.4-01** | `CopropietarioService` | Eliminar copropietario al día (sin deudas pendientes). | `id`: 1 (Copropietario con `countPendingDeudas` = 0) | Éxito. Elimina físicamente el perfil del copropietario y el usuario de acceso asociado en cascada. |
| **UT-RF2.4-02** | `CopropietarioService` | Intentar eliminar copropietario con deudas pendientes de pago. | `id`: 2 (Copropietario con deudas registradas en estado `PENDIENTE`) | Lanza un error: *"No se permite eliminar un copropietario con deudas pendientes."* (Protección financiera). |

---

### 📌 RF-3: Gestión Financiera, Deudas y Pagos

#### RF-3.2: Reportar Pago (Depósito/Transferencia)
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF3.2-01** | `PagoService` | Residente reporta un pago con comprobante y monto válido. | `usuarioId`: 5, `monto`: 150.00, `comprobanteId`: "TR-987654", `metodo`: "TRANSFERENCIA", `periodo`: "2026-07" | Éxito. El pago se registra con estado inicial `PENDIENTE_VALIDACION` y se guarda de forma inmutable. |
| **UT-RF3.2-02** | `PagoService` | Intentar reportar un pago con monto negativo o cero. | `monto`: -50.00 o 0.00 | Lanza un error: *"El monto reportado debe ser un número positivo."* |

#### RF-3.3: Validación, Aprobación de Pago e Imputación FIFO con Interés
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF3.3-01** | `PagoService` | Aprobar un pago que cubre exactamente deudas pendientes sin mora. | `pagoId`: 10 (monto: $100). Dos deudas pendientes de $50 (no vencidas). | Éxito. Cambia el estado del pago a `APROBADO`. Amortiza cronológicamente ambas deudas (FIFO) poniéndolas en `PAGADO`. Resta $100 al saldo del residente. |
| **UT-RF3.3-02** | `PagoService` | Aprobar un pago sobre deudas vencidas aplicando interés de mora. | `pagoId`: 11 (monto: $120). Una deuda vencida hace 30 días de $100 (interés calculado de $0.99). | Éxito. Cobra la mora acumulada primero ($0.99) y luego amortiza el capital de la deuda. Registra la deuda como `PAGADO`, descuenta del saldo del copropietario y reporta un sobrepago de $19.01. |
| **UT-RF3.3-03** | `PagoService` | Intentar aprobar un pago que ya fue procesado (Aprobado o Rechazado). | `pagoId`: 10 (con estado `APROBADO`) | Lanza un error: *"Este pago ya ha sido procesado previamente."* |

#### RF-3.4: Rechazo de Pagos
| ID Caso | Componente | Descripción de la Prueba | Datos de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **UT-RF3.4-01** | `PagoService` | Rechazar un pago pendiente por comprobante ilegible. | `pagoId`: 12, `motivo`: "Imagen de transferencia borrosa y sin fecha visible." | Éxito. Cambia el estado del pago a `RECHAZADO`, registra el motivo en la BD y despacha notificación de alerta de rechazo. |
| **UT-RF3.4-02** | `PagoService` | Intentar rechazar un pago sin especificar el motivo. | `pagoId`: 12, `motivo`: "" (vacío) | Lanza un error: *"Debe ingresar un motivo para rechazar el pago."* |

---

## 5. Pruebas Unitarias de Objetos de Valor y Modelos de Dominio

Estas pruebas aseguran que las reglas básicas y restricciones del negocio a nivel de entidad funcionen independientemente de cualquier servicio o base de datos.

### 5.1 Objeto de Valor: Cédula (`Cedula.js`)
* **UT-VO-CED-01**: Cédula ecuatoriana válida (`1715076402`) debe inicializarse con éxito y retornar el valor limpio.
* **UT-VO-CED-02**: Cédula con formato de longitud inválido (ej: `17150764` - 8 dígitos) debe lanzar un error de tamaño.
* **UT-VO-CED-03**: Cédula con código de provincia inválido (ej: `2500000000` - Provincia 25 no existe en Ecuador) debe fallar el algoritmo Módulo 10.
* **UT-VO-CED-04**: Cédula con último dígito verificador erróneo (ej: `1715076403` en lugar de `1715076402`) debe lanzar un error de checksum.

### 5.2 Objeto de Valor: Teléfono (`Telefono.js`)
* **UT-VO-TEL-01**: Teléfono móvil local con 0 inicial (`0987654321`) debe estandarizarse a formato internacional (`+593987654321`).
* **UT-VO-TEL-02**: Teléfono móvil local sin 0 inicial (`987654321`) debe estandarizarse con éxito a `+593987654321`).
* **UT-VO-TEL-03**: Teléfono ya en formato internacional (`+593987654321`) debe mantenerse igual.
* **UT-VO-TEL-04**: Teléfono fijo o móvil erróneo (longitud menor o mayor) debe lanzar un error de número inválido.

### 5.3 Entidad: Usuario (`Usuario.js`)
* **UT-ENT-USR-01**: Método `validarFormato()` con contraseña válida (ej: `Admin123!`) debe retornar `true`.
* **UT-ENT-USR-02**: Método `validarFormato()` con contraseña corta (< 8 caracteres) debe lanzar error.
* **UT-ENT-USR-03**: Método `validarFormato()` con contraseña sin caracteres especiales debe lanzar error.
* **UT-ENT-USR-04**: Método `esBloqueado()` debe retornar `true` si el estado es `BLOQUEADO` y `lockoutUntil` es mayor a la hora actual.
* **UT-ENT-USR-05**: Método `esBloqueado()` debe retornar `false` si el tiempo de bloqueo `lockoutUntil` ya expiró.

### 5.4 Entidad: Pago (`Pago.js`)
* **UT-ENT-PAG-01**: Método `generarComprobanteDigitalID()` debe estructurar correctamente la cadena de recibo inmutable combinando `AGE-`, el año, mes, villa sanitizada y secuencia de 4 dígitos (ej: `AGE-2026-07-CASA14-0005`).

---

## 6. Pruebas Unitarias de Patrones de Diseño

### 6.1 Patrón Strategy: Interés de Mora (`moraStrategy.js`)
* **UT-PAT-MORA-01**: Con 0 días de retraso, el cálculo debe retornar `$0.00` de interés.
* **UT-PAT-MORA-02**: Con una deuda de `$100.00` y 30 días de retraso, aplicando la estrategia `EcuandorianMora12Strategy` (12% anual nominal, cálculo diario `(0.12 / 365) * 30 * 100`), el interés resultante debe ser exactamente `$0.99`.
* **UT-PAT-MORA-03**: Con una deuda de `$200.00` y 15 días de retraso, el interés resultante debe ser exactamente `$0.99`.

### 6.2 Patrón Adapter: Mapeador Excel (`excelAdapter.js`)
* **UT-PAT-ADAP-01**: Fila con cabeceras en español (ej: `Cédula`, `Nombre Completo`, `Número Casa`, `Teléfono`, `Correo Electrónico`, `Saldo Inicial`) debe ser mapeada correctamente a los atributos de la entidad.
* **UT-PAT-ADAP-02**: Fila con cabeceras alternativas en inglés (ej: `ID_Nacional`, `Nombre`, `Casa`, `Celular`, `Email`, `Saldo`) debe mapearse correctamente sin perder consistencia de tipos.

### 6.3 Patrón Decorator: Auditoría de Pagos (`auditDecorator.js`)
* **UT-PAT-DECO-01**: Al procesar un pago con éxito, el decorador `AuditPaymentServiceDecorator` debe invocar primero el registro de auditoría `INTENTO_APROBACION_PAGO` y, tras culminar, el registro `PAGO_APROBADO_EXITO` con todos los detalles del recibo.
* **UT-PAT-DECO-02**: Si la aprobación de pago falla por regla de negocio, el decorador debe atrapar el error, registrar `APROBACION_PAGO_FALLIDA` con el mensaje del error y volver a propagar la excepción para el flujo normal.

---

## 7. Plan de Implementación de Pruebas Unitarias

Para poner en marcha este plan, se recomienda agregar las dependencias de prueba necesarias a la aplicación:

### Paso 1: Instalar dependencias de desarrollo
```bash
npm install --save-dev jest supertest
```

### Paso 2: Configurar Script de Pruebas en [package.json](file:///c:/Users/ERICK/Documents/Universidad/Erick/6.Sexto%20Semestre/An%C3%A1lisis%20y%20Dise%C3%B1o%20de%20Software/JeancarloSanti_30723_G_ADSW/Parcial%202/proyecto/V0.4/package.json)
```json
"scripts": {
  "start": "node app.js",
  "dev": "node app.js",
  "test": "jest --detectOpenHandles --colors"
}
```

### Paso 3: Estructura del Directorio de Pruebas Recomendada
```text
/V0.4
  ├── test/
  │    ├── domain/
  │    │    ├── Cedula.test.js
  │    │    ├── Telefono.test.js
  │    │    ├── Usuario.test.js
  │    │    └── Pago.test.js
  │    ├── services/
  │    │    ├── AuthService.test.js
  │    │    ├── CopropietarioService.test.js
  │    │    └── PagoService.test.js
  │    └── patterns/
  │         ├── moraStrategy.test.js
  │         └── excelAdapter.test.js
  └── package.json
```
