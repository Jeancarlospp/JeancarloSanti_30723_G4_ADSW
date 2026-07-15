const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:'); // Embebida en memoria para el prototipo

db.serialize(() => {
    // REQ001: Usuarios e Inicio de sesión
    db.run(`CREATE TABLE usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`);

    // REQ004-REQ008: Gestión de Copropietarios
    db.run(`CREATE TABLE copropietarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cedula TEXT UNIQUE,
        nombre TEXT,
        casa TEXT UNIQUE,
        telefono TEXT,
        saldo REAL DEFAULT 0.0
    )`);

    // REQ009-REQ012: Pagos, Expensas e Historial Inmutable
    db.run(`CREATE TABLE deudas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        copropietario_id INTEGER,
        mes TEXT,
        monto REAL,
        estado TEXT DEFAULT 'PENDIENTE',
        fecha_vencimiento TEXT
    )`);

    db.run(`CREATE TABLE pagos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comprobante_id TEXT UNIQUE,
        copropietario_id INTEGER,
        monto_pagado REAL,
        estado TEXT DEFAULT 'PENDIENTE',
        fecha_registro TEXT
    )`);

    db.run(`CREATE TABLE auditoria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accion TEXT,
        detalles TEXT,
        timestamp TEXT
    )`);
});

module.exports = db;