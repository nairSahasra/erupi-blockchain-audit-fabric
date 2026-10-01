'use strict';

const app = require('./app');
const config = require('./config/fabric.config');
const { closeConnections } = require('./fabric/client');

const server = app.listen(config.port, () => {
    console.log(`e-RUPI backend running on http://localhost:${config.port}`);
});

function shutdown() {
    console.log('Shutting down backend...');

    server.close(async () => {
        await closeConnections();
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
