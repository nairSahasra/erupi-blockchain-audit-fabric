/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('fs');
const crypto = require('crypto');
const { signers } = require('@hyperledger/fabric-gateway');

/**
 * Creates an X.509 Identity object from certificate PEM file
 */
async function createIdentity(certPath, mspId) {
    if (!fs.existsSync(certPath)) {
        throw new Error(`Certificate file not found at: ${certPath}`);
    }
    const credentials = await fs.promises.readFile(certPath);
    return { mspId, credentials };
}

/**
 * Creates a digital signature provider from private key file
 */
async function createSigner(keyPath) {
    if (!fs.existsSync(keyPath)) {
        throw new Error(`Private key file not found at: ${keyPath}`);
    }
    const privateKeyPem = await fs.promises.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

module.exports = {
    createIdentity,
    createSigner
};
