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
            process.exit(1);
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
    must_change_password: { type: Number, default: 0 }
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
    fecha_vencimiento: { type: String, required: true }
});

const PagoSchema = new mongoose.Schema({
    comprobante_id: { type: String, unique: true, required: true },
    recibo_id: { type: String, unique: true, sparse: true, default: null },
    copropietario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Copropietario', required: true },
    monto_pagado: { type: Number, required: true },
    estado: { type: String, default: 'PENDIENTE_VALIDACION' }, // 'PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO'
    fecha_registro: { type: String, required: true },
    metodo: { type: String, default: 'TRANSFERENCIA' },
    periodo: { type: String, default: '' },
    motivo_rechazo: { type: String, default: null },
    comprobante_img: { type: String, default: null }
});

const AuditoriaSchema = new mongoose.Schema({
    accion: { type: String, required: true },
    detalles: { type: String },
    timestamp: { type: String, required: true }
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Copropietario = mongoose.model('Copropietario', CopropietarioSchema);
const Deuda = mongoose.model('Deuda', DeudaSchema);
const Pago = mongoose.model('Pago', PagoSchema);
const Auditoria = mongoose.model('Auditoria', AuditoriaSchema);

module.exports = {
    conectarBD,
    desconectarBD,
    limpiarTablas,
    Usuario,
    Copropietario,
    Deuda,
    Pago,
    Auditoria
};
