#!/usr/bin/env bash
# ==============================================================================
# Generate Crypto Material & Channel Genesis Block for e-RUPI Fabric Network
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== [1/3] Preparing Directories ==="
mkdir -p "${NETWORK_DIR}/organizations"
mkdir -p "${NETWORK_DIR}/channel-artifacts"

# Determine Docker command (support WSL, Git Bash, and Native Linux)
DOCKER_CMD="docker"

echo "=== [2/3] Generating Cryptographic Material (cryptogen) ==="
${DOCKER_CMD} run --rm \
  -v "${NETWORK_DIR}:/workspace" \
  -w /workspace \
  hyperledger/fabric-tools:2.5 \
  cryptogen generate \
    --config=/workspace/config/crypto-config.yaml \
    --output=/workspace/organizations

echo "=== [3/3] Generating Channel Genesis Block (configtxgen) ==="
${DOCKER_CMD} run --rm \
  -v "${NETWORK_DIR}:/workspace" \
  -w /workspace \
  hyperledger/fabric-tools:2.5 \
  configtxgen \
    -profile TwoOrgsApplicationGenesis \
    -outputBlock /workspace/channel-artifacts/erupi-channel.block \
    -channelID erupi-channel \
    -configPath /workspace/config

echo "=== Crypto and Channel Genesis Generation Complete ==="
ls -la "${NETWORK_DIR}/channel-artifacts"
