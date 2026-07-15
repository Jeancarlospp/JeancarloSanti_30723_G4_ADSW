process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const db = require('../config/database');

let mongoServer;

beforeAll(async () => {
    // Iniciar servidor MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Sobrescribir la URI de producción por la URI en memoria
    process.env.MONGODB_URI = uri;
    
    await db.conectarBD();
});

afterAll(async () => {
    await db.desconectarBD();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

beforeEach(async () => {
    // Limpiar todas las colecciones antes de cada prueba
    await db.limpiarTablas();
});
