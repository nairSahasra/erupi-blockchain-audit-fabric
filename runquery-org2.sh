#!/bin/sh
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH=/tmp/org2-admin-msp
CTOR=$(cat /tmp/query.json)
exec peer chaincode query -C erupi-channel -n erupi-contract -c "$CTOR"