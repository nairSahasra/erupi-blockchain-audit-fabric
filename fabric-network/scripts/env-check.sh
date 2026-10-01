#!/usr/bin/env bash
# ==============================================================================
# Environment Check for e-RUPI Hyperledger Fabric Prototype
# ==============================================================================
set -e

echo "=========================================================="
echo " Running Pre-Flight Environment Checks                    "
echo "=========================================================="

# Check 1: Docker
echo -n "[1/4] Checking Docker Engine... "
if docker info > /dev/null 2>&1; then
  echo "OK ($(docker --version))"
else
  echo "FAILED!"
  echo "Error: Docker daemon is not running or not accessible."
  exit 1
fi

# Check 2: Docker Compose
echo -n "[2/4] Checking Docker Compose... "
if docker compose version > /dev/null 2>&1; then
  echo "OK ($(docker compose version))"
else
  echo "FAILED!"
  echo "Error: docker compose plugin is not available."
  exit 1
fi

# Check 3: Node.js (needed for backend and chaincode testing)
echo -n "[3/4] Checking Node.js... "
if command -v node > /dev/null 2>&1; then
  echo "OK ($(node -v))"
else
  echo "WARNING: Node.js not in PATH inside current shell environment."
fi

# Check 4: Git LF Line Endings Check
echo -n "[4/4] Checking Line Endings (.gitattributes)... "
if [ -f "$(dirname "${BASH_SOURCE[0]}")/../../.gitattributes" ]; then
  echo "OK (.gitattributes configured)"
else
  echo "WARNING: .gitattributes missing."
fi

echo "=========================================================="
echo " Environment is Ready for Fabric Network Deployment!     "
echo "=========================================================="
