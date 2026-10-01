\# e-RUPI Blockchain Audit \& Verification Layer



A permissioned blockchain-based audit and verification framework for e-RUPI payment lifecycle tracking using Hyperledger Fabric.



\## 1. Project Overview



This project implements a blockchain-based audit layer for e-RUPI transactions.



The system does not replace the existing e-RUPI payment infrastructure. Instead, it provides a permissioned ledger for recording and verifying important lifecycle events:



\- Payment issuance

\- Payment verification

\- Payment redemption

\- Payment settlement

\- Complete transaction history



The objective is to provide a tamper-evident and auditable record of payment lifecycle events across authorized stakeholders.



\## 2. Architecture



The system consists of four main stakeholder roles:



\- Government / Sponsor

\- Bank

\- Merchant

\- Auditor



Application flow:



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



The Fabric network contains:



\- Org1

&#x20; - Government

&#x20; - Bank

\- Org2

&#x20; - Merchant

&#x20; - Auditor



The blockchain channel is:



`erupi-channel`



The deployed chaincode is:



`erupi-contract`



\## 3. Technology Stack



\### Frontend



\- HTML

\- CSS

\- JavaScript



\### Backend



\- Node.js

\- Express.js

\- REST API

\- Supertest

\- Mocha

\- Chai



\### Blockchain



\- Hyperledger Fabric 2.5

\- Fabric Gateway

\- Fabric Chaincode

\- CouchDB

\- Docker



\## 4. Payment Lifecycle



The payment follows the lifecycle:



ISSUED

↓

VERIFIED

↓

REDEEMED

↓

SETTLED



Each state transition creates a blockchain transaction.



The payment record maintains transaction references for:



\- Issue transaction

\- Verification transaction

\- Redemption transaction

\- Settlement transaction



This allows auditors to retrieve the historical state of a payment and its associated transaction IDs.



\## 5. Role-Based Authorization



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



\- Merchant cannot verify a payment.

\- Auditor cannot create a payment.

\- Invalid roles are rejected.

\- Requests without `X-Role` are rejected.



\## 6. REST API



\### Health Check





GET /api/health

Checks the connectivity between the backend and Hyperledger Fabric.

### Main Endpoints

| Method | Endpoint                         | Role                        |
| ------ | -------------------------------- | --------------------------- |
| POST   | `/api/payments`                  | Government                  |
| GET    | `/api/payments/:id`              | All roles                   |
| PUT    | `/api/payments/:id/verify`       | Bank                        |
| PUT    | `/api/payments/:id/redeem`       | Merchant                    |
| PUT    | `/api/payments/:id/settle`       | Bank                        |
| GET    | `/api/payments/:id/history`      | All roles                   |
| GET    | `/api/audit/payments?status=...` | Government / Bank / Auditor |

## 7. Testing

The backend API was tested using Mocha, Chai and Supertest.

Tested scenarios include:

* Health endpoint
* Missing role rejection
* Invalid role rejection
* Unauthorized operations
* Payment retrieval
* Payment history
* Status-based queries

Current API test result:


7 passing


The complete payment lifecycle was also tested:


ISSUED → VERIFIED → REDEEMED → SETTLED


## 8. Frontend Dashboard

The project includes a web-based dashboard for interacting with the REST API.

It supports:

* Role selection
* Payment issuance
* Payment verification
* Payment redemption
* Payment settlement
* Payment lookup
* Payment history
* Lifecycle status tracking

Frontend:


http://localhost:5500


Backend:


http://localhost:3001


## 9. Running the Project

Start the Fabric network and ensure Docker Desktop is running.

### Backend


cd backend
npm install
npm start


### Frontend

From the project root:


python -m http.server 5500 --directory frontend


Then open:


http://localhost:5500


## 10. Project Structure


erupi-blockchain-audit-fabric/
│
├── backend/
├── chaincode/
├── fabric-network/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .gitignore
└── README.md


## 11. Project Objective

The project provides a permissioned blockchain audit layer for tracking e-RUPI payment lifecycle events.

The main goals are:

* Traceability
* Auditability
* Role-based access
* Lifecycle verification
* Tamper-evident records
* Transaction-level history

