const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
    const mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri('aligest_demo');
    process.env.EMAIL_SIMULATOR = 'true';
    process.env.AUTO_PORT = 'true';
    process.env.SEED_PRESENTATION = 'true';

    const detener = async () => {
        await mongo.stop();
        process.exit(0);
    };
    process.once('SIGINT', detener);
    process.once('SIGTERM', detener);

    require('../app');
})().catch(error => {
    console.error(`No se pudo iniciar el entorno demo: ${error.message}`);
    process.exitCode = 1;
});
