# Guion para Video Demostrativo - Sistema AliGest

* **Duración estimada:** 12 a 15 minutos.
* **Audiencia y Participantes:** 
  * **Presentador (Desarrollador / Líder Técnico):** Encargado de guiar la presentación, compartir la pantalla y demostrar el funcionamiento práctico de la aplicación.
  * **Cliente (Administrador de la Copropiedad / Usuario Final):** Valida la usabilidad de las herramientas, hace preguntas de uso cotidiano y da su retroalimentación y criterio de aceptación.
* **Enfoque:** **100% Funcional y Práctico.** Sin tecnicismos ni términos complejos (sin mencionar bases de datos, librerías de encriptación, ni código). Enfocado en cómo AliGest resuelve los problemas reales de administración en un condominio o urbanización.

---

## Estructura de Tiempos y Secciones

```mermaid
gantt
    title Estructura del Video (15 minutos máx.)
    dateFormat  m
    axisFormat %M:%S
    
    Introducción y Objetivos      :active, 0, 1.5m
    Seguridad e Inicio de Sesión  : 1.5m, 3.5m
    Gestión de Copropietarios    : 3.5m, 6.5m
    Registro y Validación de Pagos: 6.5m, 11.5m
    Notificaciones Automáticas    : 11.5m, 13m
    Cierre e Aprobación del Cliente: 13m, 15m
```

---

## 🎬 GUION DETALLADO (Paso a Paso)

### 📌 Sección 1: Bienvenida e Introducción
* **Duración:** 00:00 - 01:30 (1.5 minutos)
* **Objetivo:** Establecer el contexto del video, presentar a los participantes y definir el propósito de la demostración.

| Tiempo | Rol | Guion / Diálogo | Acción en Pantalla (Visual) |
| :--- | :--- | :--- | :--- |
| **00:00** | **Presentador** | "Hola a todos. Bienvenidos a la demostración final del sistema **AliGest**, la plataforma diseñada para simplificar y automatizar la administración de nuestra copropiedad. Hoy nos acompaña [Nombre del Cliente], en representación del comité de administración, para validar el funcionamiento del sistema. Hola, ¿cómo estás?" | Se muestra la cámara web del Presentador y del Cliente en pantalla dividida. |
| **00:25** | **Cliente** | "Hola, muy bien. Con muchas ganas de ver cómo ha quedado la herramienta. Para nosotros es clave que sea fácil de usar, ya que manejamos mucha información de pagos y vecinos todos los días." | Rostro del Cliente hablando a la cámara. |
| **00:45** | **Presentador** | "Excelente. Hoy revisaremos los cuatro pilares del sistema: cómo protegemos el acceso, cómo registramos a los vecinos rápidamente, cómo ellos reportan sus pagos y cómo tú los validas sin hacer cálculos manuales. Al final, te pediré tu criterio y aprobación sobre lo construido. ¡Empecemos!" | El Presentador comienza a compartir su pantalla, mostrando la página de inicio de sesión de AliGest. |

---

### 📌 Sección 2: Control de Acceso y Seguridad (RF-01)
* **Duración:** 01:30 - 03:30 (2 minutos)
* **Objetivo:** Mostrar cómo el sistema protege la información financiera e impide accesos no autorizados.

| Tiempo | Rol | Guion / Diálogo | Acción en Pantalla (Visual) |
| :--- | :--- | :--- | :--- |
| **01:30** | **Presentador** | "Esta es nuestra pantalla de entrada. Para garantizar que la información financiera esté segura, el sistema tiene reglas estrictas. Por ejemplo, si un usuario intenta ingresar con una contraseña incorrecta varias veces, el sistema bloquea su cuenta temporalmente por 15 minutos para evitar hackeos." | El Presentador escribe datos incorrectos en el formulario de login e intenta acceder tres veces seguidas hasta mostrar el mensaje de bloqueo. |
| **02:00** | **Cliente** | "Eso es excelente, porque a veces los vecinos se equivocan o intentan ingresar a cuentas ajenas. ¿Y qué pasa si realmente olvidaron la contraseña?" | Rostro del Cliente en miniatura mientras observa la pantalla compartida. |
| **02:15** | **Presentador** | "Para eso tenemos la opción 'Recuperar Contraseña'. El vecino ingresa su correo y el sistema le envía un código de seguridad de 6 dígitos que expira rápido. Al ingresarlo, puede crear una nueva contraseña segura. Hagamos la prueba." | Hace clic en "Olvidé mi contraseña", ingresa el correo, simula la recepción del código de 6 dígitos y redefine la contraseña. Luego, inicia sesión exitosamente como Administrador. |
| **03:00** | **Cliente** | "Me parece muy ágil y seguro. Veo que ya estamos dentro del panel principal o panel de control." | Se muestra el Panel de Control (Dashboard) del Administrador con sus menús principales. |

---

### 📌 Sección 3: Gestión de Copropietarios e Importación Masiva (RF-02)
* **Duración:** 03:30 - 06:30 (3 minutos)
* **Objetivo:** Demostrar cómo se registra a los copropietarios de manera masiva y cómo se gestiona su información histórica.

| Tiempo | Rol | Guion / Diálogo | Acción en Pantalla (Visual) |
| :--- | :--- | :--- | :--- |
| **03:30** | **Presentador** | "Registrar uno a uno a los vecinos de las 60 casas de la urbanización sería eterno. Por eso creamos la 'Importación Masiva'. Solo debes descargar esta plantilla de Excel, llenarla con los datos de los vecinos y subirla aquí. Vamos a subir nuestra lista de prueba." | El Presentador va a la sección "Copropietarios", muestra el botón de descarga de la plantilla Excel y luego selecciona un archivo Excel para importarlo. |
| **04:00** | **Presentador** | "Al cargar el archivo, el sistema crea en segundos las cuentas para todos los copropietarios, les asigna una contraseña temporal segura y les exige cambiarla la primera vez que entren para que solo ellos la conozcan. Además, podemos descargar este reporte PDF con sus accesos iniciales." | Sube el archivo Excel, aparece un indicador visual de carga rápida y se muestra un mensaje de éxito. Descarga el PDF con las credenciales temporales generadas. |
| **04:30** | **Cliente** | "¡Vaya! Eso nos ahorra semanas de trabajo de digitación. ¿Qué pasa si un vecino vende su casa y tenemos que cambiarlo por otro?" | Se muestra la lista de copropietarios importados con sus nombres, casas y estados de cuenta. |
| **04:50** | **Presentador** | "Es muy sencillo. Podemos modificar sus datos directamente aquí. Y si el vecino se va de la urbanización, usamos la opción de eliminación. El sistema nos pedirá una confirmación adicional si el vecino tiene deudas pendientes." | Hace clic en "Modificar" en uno de los residentes. Luego hace clic en "Eliminar" en otro residente que tiene deudas para mostrar el mensaje de alerta especial. |
| **05:25** | **Presentador** | "Al confirmar la eliminación, el vecino ya no podrá entrar al sistema y su casa queda libre para el nuevo dueño. Sin embargo, su historial de pagos se queda guardado bajo llave en el sistema por motivos de auditoría. Así nunca se pierden los registros de lo que pagó en el pasado." | Completa la eliminación lógica y muestra que el usuario desaparece de la lista activa, pero aclara que el registro histórico permanece seguro. |
| **06:00** | **Cliente** | "Eso nos da mucha tranquilidad legal. El historial financiero de la copropiedad debe ser intocable. Me gusta cómo se ve la tabla de vecinos, los filtros de búsqueda por casa y nombre funcionan muy rápido." | El Presentador interactúa con los filtros de búsqueda y ordena la tabla por número de casa y por nombre de forma ascendente y descendente. |

---

### 📌 Sección 4: Reporte y Validación de Pagos con Reglas de Negocio (RF-03)
* **Duración:** 06:30 - 11:30 (5 minutos)
* **Objetivo:** Mostrar el flujo completo de pagos, incluyendo la perspectiva del copropietario, el cobro automático de mora y el orden de abono FIFO.

| Tiempo | Rol | Guion / Diálogo | Acción en Pantalla (Visual) |
| :--- | :--- | :--- | :--- |
| **06:30** | **Presentador** | "Ahora pasemos al corazón de AliGest: la gestión de pagos. Primero, nos pondremos en los zapatos de un vecino que quiere reportar su alícuota del mes. Entraré con una cuenta de copropietario." | Cierra sesión como Administrador e inicia sesión con la cuenta de un copropietario (ej: `casa1`). |
| **07:00** | **Presentador** | "El vecino va a 'Reportar Pago', escribe el monto de su transferencia, la fecha, la referencia del banco y sube la foto de su comprobante desde su celular o computadora. El sistema valida que sea una imagen real de hasta 5 megabytes." | Llena el formulario de reporte de pago, adjunta una imagen de recibo bancario y hace clic en enviar. Se muestra un mensaje con el número único de solicitud de pago. |
| **07:40** | **Presentador** | "Listo, el pago queda registrado como 'Pendiente'. Ahora, volvamos a tu vista como Administrador para ver cómo validas este pago." | Cierra sesión de copropietario y vuelve a ingresar como Administrador. Va a la pestaña "Validación de Pagos". |
| **08:10** | **Presentador** | "Aquí tienes la lista de los pagos que los vecinos han reportado. Si hacemos clic en el pago que acabamos de enviar, podemos ver la foto del comprobante ampliada para compararla con nuestra cuenta bancaria real." | Hace clic en "Ver Comprobante", se abre una ventana flotante con la imagen grande de la transferencia y los datos reportados por el residente a la izquierda. |
| **08:40** | **Cliente** | "Perfecto, puedo leer claramente el número de transferencia y el valor. Veo que abajo hay un desglose que dice 'Aplicación FIFO'. ¿Qué significa eso en la práctica?" | El cursor del Presentador señala el desglose de deudas del copropietario en pantalla. |
| **09:00** | **Presentador** | "Significa 'Lo primero que entra es lo primero que sale'. AliGest busca de forma automática las deudas más viejas de ese vecino y abona el pago ahí primero. De esta forma, el vecino no acumula deudas antiguas que luego causen problemas legales o cobros cruzados. Todo se hace de forma automática." | Muestra visualmente cómo el pago reportado se distribuye para saldar los meses más antiguos pendientes del usuario. |
| **09:35** | **Presentador** | "Además, fíjate en este recargo. Como el vecino está pagando después del día 5 del mes, el sistema le aplicó automáticamente un 12% de mora sobre el saldo pendiente, sin que tú tengas que calcularlo con calculadora ni Excel." | Señala el recargo por mora del 12% calculado y sumado al desglose de la deuda del residente. |
| **10:00** | **Cliente** | "¡Esto es espectacular! Uno de los mayores problemas que tenemos es calcular las moras de los que pagan tarde y saber exactamente qué mes nos están pagando. Esto nos quita ese dolor de cabeza." | El Cliente sonríe o muestra un gesto de aprobación en su cámara. |
| **10:20** | **Presentador** | "Exactamente. Ahora, si el comprobante está correcto, hacemos clic en 'Aprobar'. Si hubiera algún error, podemos hacer clic en 'Rechazar' y el sistema nos obligará a escribir el motivo para que el vecino sepa qué corregir. Vamos a aprobar este pago." | El Presentador hace clic en "Aprobar". El sistema procesa el pago y muestra una confirmación de éxito. |
| **10:50** | **Presentador** | "Al aprobarse, el sistema genera de inmediato el recibo oficial en PDF con el sello digital, el detalle de qué meses se saldaron y los saldos pendientes. Este PDF se guarda en el historial del vecino para que él lo descargue cuando quiera." | Abre y muestra el PDF generado con el desglose del pago aprobado, los saldos actualizados y la firma de control del sistema. |

---

### 📌 Sección 5: Notificaciones y Avisos Automáticos (RF-04)
* **Duración:** 11:30 - 13:00 (1.5 minutos)
* **Objetivo:** Mostrar cómo el sistema mantiene informados a los vecinos sobre su estado financiero de manera proactiva.

| Tiempo | Rol | Guion / Diálogo | Acción en Pantalla (Visual) |
| :--- | :--- | :--- | :--- |
| **11:30** | **Presentador** | "Para evitar llamadas y reclamos, AliGest incluye notificaciones directas al celular. Cuando aprobaste el pago hace un momento, el sistema envió un mensaje automático de confirmación al WhatsApp del vecino con el detalle de su saldo." | Abre la pestaña de "Historial de Notificaciones" o el simulador donde se ve el mensaje saliente de WhatsApp. |
| **11:55** | **Presentador** | "Lo mismo ocurre si rechazas un pago: el vecino recibe un mensaje en su teléfono indicando por qué se rechazó y qué debe hacer. Y si llega el día 6 del mes y no ha pagado, el sistema le envía un recordatorio de mora." | Muestra las plantillas de mensajes estructurados (Aprobación, Rechazo con motivo, y Aviso de Mora) con el formato normalizado para números de Ecuador. |
| **12:20** | **Cliente** | "Increíble. Esto nos ayuda a mantener una comunicación constante sin tener que estar escribiendo mensajes manuales uno por uno en la noche." | El Cliente asiente con la cabeza en señal de aprobación. |
| **12:40** | **Presentador** | "Así es. El sistema cuenta con una cola inteligente: si el mensaje no se puede entregar a la primera por falta de señal, reintenta automáticamente hasta 3 veces antes de marcarlo como fallido para que estés al tanto." | Muestra la columna de "Estado de Envío" (Exitoso / Reintentando / Fallido) en el monitor de notificaciones. |

---

### 📌 Sección 6: Conclusiones y Criterio de Aceptación del Cliente
* **Duración:** 13:00 - 15:00 (2 minutos)
* **Objetivo:** Obtener la validación formal del cliente sobre el software desarrollado.

| Tiempo | Rol | Guion / Diálogo | Acción en Pantalla (Visual) |
| :--- | :--- | :--- | :--- |
| **13:00** | **Presentador** | "Hemos cubierto todo el ciclo de AliGest: la seguridad del acceso, el registro masivo con Excel, la facilidad de reportar pagos con fotos, el cálculo automático de moras, la aplicación del dinero ordenadamente (FIFO) y el aviso inmediato a los vecinos." | El Presentador deja de compartir pantalla y vuelve a la vista de cámaras en pantalla completa. |
| **13:30** | **Presentador** | "Estimado [Nombre del Cliente], basándote en lo que has visto operar en tiempo real: ¿consideras que el sistema cumple con las necesidades de administración de la copropiedad?, ¿estás de acuerdo con el funcionamiento de los requisitos construidos y su facilidad de uso?" | El Presentador mira a la cámara esperando la respuesta del cliente. |
| **13:50** | **Cliente** | "Totalmente de acuerdo. Me parece que cumple al 100% con lo que acordamos. Lo que más me gusta es que no requiere conocimientos contables complejos para operar la cobranza y que las pantallas son muy claras tanto para mí como administrador, como para los copropietarios. Por mi parte, el sistema tiene mi total aprobación bajo los criterios acordados." | Rostro del Cliente expresando su aprobación formal y comentarios de cierre. |
| **14:30** | **Presentador** | "Te agradezco mucho por tu tiempo y por tu retroalimentación constante durante el desarrollo. Con esta aprobación, procederemos con los siguientes pasos de la entrega y el manual de usuario para el inicio de operaciones. ¡Muchas gracias a todos por ver esta presentación!" | Ambos participantes se despiden con la mano. Fin del video. |

---

## 💡 Consejos Prácticos para Grabar el Video:
1. **Evita códigos y bases de datos:** Si algo falla en la demo, no expliques el error de programación. Simplemente di "vamos a reintentar la acción" o realiza un corte de edición.
2. **Usa datos realistas:** Llena el Excel de prueba con nombres reales de ejemplo (ej. "Juan Pérez, Casa 12") en lugar de datos sin sentido ("asdasd", "test1"). Esto le dará mucha más seriedad a la presentación frente al cliente.
3. **Controla el tiempo:** Mantén un ritmo dinámico. No te detengas demasiado tiempo explicando pantallas sencillas. El foco principal debe estar en la validación de pagos (Sección 4), que es donde el sistema demuestra su mayor valor práctico.
4. **Muestra el PDF:** Asegúrate de abrir y mostrar el recibo PDF generado, ya que es el entregable físico que el copropietario recibe y valida.
