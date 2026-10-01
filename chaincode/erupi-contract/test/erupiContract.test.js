/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const ErupiContract = require('../lib/erupiContract');
const { PaymentState } = require('../lib/paymentRecord');
const MockContext = require('./mockContext');

describe('ErupiContract Unit Tests', () => {
    let contract;
    let ctx;

    beforeEach(() => {
        contract = new ErupiContract();
        ctx = new MockContext();
    });

    describe('#InitLedger', () => {
        it('should initialize ledger with demo payments', async () => {
            const res = await contract.InitLedger(ctx);
            const parsed = JSON.parse(res);
            expect(parsed.count).to.equal(2);

            const p1 = await contract.GetPayment(ctx, 'ERUPI-2026-0001');
            const data1 = JSON.parse(p1);
            expect(data1.status).to.equal(PaymentState.ISSUED);
            expect(data1.amount).to.equal(2500);
        });
    });

    describe('#CreatePayment', () => {
        it('should successfully create a new payment in ISSUED state', async () => {
            const res = await contract.CreatePayment(
                ctx,
                'PAY-TEST-001',
                'Vaccination Program',
                '750',
                'Ministry of Health',
                'BEN-REF-101',
                'MERCHANT-HOSP-55',
                'City Care Hospital',
                '2026-12-31',
                'Round 1 voucher'
            );

            const payment = JSON.parse(res);
            expect(payment.paymentId).to.equal('PAY-TEST-001');
            expect(payment.status).to.equal(PaymentState.ISSUED);
            expect(payment.amount).to.equal(750);
            expect(payment.txHistory.issueTxId).to.equal('mock-txid-12345');
        });

        it('should reject creation of duplicate payment ID', async () => {
            await contract.CreatePayment(
                ctx,
                'PAY-DUP-001',
                'Health Scheme',
                '500',
                'Gov',
                'BEN-1',
                'MER-1',
                'Shop',
                '2026-12-31',
                'Notes'
            );

            await expect(
                contract.CreatePayment(
                    ctx,
                    'PAY-DUP-001',
                    'Health Scheme',
                    '500',
                    'Gov',
                    'BEN-1',
                    'MER-1',
                    'Shop',
                    '2026-12-31',
                    'Notes'
                )
            ).to.be.rejectedWith(/already exists/);
        });
    });

    describe('Lifecycle Progression: ISSUED -> VERIFIED -> REDEEMED -> SETTLED', () => {
        beforeEach(async () => {
            await contract.CreatePayment(
                ctx,
                'PAY-FLOW-001',
                'Fertilizer Voucher',
                '2000',
                'Ministry of Agri',
                'BEN-FARMER-99',
                'MERCHANT-AGRI-01',
                'Agri Center',
                '2026-12-31',
                'Initial voucher'
            );
        });

        it('should successfully progress through entire valid lifecycle', async () => {
            // 1. Verify Payment (Bank)
            const verifyRes = await contract.VerifyPayment(ctx, 'PAY-FLOW-001', 'REF-SBI-100', 'Verified by Bank');
            const verified = JSON.parse(verifyRes);
            expect(verified.status).to.equal(PaymentState.VERIFIED);
            expect(verified.verifiedAt).to.not.be.null;

            // 2. Redeem Payment (Merchant)
            const redeemRes = await contract.RedeemPayment(ctx, 'PAY-FLOW-001', 'MERCHANT-AGRI-01', 'Terminal 1');
            const redeemed = JSON.parse(redeemRes);
            expect(redeemed.status).to.equal(PaymentState.REDEEMED);
            expect(redeemed.redeemedAt).to.not.be.null;

            // 3. Settle Payment (Bank)
            const settleRes = await contract.SettlePayment(ctx, 'PAY-FLOW-001', 'NEFT-BATCH-999');
            const settled = JSON.parse(settleRes);
            expect(settled.status).to.equal(PaymentState.SETTLED);
            expect(settled.settledAt).to.not.be.null;
        });

        it('should reject out-of-order transition (Redeem before Verify)', async () => {
            await expect(
                contract.RedeemPayment(ctx, 'PAY-FLOW-001', 'MERCHANT-AGRI-01', 'Terminal 1')
            ).to.be.rejectedWith(/Illegal State Transition/);
        });

        it('should reject out-of-order transition (Settle before Redeem)', async () => {
            await contract.VerifyPayment(ctx, 'PAY-FLOW-001', 'REF-1', 'OK');
            await expect(
                contract.SettlePayment(ctx, 'PAY-FLOW-001', 'BATCH-1')
            ).to.be.rejectedWith(/Illegal State Transition/);
        });

        it('should reject redemption by unauthorized merchant', async () => {
            await contract.VerifyPayment(ctx, 'PAY-FLOW-001', 'REF-1', 'OK');
            await expect(
                contract.RedeemPayment(ctx, 'PAY-FLOW-001', 'WRONG-MERCHANT', 'Terminal 1')
            ).to.be.rejectedWith(/Unauthorized Merchant/);
        });
    });

    describe('#GetPaymentHistory', () => {
        it('should retrieve full transaction provenance for a voucher', async () => {
            await contract.CreatePayment(
                ctx,
                'PAY-HIST-001',
                'Solar Subsidy',
                '5000',
                'MNRE',
                'BEN-SOLAR-01',
                'MER-SOLAR-01',
                'Solar Store',
                '2026-12-31',
                'Genesis'
            );

            await contract.VerifyPayment(ctx, 'PAY-HIST-001', 'REF-BANK', 'Approved');

            const historyRes = await contract.GetPaymentHistory(ctx, 'PAY-HIST-001');
            const history = JSON.parse(historyRes);

            expect(history).to.be.an('array');
            expect(history.length).to.equal(2);
            expect(history[0].record.status).to.equal(PaymentState.ISSUED);
            expect(history[1].record.status).to.equal(PaymentState.VERIFIED);
        });
    });
});
