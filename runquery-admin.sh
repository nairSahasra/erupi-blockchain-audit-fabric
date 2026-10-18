#!/bin/sh
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/tmp/org1-admin-msp
CTOR=$(cat /tmp/query.json)
exec peer chaincode query -C erupi-channel -n erupi-contract -c "$CTOR"