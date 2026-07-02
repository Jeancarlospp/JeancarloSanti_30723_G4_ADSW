const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:'); // Persistencia relacional limpia en memoria para el prototipo

db.serialize(() => {
    // REQ001-REQ003: Usuarios y Seguridad (con soporte de bloqueo por fuerza bruta y recuperación por email)
    db.run(`CREATE TABLE usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL, -- 'ADMINISTRADOR' o 'COPROPIETARIO'
        status TEXT DEFAULT 'ACTIVO', -- 'ACTIVO' o 'BLOQUEADO'
        failed_attempts INTEGER DEFAULT 0,
        lockout_until TEXT,
        recovery_code TEXT,
        recovery_code_expires_at TEXT
    )`);

    // REQ004-REQ008: Gestión de Copropietarios
    db.run(`CREATE TABLE copropietarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cedula TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        casa TEXT UNIQUE NOT NULL,
        telefono TEXT,
        email TEXT UNIQUE NOT NULL,
        saldo REAL DEFAULT 0.0,
        usuario_id INTEGER,
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
    )`);

    // REQ009-REQ012: Deudas, Pagos e Historial Inmutable
    db.run(`CREATE TABLE deudas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        copropietario_id INTEGER NOT NULL,
        mes TEXT NOT NULL, -- Formato: 'YYYY-MM'
        monto REAL NOT NULL,
        estado TEXT DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'PAGADO'
        fecha_vencimiento TEXT NOT NULL,
        FOREIGN KEY(copropietario_id) REFERENCES copropietarios(id)
    )`);

    db.run(`CREATE TABLE pagos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comprobante_id TEXT UNIQUE NOT NULL, -- Código de transferencia bancaria
        recibo_id TEXT UNIQUE, -- Código de recibo inmutable: AGE-YYYYMM-VILLA-SEQ (RF-3.4)
        copropietario_id INTEGER NOT NULL,
        monto_pagado REAL NOT NULL,
        estado TEXT DEFAULT 'PENDIENTE_VALIDACION', -- REQ011: 'PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO'
        fecha_registro TEXT NOT NULL,
        metodo TEXT DEFAULT 'TRANSFERENCIA',
        periodo TEXT, -- Período que declara pagar (ej: '2026-07')
        motivo_rechazo TEXT,
        comprobante_img TEXT, -- Archivo adjunto (imagen del depósito/transferencia)
        FOREIGN KEY(copropietario_id) REFERENCES copropietarios(id)
    )`);

    // REQ012: Auditoría del decorador
    db.run(`CREATE TABLE auditoria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accion TEXT NOT NULL,
        detalles TEXT,
        timestamp TEXT NOT NULL
    )`);
});

module.exports = db;
