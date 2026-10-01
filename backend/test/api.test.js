'use strict';

const request = require('supertest');
const { expect } = require('chai');

const app = require('../src/app');

describe('e-RUPI Backend API', function () {

    describe('Health endpoint', function () {

        it('should return API health status', async function () {
            const response = await request(app)
                .get('/api/health');

            expect(response.status).to.equal(200);
            expect(response.body.success).to.equal(true);
            expect(response.body.status).to.equal('ok');
        });

    });

    describe('Role authorization', function () {

        it('should reject requests without X-Role', async function () {
            const response = await request(app)
                .get('/api/payments/ERUPI-2026-0001');

            expect(response.status).to.equal(401);
            expect(response.body.success).to.equal(false);
            expect(response.body.error).to.equal('X-Role header is required');
        });

        it('should reject an invalid role', async function () {
            const response = await request(app)
                .get('/api/payments/ERUPI-2026-0001')
                .set('X-Role', 'admin');

            expect(response.status).to.equal(403);
            expect(response.body.success).to.equal(false);
            expect(response.body.error).to.equal('Invalid role');
        });

        it('should reject merchant from verifying a payment', async function () {
            const response = await request(app)
                .put('/api/payments/ERUPI-2026-0001/verify')
                .set('X-Role', 'merchant')
                .send({
                    bankRef: 'TEST-BANK-001',
                    remarks: 'Unauthorized test'
                });

            expect(response.status).to.equal(403);
            expect(response.body.success).to.equal(false);
            expect(response.body.error)
                .to.equal('Role is not authorized for this operation');
        });

    });

    describe('Payment read operations', function () {

        it('should allow auditor to read an existing payment', async function () {
            const response = await request(app)
                .get('/api/payments/ERUPI-2026-0001')
                .set('X-Role', 'auditor');

            expect(response.status).to.equal(200);
            expect(response.body.success).to.equal(true);
            expect(response.body.data).to.have.property('paymentId');
        });

        it('should allow auditor to read payment history', async function () {
            const response = await request(app)
                .get('/api/payments/ERUPI-2026-0001/history')
                .set('X-Role', 'auditor');

            expect(response.status).to.equal(200);
            expect(response.body.success).to.equal(true);
            expect(response.body.data).to.be.an('array');
        });

        it('should allow auditor to query payments by status', async function () {
            const response = await request(app)
                .get('/api/payments?status=REDEEMED')
                .set('X-Role', 'auditor');

            expect(response.status).to.equal(200);
            expect(response.body.success).to.equal(true);
            expect(response.body.data).to.be.an('array');
        });

    });

});
