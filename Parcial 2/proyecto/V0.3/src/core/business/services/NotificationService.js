class NotificationService {
    constructor() {
        this.cola = [];
        this.procesando = false;
    }

    async enviarNotificacionPago(telefono, comprobanteId, montoAplicado, saldoActual) {
        const mensaje = `*AliGest Condominios - Recibo de Pago*\n\n` +
                        `Estimado residente, confirmamos la recepción y validación de su pago.\n\n` +
                        `• *Recibo ID:* ${comprobanteId}\n` +
                        `• *Monto Aplicado:* $${parseFloat(montoAplicado).toFixed(2)}\n` +
                        `• *Estado actual de cuenta:* $${parseFloat(saldoActual).toFixed(2)} ${saldoActual > 0 ? '(Saldo Deudor)' : '(Saldo a Favor)'}\n\n` +
                        `Gracias por mantener su cuenta al día.`;

        // Encolar notificación para simulación de reintentos
        this.cola.push({ telefono, mensaje, intentos: 0 });
        this.procesarCola();
    }

    async procesarCola() {
        if (this.procesando) return;
        this.procesando = true;

        while (this.cola.length > 0) {
            const item = this.cola[0];
            try {
                item.intentos++;
                await this.simularApiWhatsApp(item.telefono, item.mensaje);
                console.log(`[WhatsApp API Success] Notificación enviada al ${item.telefono} (Intento #${item.intentos})`);
                this.cola.shift(); // Eliminar de la cola tras éxito
            } catch (err) {
                console.error(`[WhatsApp API Retry] Fallo temporal para ${item.telefono}: ${err.message}.`);
                if (item.intentos >= 3) {
                    console.error(`[WhatsApp API Error] Mensaje para ${item.telefono} descartado permanentemente después de 3 intentos fallidos.`);
                    this.cola.shift();
                } else {
                    // Retrasar el reintento 1.5 segundos
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
        }

        this.procesando = false;
    }

    simularApiWhatsApp(telefono, mensaje) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulación de 25% de probabilidad de fallo de red
                if (Math.random() < 0.25) {
                    reject(new Error("Timeout / Error de resolución DNS temporal"));
                } else {
                    console.log(`\n======================================================`);
                    console.log(`[WHATSAPP BUSINESS API RAW OUTPUT]`);
                    console.log(`Para: ${telefono}`);
                    console.log(mensaje);
                    console.log(`======================================================\n`);
                    resolve(true);
                }
            }, 300);
        });
    }
}

module.exports = new NotificationService();
