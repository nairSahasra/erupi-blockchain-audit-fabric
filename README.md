# e-RUPI Blockchain Audit & Verification Layer

A permissioned blockchain-based audit and verification framework for tracking the e-RUPI payment lifecycle using Hyperledger Fabric.

## 1. Project Overview

This project implements a permissioned blockchain-based audit layer for e-RUPI transactions.

The system does **not replace the existing e-RUPI payment infrastructure**. Instead, it provides an additional audit and verification layer for recording important payment lifecycle events on a tamper-evident distributed ledger.

The system tracks:

- Payment issuance
- Payment verification
- Payment redemption
- Payment settlement
- Complete transaction history

The objective is to provide authorized stakeholders with a traceable, auditable, and tamper-evident record of payment lifecycle events.

## 2. Architecture

The system consists of four main stakeholder roles:

- Government / Sponsor
- Bank
- Merchant
- Auditor

### Application Flow


Frontend
   ↓
Express REST API
   ↓
Hyperledger Fabric Gateway
   ↓
Fabric Network
   ↓
Smart Contract / Chaincode
   ↓
Distributed Ledger


### Stakeholder Organization Mapping

The Fabric network uses two organizations:

Org1
├── Government / Sponsor
└── Bank

Org2
├── Merchant
└── Auditor

Government and Bank are represented as application roles within Org1, while Merchant and Auditor are represented as application roles within Org2.

### Fabric Configuration

**Channel:**


erupi-channel


**Chaincode:**


erupi-contract


## 3. Technology Stack

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Node.js
- Express.js
- REST API
- Hyperledger Fabric Gateway
- Mocha
- Chai
- Supertest

### Blockchain

- Hyperledger Fabric 2.5
- Fabric Gateway
- Fabric Chaincode
- CouchDB
- Docker

## 4. Payment Lifecycle

Each payment follows the controlled lifecycle:


ISSUED
   ↓
VERIFIED
   ↓
REDEEMED
   ↓
SETTLED


The smart contract enforces valid state transitions.

Each major lifecycle operation creates a corresponding blockchain transaction.

The payment record maintains transaction references for:

- Issue transaction
- Verification transaction
- Redemption transaction
- Settlement transaction

This allows authorized users, particularly auditors, to retrieve the historical state of a payment and its associated transaction IDs.

## 5. Role-Based Authorization

The backend uses the `X-Role` HTTP header to identify the application role.

Supported roles:

| Role | Organization | Main Operations |
|------|--------------|-----------------|
| Government | Org1MSP | Create payments |
| Bank | Org1MSP | Verify and settle payments |
| Merchant | Org2MSP | Redeem payments |
| Auditor | Org2MSP | Read payments and audit history |

Unauthorized operations are rejected by the backend.

Examples:

- Merchant cannot verify a payment.
- Auditor cannot create a payment.
- Invalid roles are rejected.
- Requests without the `X-Role` header are rejected.

## 6. REST API

### Health Check


GET /api/health


Checks the connectivity between the backend and Hyperledger Fabric.

### Payment Endpoints

| Method | Endpoint | Authorized Role |
|--------|----------|-----------------|
| POST | `/api/payments` | Government |
| GET | `/api/payments/:id` | All roles |
| PUT | `/api/payments/:id/verify` | Bank |
| PUT | `/api/payments/:id/redeem` | Merchant |
| PUT | `/api/payments/:id/settle` | Bank |
| GET | `/api/payments/:id/history` | All roles |
| GET | `/api/audit/payments?status=...` | Government / Bank / Auditor |

## 7. Data Input

The system supports dynamic payment data entry through the frontend dashboard.

When the Government role issues a payment, the user can enter:

- Payment ID
- Purpose
- Amount
- Issuer
- Beneficiary Reference
- Merchant ID
- Merchant Name
- Expiry Date
- Notes

The frontend sends the entered information to the backend through:


POST /api/payments


The backend then submits the payment information to the Hyperledger Fabric smart contract.

Therefore, payment records do not have to be hardcoded.

### Demo Data

The chaincode also contains predefined demo records through the `InitLedger` function.

These records are used for:

- Testing
- Demonstration
- Initial ledger verification

For example:


ERUPI-2026-0001


is a predefined demonstration payment.

## 8. Testing

### Backend API Testing

The backend API was tested using:

- Mocha
- Chai
- Supertest

Tested scenarios include:

- Health endpoint
- Missing role rejection
- Invalid role rejection
- Unauthorized operations
- Payment retrieval
- Payment history
- Status-based queries

**Backend test result:**


7 passing


### Chaincode Unit Testing

The Hyperledger Fabric chaincode was tested using Mocha and Chai.

Tested scenarios include:

- Ledger initialization
- Payment creation
- Duplicate payment rejection
- Complete payment lifecycle
- Invalid lifecycle transitions
- Unauthorized merchant redemption
- Payment history retrieval

**Chaincode test result:**


8 passing


### Complete Lifecycle Test

The complete payment lifecycle was successfully tested:


ISSUED → VERIFIED → REDEEMED → SETTLED

## 9. Frontend Dashboard

The project includes a web-based dashboard for interacting with the REST API.

The dashboard supports:

- Role selection
- Payment data entry
- Payment issuance
- Payment verification
- Payment redemption
- Payment settlement
- Payment lookup
- Payment history
- Lifecycle status tracking

### Local Frontend


http://localhost:5500


### Local Backend


http://localhost:3001


The frontend communicates with the backend through the REST API.

## 10. Running the Project

### Prerequisites

Ensure the following are available:

- Node.js
- npm
- Docker Desktop
- Hyperledger Fabric binaries and images
- Python (for the local frontend server)

### Start Fabric Network

Start the Fabric network using the project's Fabric network configuration and ensure Docker Desktop is running.

### Start Backend

From the project root:

cd backend
npm install
npm start


The backend runs on:


http://localhost:3001


### Start Frontend

From the project root:


python -m http.server 5500 --directory frontend


Then open:


http://localhost:5500


## 11. Project Structure


erupi-blockchain-audit-fabric/
│
├── backend/
│   ├── src/
│   └── test/
│
├── chaincode/
│   └── erupi-contract/
│       ├── lib/
│       └── test/
│
├── fabric-network/
│   ├── organizations/
│   ├── config/
│   └── ...
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── .gitattributes
├── .gitignore
└── README.md


## 12. Project Objective

The project provides a permissioned blockchain audit and verification layer for tracking e-RUPI payment lifecycle events.

The main objectives are:

- Traceability
- Auditability
- Role-based access control
- Lifecycle verification
- Tamper-evident records
- Transaction-level history
- Multi-stakeholder auditability

## 13. Current Implementation Status

The core implementation has been tested successfully.

| Component | Status |
|-----------|--------|
| Hyperledger Fabric Network | Complete |
| Fabric Channel | Complete |
| Chaincode | Complete |
| CouchDB | Complete |
| Backend REST API | Complete |
| Role-Based Authorization | Complete |
| Frontend Dashboard | Complete |
| Payment Lifecycle | Complete |
| Payment History | Complete |
| Backend API Tests | 7 passing |
| Chaincode Unit Tests | 8 passing |

The project currently operates as a local demonstration and development environment.

A future deployment can expose the frontend and backend through public URLs and host the Fabric network on a cloud environment.
