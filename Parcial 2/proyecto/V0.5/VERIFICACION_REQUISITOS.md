# Verificación de requisitos de AliGest

Fecha de verificación: 13 de julio de 2026.

## Resultado ejecutivo

Los casos de uso RF-1.1 a RF-3.4 y el flujo local de RF-04 están implementados y cubiertos por pruebas automatizadas y por un smoke test HTTP de punta a punta. La causa de los botones inoperantes era la inserción de `ObjectId` sin comillas en los manejadores JavaScript generados; todos los identificadores se pasan ahora como cadenas válidas.

Evidencia automatizada final:

- 17 suites Jest aprobadas.
- 85 pruebas aprobadas.
- Sintaxis validada en 43 archivos JavaScript y en los scripts inline de `login.html` y `dashboard.html`.
- Prueba aislada de importación: genera 60 filas únicamente en memoria, procesa 60 cuentas y elimina los datos al terminar Jest.
- Smoke test real: login, sesión, importación, creación de cuentas, generación de expensas, carga/visualización de PNG, revisión, aprobación, mora, FIFO y recibo PDF.

## Checklist funcional

### RF-01 — Administrar Sistema

- [x] **RF-1.1 Iniciar sesión:** valida campos y usuario alfanumérico de 3–20 caracteres; compara bcrypt; bloquea después de 3 intentos durante 15 minutos; desbloquea automáticamente; crea un `session_id` criptográfico de 64 caracteres; expira por 2 horas de inactividad; carga permisos desde el servidor; cierre de sesión invalida la sesión.
- [x] **RF-1.2 Recuperar contraseña:** correo validado, código aleatorio de 6 dígitos, vigencia de 10 minutos, máximo 3 intentos, invalidación del código previo, bcrypt de 12 rondas e invalidación de sesiones después del cambio. En demo, el correo se registra en el simulador SMTP; un envío real requiere las credenciales del proveedor en despliegue.
- [x] **RF-1.3 Configurar perfiles:** el botón Configurar abre el formulario con un ID válido; permite rol y estado; invalida sesiones del usuario modificado; bloquea la eliminación, degradación o desactivación del último Administrador activo; muestra nombre y casa del residente.
- [x] Registro público deshabilitado: las cuentas se crean exclusivamente desde la administración.

### RF-02 — Gestionar Copropietarios

- [x] **RF-2.1 Importar:** acepta `.xlsx/.xls`, valida orden y nombres flexibles de columnas, datos ecuatorianos, duplicados por casa/cédula/correo, rango de casas 1–60 y máximo 60 filas; continúa con registros válidos y reporta errores por fila.
- [x] Cada importado crea automáticamente un usuario `COPROPIETARIO`, contraseña temporal aleatoria cifrada con bcrypt 12 y cambio obligatorio en el primer acceso.
- [x] Incluye resumen descargable en PDF con totales, credenciales temporales, errores y advertencias.
- [x] Plantilla vacía disponible en `archivos_prueba/Plantilla_Importacion_Copropietarios.xlsx`; no contiene identidades ni clientes ficticios.
- [x] **RF-2.2 Leer:** nómina exclusiva del Administrador, filtros de nombre/casa/rango/estado de cuenta/perfil/estado de usuario, orden ascendente/descendente por columnas, mensaje sin resultados y exportación Excel/PDF con los filtros activos.
- [x] **RF-2.3 Reportes:** filtros de fechas, período y estado; validación del rango; vista y PDF; el Administrador ve todos y el Copropietario solo sus propios registros. Los recibos ajenos también están bloqueados.
- [x] **RF-2.4 Modificar:** valida datos, impide cambiar el número de casa, detecta ausencia de cambios, sincroniza correo y regenera contraseña temporal al cambiar cédula, invalidando las sesiones anteriores.
- [x] **RF-2.5 Eliminar:** confirma normalmente, exige confirmación reforzada si existe historial/deuda, invalida cuenta y sesiones, libera la casa y conserva mediante baja lógica el historial financiero para auditoría.

### RF-03 — Implementar Pagos

- [x] **RF-3.1 Reportar pago:** período, monto, fecha, método y referencia obligatorios; referencia única; carga JPG/JPEG/PNG; verificación de firma real del archivo; máximo 5 MB; vista previa; almacenamiento de la imagen y número único de solicitud.
- [x] **RF-3.2 Validar pago:** tabla con fecha de solicitud; botón Ver Comprobante funcional; imagen ampliada; datos del residente/pago; desglose de deuda, mora y aplicación FIFO; botones Aprobar/Rechazar funcionales; rechazo exige motivo.
- [x] **RF-3.3 Mora:** vencimiento el día 5 del mes siguiente, recargo fijo del 12% por período, aplicado una sola vez, persistido y mostrado antes de aprobar; operación compensada si falla.
- [x] **RF-3.4 Comprobante:** reserva atómica contra doble aprobación, aplicación FIFO a las deudas más antiguas, pago parcial, sobrepago/crédito, saldo actualizado, ID de recibo único, detalle de aplicaciones, PDF generado y almacenado, historial y auditoría. La operación reintenta hasta 3 veces y revierte sus cambios si falla.
- [x] Generar expensas incrementa tanto la deuda detallada como el saldo general y no duplica un período existente.

### RF-04 — Enviar Notificaciones

- [x] Plantillas diferenciadas para aprobación, rechazo y mora.
- [x] Validación de teléfono ecuatoriano normalizado (`+5939` y 8 dígitos).
- [x] Advertencia persistente si no existe teléfono.
- [x] Cola con hasta 3 intentos y 30 segundos entre intentos.
- [x] Estado persistente (`PENDIENTE`, `REINTENTANDO`, `EXITOSO`, `FALLIDO`), error, destinatario, fecha e intentos.
- [x] Fallo permanente almacenado en cola y auditoría; visible al Administrador en la pestaña Validación de Pagos.
- [x] El entorno local usa simulador WhatsApp. La entrega a teléfonos reales depende de contratar/configurar WhatsApp Business API y no puede certificarse sin sus credenciales.

## Requisitos no funcionales

- [x] **RNF-01 Seguridad:** bcrypt con costo 12, sesiones de servidor con 2 horas de inactividad, bloqueo exacto de 15 minutos, recuperación y controles por rol. Las cabeceras `x-user-role` y `x-user-id` falsificadas no conceden acceso.
- [x] **RNF-02 Integridad:** historial sin rutas de edición, PDF persistido, reserva atómica de pagos, reversión compensatoria y reintentos. Existe prueba de dos aprobaciones concurrentes sobre el mismo pago: solo una se completa.
- [x] **RNF-05 Rendimiento funcional:** la importación de 60 registros se verifica automáticamente por debajo de 10 segundos; la interfaz muestra indicador durante la importación. Salud y operaciones estándar respondieron correctamente en el smoke test local.
- [x] **RNF-04 Archivos (aplicación):** formatos/firma/tamaño controlados; imágenes y PDFs permanecen en MongoDB sin TTL y las bajas lógicas preservan el historial.
- [x] **RNF-06 Usabilidad (aplicación):** navegación por rol consistente y responsiva, vista previa, mensajes específicos, estados vacíos, indicadores de carga y acceso a las tareas críticas sin menús profundos.
- [x] **RNF-07 Compatibilidad (código):** HTML/CSS/JavaScript sin compilación, breakpoints móvil/tablet/escritorio y menús móviles; scripts de ambas vistas validados sintácticamente.
- [x] **RNF-08 Escalabilidad (diseño):** arquitectura en tres capas, repositorios aislados, servicios sin estado de sesión en cliente, importación paralela y control de concurrencia financiera.

## Validaciones que pertenecen al despliegue

No sería técnicamente correcto afirmar que los siguientes SLA están certificados solo con el código local. Deben ejecutarse en el ambiente productivo:

- disponibilidad mensual real del 99%, recuperación automática y aviso de mantenimientos con 48 horas (RNF-03);
- política operativa de respaldos y prueba de restauración para garantizar 5 años de retención (parte de RNF-04);
- prueba formal de usabilidad con usuarios para acreditar el objetivo del 80% (parte de RNF-06);
- matriz real de las últimas 3 versiones de Chrome, Firefox, Safari y Edge (parte de RNF-07);
- prueba de carga productiva con 100 casas y 50 usuarios concurrentes, incluida degradación menor al 10% (parte de RNF-08);
- entrega real SMTP y WhatsApp Business API, porque requieren cuentas, tokens y números aprobados del proveedor.

Estas validaciones externas no representan funciones faltantes del prototipo; son certificaciones operativas que necesitan infraestructura, credenciales y medición sostenida.

## Cómo revisar la instancia preparada

Instancia actual: `http://localhost:3200`

- Administrador: `admin` / `Admin123!`
- Copropietario técnico sin movimientos: `casa1` / `Casa1Demo!`
- Copropietario técnico sin movimientos: `casa2` / `Casa2Demo!`

La instancia contiene exactamente un Administrador y dos copropietarios técnicos editables. No incluye pagos, deudas ni importaciones precargadas. Usa MongoDB en memoria y se reinicia limpia cuando se detiene el proceso. Para iniciarla nuevamente use `npm run demo`; por defecto intenta el puerto 3000.
