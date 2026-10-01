/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resolvePath = (relativeOrAbsolutePath) => {
    if (!relativeOrAbsolutePath) return '';
    return path.isAbsolute(relativeOrAbsolutePath)
        ? relativeOrAbsolutePath
        : path.resolve(__dirname, '../../', relativeOrAbsolutePath);
};

module.exports = {
    port: parseInt(process.env.PORT || '3001', 10),
    channelName: process.env.CHANNEL_NAME || 'erupi-channel',
    chaincodeName: process.env.CHAINCODE_NAME || 'erupi-contract',

    org1: {
        mspId: process.env.ORG1_MSP_ID || 'Org1MSP',
        peerEndpoint: process.env.ORG1_PEER_ENDPOINT || 'localhost:7051',
        peerHostOverride: process.env.ORG1_PEER_HOST_OVERRIDE || 'peer0.org1.erupi.com',
        tlsCertPath: resolvePath(process.env.ORG1_TLS_CERT_PATH || '../fabric-network/organizations/peerOrganizations/org1.erupi.com/peers/peer0.org1.erupi.com/tls/ca.crt'),
        certPath: resolvePath(process.env.ORG1_CERT_PATH || '../fabric-network/organizations/peerOrganizations/org1.erupi.com/users/User1@org1.erupi.com/msp/signcerts/User1@org1.erupi.com-cert.pem'),
        keyPath: resolvePath(process.env.ORG1_KEY_PATH || '../fabric-network/organizations/peerOrganizations/org1.erupi.com/users/User1@org1.erupi.com/msp/keystore/priv_sk')
    },

    org2: {
        mspId: process.env.ORG2_MSP_ID || 'Org2MSP',
        peerEndpoint: process.env.ORG2_PEER_ENDPOINT || 'localhost:9051',
        peerHostOverride: process.env.ORG2_PEER_HOST_OVERRIDE || 'peer0.org2.erupi.com',
        tlsCertPath: resolvePath(process.env.ORG2_TLS_CERT_PATH || '../fabric-network/organizations/peerOrganizations/org2.erupi.com/peers/peer0.org2.erupi.com/tls/ca.crt'),
        certPath: resolvePath(process.env.ORG2_CERT_PATH || '../fabric-network/organizations/peerOrganizations/org2.erupi.com/users/User1@org2.erupi.com/msp/signcerts/User1@org2.erupi.com-cert.pem'),
        keyPath: resolvePath(process.env.ORG2_KEY_PATH || '../fabric-network/organizations/peerOrganizations/org2.erupi.com/users/User1@org2.erupi.com/msp/keystore/priv_sk')
    }
};
