const mongoose = require('mongoose');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const conectarBD = async () => {
    if (mongoose.connection.readyState === 0) {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://cedeno:cedeno@ac-gtoetj3-shard-00-00.sw7jvqd.mongodb.net:27017,ac-gtoetj3-shard-00-01.sw7jvqd.mongodb.net:27017,ac-gtoetj3-shard-00-02.sw7jvqd.mongodb.net:27017/aligest?ssl=true&authSource=admin';
        try {
            await mongoose.connect(MONGODB_URI);
            console.log("✔ Conectado a MongoDB con éxito.");
        } catch (error) {
            console.error("✘ ERROR al conectar a MongoDB:", error.message);
            throw error;
        }
    }
};

const desconectarBD = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log("✘ Desconectado de MongoDB.");
    }
};

const limpiarTablas = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};

// --- ESQUEMAS DE MONGOOSE ---

const UsuarioSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // 'ADMINISTRADOR' o 'COPROPIETARIO'
    status: { type: String, default: 'ACTIVO' }, // 'ACTIVO' o 'BLOQUEADO'
    failed_attempts: { type: Number, default: 0 },
    lockout_until: { type: String, default: null },
    recovery_code: { type: String, default: null },
    recovery_code_expires_at: { type: String, default: null },
    recovery_attempts: { type: Number, default: 0 },
    must_change_password: { type: Number, default: 0 }
});

const SesionSchema = new mongoose.Schema({
    session_id: { type: String, unique: true, required: true, index: true },
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    created_at: { type: String, required: true },
    last_activity_at: { type: String, required: true }
});

const CopropietarioSchema = new mongoose.Schema({
    cedula: { type: String, unique: true, required: true },
    nombre: { type: String, required: true },
    casa: { type: String, unique: true, required: true },
    telefono: { type: String },
    email: { type: String, unique: true, required: true },
    saldo: { type: Number, default: 0.0 },
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    is_deleted: { type: Number, default: 0 },
    deleted_at: { type: String, default: null }
});

const DeudaSchema = new mongoose.Schema({
    copropietario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Copropietario', required: true },
    mes: { type: String, required: true }, // 'YYYY-MM'
    monto: { type: Number, required: true },
    estado: { type: String, default: 'PENDIENTE' }, // 'PENDIENTE', 'PAGADO'
    fecha_vencimiento: { type: String, required: true },
    mora_aplicada: { type: Boolean, default: false },
    recargo_mora: { type: Number, default: 0 }
});

const PagoSchema = new mongoose.Schema({
    comprobante_id: { type: String, unique: true, required: true },
    // Sin "default": el índice único+sparse solo excluye documentos donde el
    // campo está ausente. Si se le asignara "default: null", Mongoose lo
    // escribiría explícitamente como null en cada pago pendiente/rechazado y
    // el segundo de ellos violaría la unicidad (ver pagoRepository.js).
    recibo_id: { type: String, unique: true, sparse: true },
    copropietario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Copropietario', required: true },
    monto_pagado: { type: Number, required: true },
    estado: { type: String, default: 'PENDIENTE_VALIDACION' }, // 'PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO'
    fecha_registro: { type: String, required: true },
    fecha_pago: { type: String, required: true, default: () => new Date().toISOString().slice(0, 10) },
    metodo: { type: String, default: 'TRANSFERENCIA' },
    periodo: { type: String, default: '' },
    motivo_rechazo: { type: String, default: null },
    comprobante_img: { type: String, default: null },
    recibo_pdf: { type: Buffer, default: null },
    sobrepago: { type: Number, default: 0 },
    recargo_mora_total: { type: Number, default: 0 },
    aplicaciones: [{
        periodo: String,
        monto_pendiente: Number,
        recargo_mora: Number,
        monto_aplicado: Number,
        saldo_posterior: Number
    }]
});

const AuditoriaSchema = new mongoose.Schema({
    accion: { type: String, required: true },
    detalles: { type: String },
    timestamp: { type: String, required: true }
});

const NotificacionSchema = new mongoose.Schema({
    tipo: { type: String, required: true },
    telefono: { type: String, default: '' },
    mensaje: { type: String, required: true },
    estado: { type: String, default: 'PENDIENTE' },
    intentos: { type: Number, default: 0 },
    error: { type: String, default: null },
    created_at: { type: String, required: true },
    updated_at: { type: String, required: true }
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Sesion = mongoose.model('Sesion', SesionSchema);
const Copropietario = mongoose.model('Copropietario', CopropietarioSchema);
const Deuda = mongoose.model('Deuda', DeudaSchema);
const Pago = mongoose.model('Pago', PagoSchema);
const Auditoria = mongoose.model('Auditoria', AuditoriaSchema);
const Notificacion = mongoose.model('Notificacion', NotificacionSchema);

module.exports = {
    conectarBD,
    desconectarBD,
    limpiarTablas,
    Usuario,
    Sesion,
    Copropietario,
    Deuda,
    Pago,
    Auditoria,
    Notificacion
};
