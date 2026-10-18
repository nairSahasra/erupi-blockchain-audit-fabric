#!/bin/sh
export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp
CTOR=$(cat /tmp/query.json)
exec peer chaincode query -C erupi-channel -n erupi-contract -c "$CTOR"