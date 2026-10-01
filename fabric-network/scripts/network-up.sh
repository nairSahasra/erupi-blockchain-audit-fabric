#!/usr/bin/env bash
# ==============================================================================
# Start e-RUPI Hyperledger Fabric Network & Join Channel
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

CHANNEL_NAME="erupi-channel"

echo "=========================================================="
echo " Starting e-RUPI Hyperledger Fabric Network (2 Org Setup) "
echo "=========================================================="

# 1. Generate crypto & genesis block if missing
if [ ! -d "${NETWORK_DIR}/organizations/peerOrganizations" ] || [ ! -f "${NETWORK_DIR}/channel-artifacts/${CHANNEL_NAME}.block" ]; then
  echo ">>> Crypto materials or genesis block not found. Generating now..."
  bash "${SCRIPT_DIR}/generate-crypto.sh"
fi

# 2. Start all Docker containers
echo ">>> Starting Docker containers (Orderer, 2 Peers, 2 CouchDBs, CLI)..."
cd "${NETWORK_DIR}"
docker compose -f docker/docker-compose-net.yaml up -d

echo ">>> Waiting 6 seconds for Fabric services to initialize..."
sleep 6

# 3. Join Orderer to Channel via osnadmin
echo ">>> Joining Orderer to ${CHANNEL_NAME}..."
docker exec cli osnadmin channel join \
  --channelID "${CHANNEL_NAME}" \
  --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block \
  -o orderer.erupi.com:7053 \
  --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/erupi.com/orderers/orderer.erupi.com/tls/ca.crt \
  --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/erupi.com/users/Admin@erupi.com/tls/client.crt \
  --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/erupi.com/users/Admin@erupi.com/tls/client.key

echo ">>> Orderer channel list:"
docker exec cli osnadmin channel list \
  -o orderer.erupi.com:7053 \
  --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/erupi.com/orderers/orderer.erupi.com/tls/ca.crt \
  --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/erupi.com/users/Admin@erupi.com/tls/client.crt \
  --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/erupi.com/users/Admin@erupi.com/tls/client.key

# 4. Join Peer0 Org1 (Government + Bank) to Channel
echo ">>> Joining peer0.org1.erupi.com (Org1MSP) to ${CHANNEL_NAME}..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.erupi.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/peers/peer0.org1.erupi.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/users/Admin@org1.erupi.com/msp \
  cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

# 5. Join Peer0 Org2 (Merchant + Auditor) to Channel
echo ">>> Joining peer0.org2.erupi.com (Org2MSP) to ${CHANNEL_NAME}..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_ADDRESS=peer0.org2.erupi.com:9051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.erupi.com/peers/peer0.org2.erupi.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.erupi.com/users/Admin@org2.erupi.com/msp \
  cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block

# 6. Verify Channel Membership
echo ">>> Verifying Channel Membership on Org1 Peer..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.erupi.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/peers/peer0.org1.erupi.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/users/Admin@org1.erupi.com/msp \
  cli peer channel list

echo ">>> Verifying Channel Membership on Org2 Peer..."
docker exec \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_ADDRESS=peer0.org2.erupi.com:9051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.erupi.com/peers/peer0.org2.erupi.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.erupi.com/users/Admin@org2.erupi.com/msp \
  cli peer channel list

echo "=========================================================="
echo " Fabric Network and Channel Setup Successfully Completed! "
echo "=========================================================="
