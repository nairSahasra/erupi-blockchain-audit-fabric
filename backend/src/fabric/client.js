/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('fs');
const grpc = require('@grpc/grpc-js');
const { connect } = require('@hyperledger/fabric-gateway');
const config = require('../config/fabric.config');
const { createIdentity, createSigner } = require('./identity');

// Gateway and gRPC client cache per organization
const clients = {
    Org1MSP: null,
    Org2MSP: null
};

const gateways = {
    Org1MSP: null,
    Org2MSP: null
};

/**
 * Initialize a gRPC client connection to a peer
 */
async function newGrpcConnection(orgConfig) {
    if (!fs.existsSync(orgConfig.tlsCertPath)) {
        throw new Error(`Peer TLS CA certificate not found at: ${orgConfig.tlsCertPath}`);
    }
    const tlsRootCert = await fs.promises.readFile(orgConfig.tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

    return new grpc.Client(orgConfig.peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': orgConfig.peerHostOverride
    });
}

/**
 * Get or create a Gateway instance for the specified organization
 */
async function getGatewayForOrg(mspId) {
    if (gateways[mspId]) {
        return gateways[mspId];
    }

    const orgConfig = mspId === config.org1.mspId ? config.org1 : config.org2;

    const identity = await createIdentity(orgConfig.certPath, orgConfig.mspId);
    const signer = await createSigner(orgConfig.keyPath);
    const client = await newGrpcConnection(orgConfig);

    const gateway = connect({
        client,
        identity,
        signer,
        evaluateOptions: () => ({ deadline: Date.now() + 10000 }),
        endorseOptions: () => ({ deadline: Date.now() + 20000 }),
        submitOptions: () => ({ deadline: Date.now() + 20000 }),
        commitStatusOptions: () => ({ deadline: Date.now() + 60000 })
    });

    clients[mspId] = client;
    gateways[mspId] = gateway;

    return gateway;
}

/**
 * Map an application role to the appropriate Fabric Organization MSP
 */
function getMspForRole(role) {
    const normalizedRole = (role || '').toLowerCase().trim();
    if (normalizedRole === 'government' || normalizedRole === 'bank') {
        return config.org1.mspId; // Org1MSP
    }
    if (normalizedRole === 'merchant' || normalizedRole === 'auditor') {
        return config.org2.mspId; // Org2MSP
    }
    throw new Error(`Unmapped application role [${role}]. Valid roles: government, bank, merchant, auditor.`);
}

/**
 * Returns the Fabric Contract for the given application role
 */
async function getContractForRole(role) {
    const mspId = getMspForRole(role);
    const gateway = await getGatewayForOrg(mspId);
    const network = gateway.getNetwork(config.channelName);
    const contract = network.getContract(config.chaincodeName);
    return { contract, gateway, network };
}

/**
 * Check Fabric connectivity for the health endpoint
 */
async function checkConnectivity() {
    try {
        const { contract } = await getContractForRole('auditor');
        // Evaluate a lightweight query or check contract
        const resultBytes = await contract.evaluateTransaction('PaymentExists', 'HEALTH-PING');
        return {
            status: 'connected',
            channel: config.channelName,
            chaincode: config.chaincodeName,
            peer: config.org2.peerEndpoint
        };
    } catch (err) {
        return {
            status: 'error',
            error: err.message
        };
    }
}

/**
 * Closes active connections
 */
async function closeConnections() {
    for (const msp of Object.keys(gateways)) {
        if (gateways[msp]) {
            try { gateways[msp].close(); } catch (e) {}
            gateways[msp] = null;
        }
        if (clients[msp]) {
            try { clients[msp].close(); } catch (e) {}
            clients[msp] = null;
        }
    }
}

module.exports = {
    getGatewayForOrg,
    getMspForRole,
    getContractForRole,
    checkConnectivity,
    closeConnections
};
