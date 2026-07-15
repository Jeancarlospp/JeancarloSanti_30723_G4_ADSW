const pagoRepository = require('../../../data/repositories/pagoRepository');

class NotificationService {
    constructor() {
        this.cola = [];
        this.pendientesReintento = [];
        this.procesando = false;
    }

    async enviarNotificacionPago(telefono, comprobanteId, montoAplicado, saldoActual) {
        const mensaje = `*AliGest Condominios - Pago Aprobado*\n\n` +
            `Confirmamos la recepción y validación de su pago.\n\n` +
            `• *Recibo ID:* ${comprobanteId}\n` +
            `• *Monto aplicado:* $${parseFloat(montoAplicado).toFixed(2)}\n` +
            `• *Estado actual de cuenta:* $${parseFloat(saldoActual).toFixed(2)} ${saldoActual > 0 ? '(Saldo deudor)' : '(Saldo a favor)'}\n\n` +
            `Gracias por mantener su cuenta al día.`;
        return this.encolar('APROBACION_PAGO', telefono, mensaje);
    }

    async enviarNotificacionRechazo(telefono, referencia, monto, motivo) {
        const mensaje = `*AliGest Condominios - Pago Rechazado*\n\n` +
            `Su comprobante de pago fue rechazado.\n\n` +
            `• *Referencia:* ${referencia}\n` +
            `• *Monto:* $${parseFloat(monto).toFixed(2)}\n` +
            `• *Motivo:* ${motivo}\n\n` +
            `Corrija el inconveniente y reporte nuevamente el pago.`;
        return this.encolar('RECHAZO_PAGO', telefono, mensaje);
    }

    async enviarNotificacionMora(telefono, nombre, casa, recargo) {
        const mensaje = `*AliGest Condominios - Sanción por Mora*\n\n` +
            `Estimado/a ${nombre}, casa ${casa}, se aplicó el recargo reglamentario del 12% a sus períodos vencidos.\n` +
            `• *Recargo total aplicado:* $${parseFloat(recargo).toFixed(2)}\n` +
            `Consulte el detalle actualizado en su estado de cuenta.`;
        return this.encolar('MORA', telefono, mensaje);
    }

    async encolar(tipo, telefono, mensaje) {
        if (!telefono) {
            const aviso = 'Copropietario sin teléfono registrado. Notificación no enviada.';
            await pagoRepository.registrarNotificacion(tipo, '', mensaje, 'FALLIDO', aviso);
            console.warn(aviso);
            return { estado: 'FALLIDO', mensaje: aviso };
        }

        const id = await pagoRepository.registrarNotificacion(tipo, telefono, mensaje);
        this.cola.push({ id, tipo, telefono, mensaje, intentos: 0 });
        void this.procesarCola();
        return { estado: 'ENCOLADO', id };
    }

    async procesarCola() {
        if (this.procesando) return;
        this.procesando = true;

        while (this.cola.length > 0) {
            const item = this.cola[0];
            try {
                item.intentos++;
                await this.simularApiWhatsApp(item.telefono, item.mensaje);
                await pagoRepository.actualizarNotificacion(item.id, 'EXITOSO', item.intentos);
                console.log(`[WhatsApp API Success] Notificación enviada al ${item.telefono} (Intento #${item.intentos})`);
                this.cola.shift();
            } catch (err) {
                await pagoRepository.actualizarNotificacion(item.id, item.intentos >= 3 ? 'FALLIDO' : 'REINTENTANDO', item.intentos, err.message);
                console.error(`[WhatsApp API Retry] Fallo temporal para ${item.telefono}: ${err.message}.`);

                if (item.intentos >= 3) {
                    this.pendientesReintento.push({ ...item, ultimoError: err.message });
                    await pagoRepository.registrarAuditoria('NOTIFICACION_WHATSAPP_FALLO_PERMANENTE', {
                        telefono: item.telefono,
                        casa: item.casa,
                        intentos: item.intentos,
                        mensaje: `Error al enviar notificación a ${item.telefono}. Mensaje en cola de reintentos.`
                    });
                    this.cola.shift();
                } else {
                    await new Promise(resolve => setTimeout(resolve, process.env.NODE_ENV === 'test' ? 0 : 30000));
                }
            }
        }

        this.procesando = false;
    }

    simularApiWhatsApp(telefono, mensaje) {
        return new Promise((resolve, reject) => {
            const esTest = process.env.NODE_ENV === 'test';
            const delay = esTest ? 0 : 300;
            const probabilidadFallo = esTest ? 0 : 0.25;

            setTimeout(() => {
                if (!/^\+5939\d{8}$/.test(telefono)) {
                    return reject(new Error('Número de teléfono ecuatoriano inválido.'));
                }
                if (Math.random() < probabilidadFallo) {
                    return reject(new Error('Timeout / Error de resolución DNS temporal'));
                }
                console.log(`\n======================================================`);
                console.log('[WHATSAPP BUSINESS API RAW OUTPUT]');
                console.log(`Para: ${telefono}`);
                console.log(mensaje);
                console.log(`======================================================\n`);
                resolve(true);
            }, delay);
        });
    }
}

module.exports = new NotificationService();
