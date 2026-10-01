#!/usr/bin/env bash
# ==============================================================================
# Deploy e-RUPI Chaincode to Channel erupi-channel (Fabric v2.5 Lifecycle)
# ==============================================================================
set -euo pipefail

CHANNEL_NAME="erupi-channel"
CC_NAME="erupi-contract"
CC_SRC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/erupi-contract"
CC_VERSION="1.0"
CC_SEQUENCE="1"
CC_LABEL="${CC_NAME}_${CC_VERSION}"

ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/erupi.com/orderers/orderer.erupi.com/tls/ca.crt"
ORG1_PEER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/peers/peer0.org1.erupi.com/tls/ca.crt"
ORG2_PEER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.erupi.com/peers/peer0.org2.erupi.com/tls/ca.crt"

echo "=========================================================="
echo " Deploying ${CC_NAME} (v${CC_VERSION}) on ${CHANNEL_NAME} "
echo "=========================================================="

# 1. Package Chaincode
echo ">>> [1/7] Packaging chaincode (${CC_LABEL})..."
docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz \
  --path ${CC_SRC_PATH} \
  --lang node \
  --label ${CC_LABEL}

# 2. Install on Org1 Peer
echo ">>> [2/7] Installing chaincode on peer0.org1.erupi.com..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.erupi.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_PEER_CA} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/users/Admin@org1.erupi.com/msp \
  cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

# 3. Install on Org2 Peer
echo ">>> [3/7] Installing chaincode on peer0.org2.erupi.com..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_ADDRESS=peer0.org2.erupi.com:9051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_PEER_CA} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.erupi.com/users/Admin@org2.erupi.com/msp \
  cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

# 4. Extract Package ID
echo ">>> Querying installed package ID..."
PACKAGE_OUTPUT=$(docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.erupi.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_PEER_CA} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/users/Admin@org1.erupi.com/msp \
  cli peer lifecycle chaincode queryinstalled)

echo "${PACKAGE_OUTPUT}"
CC_PACKAGE_ID=$(echo "${PACKAGE_OUTPUT}" | grep -o "${CC_NAME}_${CC_VERSION}:[a-zA-Z0-9]*" | head -n 1)

if [ -z "${CC_PACKAGE_ID}" ]; then
  echo "ERROR: Failed to obtain CC_PACKAGE_ID for ${CC_LABEL}"
  exit 1
fi
echo ">>> Package ID: ${CC_PACKAGE_ID}"

# 5. Approve for Org1
echo ">>> [4/7] Approving chaincode definition for Org1MSP..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.erupi.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_PEER_CA} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/users/Admin@org1.erupi.com/msp \
  cli peer lifecycle chaincode approveformyorg -o orderer.erupi.com:7050 \
    --ordererTLSHostnameOverride orderer.erupi.com \
    --tls --cafile ${ORDERER_CA} \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --package-id ${CC_PACKAGE_ID} \
    --sequence ${CC_SEQUENCE}

# 6. Approve for Org2
echo ">>> [5/7] Approving chaincode definition for Org2MSP..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_ADDRESS=peer0.org2.erupi.com:9051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_PEER_CA} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.erupi.com/users/Admin@org2.erupi.com/msp \
  cli peer lifecycle chaincode approveformyorg -o orderer.erupi.com:7050 \
    --ordererTLSHostnameOverride orderer.erupi.com \
    --tls --cafile ${ORDERER_CA} \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --package-id ${CC_PACKAGE_ID} \
    --sequence ${CC_SEQUENCE}

# 7. Check Commit Readiness
echo ">>> Checking commit readiness..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.erupi.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_PEER_CA} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/users/Admin@org1.erupi.com/msp \
  cli peer lifecycle chaincode checkcommitreadiness \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --output json

# 8. Commit Chaincode Definition to Channel
echo ">>> [6/7] Committing chaincode definition to channel..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.erupi.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_PEER_CA} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/users/Admin@org1.erupi.com/msp \
  cli peer lifecycle chaincode commit -o orderer.erupi.com:7050 \
    --ordererTLSHostnameOverride orderer.erupi.com \
    --tls --cafile ${ORDERER_CA} \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --peerAddresses peer0.org1.erupi.com:7051 --tlsRootCertFiles ${ORG1_PEER_CA} \
    --peerAddresses peer0.org2.erupi.com:9051 --tlsRootCertFiles ${ORG2_PEER_CA}

echo ">>> Verifying committed chaincode definition..."
docker exec cli peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}

# 9. Initialize Ledger with Sample Records
echo ">>> [7/7] Invoking InitLedger to seed initial state..."
sleep 3
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.erupi.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_PEER_CA} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/users/Admin@org1.erupi.com/msp \
  cli peer chaincode invoke -o orderer.erupi.com:7050 \
    --ordererTLSHostnameOverride orderer.erupi.com \
    --tls --cafile ${ORDERER_CA} \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    --peerAddresses peer0.org1.erupi.com:7051 --tlsRootCertFiles ${ORG1_PEER_CA} \
    --peerAddresses peer0.org2.erupi.com:9051 --tlsRootCertFiles ${ORG2_PEER_CA} \
    -c '{"function":"InitLedger","Args":[]}' \
    --waitForEvent

echo "=========================================================="
echo " Chaincode ${CC_NAME} Deployed & Initialized Successfully! "
echo "=========================================================="
