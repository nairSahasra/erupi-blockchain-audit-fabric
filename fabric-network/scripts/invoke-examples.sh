#!/usr/bin/env bash
# ==============================================================================
# Sample Peer CLI Invocations & Queries for e-RUPI Audit Layer
# ==============================================================================
set -euo pipefail

CHANNEL_NAME="erupi-channel"
CC_NAME="erupi-contract"

ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/erupi.com/orderers/orderer.erupi.com/tls/ca.crt"
ORG1_PEER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.erupi.com/peers/peer0.org1.erupi.com/tls/ca.crt"
ORG2_PEER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.erupi.com/peers/peer0.org2.erupi.com/tls/ca.crt"

echo "=========================================================="
echo " 1. Querying Sample Seeded Payment (ERUPI-2026-0001)       "
echo "=========================================================="
docker exec cli peer chaincode query \
  -C ${CHANNEL_NAME} \
  -n ${CC_NAME} \
  -c '{"function":"GetPayment","Args":["ERUPI-2026-0001"]}'

echo -e "\n=========================================================="
echo " 2. Creating New Voucher: ERUPI-DEMO-999                  "
echo "=========================================================="
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
    -c '{"function":"CreatePayment","Args":["ERUPI-DEMO-999","Education Grant","15000","Dept of Higher Ed","BENEFICIARY-STU-456","MERCHANT-BOOKSTORE-10","National Book Trust","2026-12-31","College text subsidy"]}' \
    --waitForEvent

echo -e "\n=========================================================="
echo " 3. Bank Verifies Voucher: ERUPI-DEMO-999                 "
echo "=========================================================="
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
    -c '{"function":"VerifyPayment","Args":["ERUPI-DEMO-999","SBI-VERIFY-REF-888","Eligibility verified by issuing bank"]}' \
    --waitForEvent

echo -e "\n=========================================================="
echo " 4. Merchant Redeems Voucher: ERUPI-DEMO-999              "
echo "=========================================================="
docker exec \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_ADDRESS=peer0.org2.erupi.com:9051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_PEER_CA} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.erupi.com/users/Admin@org2.erupi.com/msp \
  cli peer chaincode invoke -o orderer.erupi.com:7050 \
    --ordererTLSHostnameOverride orderer.erupi.com \
    --tls --cafile ${ORDERER_CA} \
    -C ${CHANNEL_NAME} \
    -n ${CC_NAME} \
    --peerAddresses peer0.org1.erupi.com:7051 --tlsRootCertFiles ${ORG1_PEER_CA} \
    --peerAddresses peer0.org2.erupi.com:9051 --tlsRootCertFiles ${ORG2_PEER_CA} \
    -c '{"function":"RedeemPayment","Args":["ERUPI-DEMO-999","MERCHANT-BOOKSTORE-10","POS Terminal 42, Delhi Outlet"]}' \
    --waitForEvent

echo -e "\n=========================================================="
echo " 5. Bank Settles Voucher: ERUPI-DEMO-999                  "
echo "=========================================================="
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
    -c '{"function":"SettlePayment","Args":["ERUPI-DEMO-999","SETTLE-NEFT-BATCH-777123"]}' \
    --waitForEvent

echo -e "\n=========================================================="
echo " 6. Querying Complete Provenance History (Fabric TxIDs)   "
echo "=========================================================="
docker exec cli peer chaincode query \
  -C ${CHANNEL_NAME} \
  -n ${CC_NAME} \
  -c '{"function":"GetPaymentHistory","Args":["ERUPI-DEMO-999"]}'

echo -e "\n=========================================================="
echo " 7. Querying Payments by Status: SETTLED (CouchDB)        "
echo "=========================================================="
docker exec cli peer chaincode query \
  -C ${CHANNEL_NAME} \
  -n ${CC_NAME} \
  -c '{"function":"QueryByStatus","Args":["SETTLED"]}'
