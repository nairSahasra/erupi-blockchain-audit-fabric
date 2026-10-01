#!/usr/bin/env bash
# ==============================================================================
# Stop and Teardown e-RUPI Hyperledger Fabric Network
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=========================================================="
echo " Stopping e-RUPI Hyperledger Fabric Network               "
echo "=========================================================="

cd "${NETWORK_DIR}"

echo ">>> Stopping Docker containers and removing volumes..."
docker compose -f docker/docker-compose-net.yaml down --volumes --remove-orphans || true

# Clean up any leftover chaincode dev containers
CONTAINERS=$(docker ps -a --filter "name=dev-peer*" -q || true)
if [ -n "${CONTAINERS}" ]; then
  echo ">>> Removing chaincode containers..."
  docker rm -f ${CONTAINERS} || true
fi

# Clean up leftover chaincode images
IMAGES=$(docker images "dev-peer*" -q || true)
if [ -n "${IMAGES}" ]; then
  echo ">>> Removing chaincode images..."
  docker rmi -f ${IMAGES} || true
fi

# Clean generated artifacts
echo ">>> Cleaning generated channel artifacts and crypto material..."
rm -rf "${NETWORK_DIR}/channel-artifacts"/*
rm -rf "${NETWORK_DIR}/organizations/peerOrganizations"
rm -rf "${NETWORK_DIR}/organizations/ordererOrganizations"

echo "=========================================================="
echo " Network Teardown Complete                                "
echo "=========================================================="
