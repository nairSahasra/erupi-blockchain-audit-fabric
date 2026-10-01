/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const { PaymentState, PaymentRecord } = require('./paymentRecord');

class ErupiContract extends Contract {

    constructor() {
        super('ErupiContract');
    }

    /**
     * Helper to extract ISO timestamp from Fabric transaction timestamp
     */
    _getTxTimestamp(ctx) {
        try {
            const txTime = ctx.stub.getTxTimestamp();
            const milliseconds = (txTime.seconds.low || txTime.seconds) * 1000;
            return new Date(milliseconds).toISOString();
        } catch (err) {
            return new Date().toISOString();
        }
    }

    /**
     * Check if paymentId already exists in ledger world state
     */
    async PaymentExists(ctx, paymentId) {
        const paymentBytes = await ctx.stub.getState(paymentId);
        return paymentBytes && paymentBytes.length > 0;
    }

    /**
     * InitLedger: Seeds demo e-RUPI vouchers to facilitate prototype demonstration
     */
    async InitLedger(ctx) {
        const timestamp = this._getTxTimestamp(ctx);
        const txId = ctx.stub.getTxID();

        const demoPayments = [
            PaymentRecord.createInstance(
                'ERUPI-2026-0001',
                'Fertilizer Subsidy Scheme',
                2500,
                'Ministry of Agriculture',
                'BEN-REF-44912',
                'MERCHANT-AGRI-101',
                'Kisan Fertilizer Depot',
                '2026-12-31',
                'Government direct fertilizer grant',
                txId,
                timestamp
            ),
            PaymentRecord.createInstance(
                'ERUPI-2026-0002',
                'Tuberculosis Nutrition Allowance',
                1000,
                'Ministry of Health',
                'BEN-REF-88319',
                'MERCHANT-MED-204',
                'Jan Aushadhi Kendra',
                '2026-11-30',
                'Nutritional support voucher',
                txId,
                timestamp
            )
        ];

        for (const payment of demoPayments) {
            await ctx.stub.putState(payment.paymentId, Buffer.from(JSON.stringify(payment)));
        }

        return JSON.stringify({ message: 'Ledger successfully initialized with sample e-RUPI vouchers', count: demoPayments.length });
    }

    /**
     * CreatePayment: Invoked by Government / Sponsor to create an audit record for an issued e-RUPI voucher
     */
    async CreatePayment(ctx, paymentId, purpose, amount, issuer, beneficiaryRef, merchantId, merchantName, expiryDate, notes) {
        const exists = await this.PaymentExists(ctx, paymentId);
        if (exists) {
            throw new Error(`Conflict: A payment record with ID [${paymentId}] already exists on the ledger.`);
        }

        const txId = ctx.stub.getTxID();
        const timestamp = this._getTxTimestamp(ctx);

        const newPayment = PaymentRecord.createInstance(
            paymentId,
            purpose,
            amount,
            issuer,
            beneficiaryRef,
            merchantId,
            merchantName,
            expiryDate,
            notes,
            txId,
            timestamp
        );

        await ctx.stub.putState(paymentId, Buffer.from(JSON.stringify(newPayment)));
        return JSON.stringify(newPayment);
    }

    /**
     * GetPayment: Retrieves current world state for a given payment ID
     */
    async GetPayment(ctx, paymentId) {
        const paymentBytes = await ctx.stub.getState(paymentId);
        if (!paymentBytes || paymentBytes.length === 0) {
            throw new Error(`Not Found: Payment record with ID [${paymentId}] does not exist on the ledger.`);
        }
        return paymentBytes.toString('utf8');
    }

    /**
     * VerifyPayment: Invoked by Bank to certify voucher validity and beneficiary eligibility
     */
    async VerifyPayment(ctx, paymentId, bankRef, remarks) {
        const paymentJson = await this.GetPayment(ctx, paymentId);
        const payment = JSON.parse(paymentJson);

        PaymentRecord.validateTransition(payment.status, PaymentState.VERIFIED);

        const txId = ctx.stub.getTxID();
        const timestamp = this._getTxTimestamp(ctx);

        payment.status = PaymentState.VERIFIED;
        payment.verifiedAt = timestamp;
        payment.txHistory.verifyTxId = txId;
        payment.notes = payment.notes + (remarks ? ` | Bank Verify: ${remarks}` : '') + (bankRef ? ` [Ref: ${bankRef}]` : '');

        await ctx.stub.putState(paymentId, Buffer.from(JSON.stringify(payment)));
        return JSON.stringify(payment);
    }

    /**
     * RedeemPayment: Invoked by Merchant when beneficiary presents voucher at POS
     */
    async RedeemPayment(ctx, paymentId, merchantId, locationRef) {
        const paymentJson = await this.GetPayment(ctx, paymentId);
        const payment = JSON.parse(paymentJson);

        PaymentRecord.validateTransition(payment.status, PaymentState.REDEEMED);

        if (payment.merchantId && payment.merchantId !== 'UNASSIGNED' && merchantId && payment.merchantId !== merchantId) {
            throw new Error(`Unauthorized Merchant: Voucher is locked to merchant [${payment.merchantId}], but redemption requested by [${merchantId}].`);
        }

        const txId = ctx.stub.getTxID();
        const timestamp = this._getTxTimestamp(ctx);

        payment.status = PaymentState.REDEEMED;
        payment.redeemedAt = timestamp;
        payment.txHistory.redeemTxId = txId;
        if (locationRef) {
            payment.notes = payment.notes + ` | Redeemed at POS: ${locationRef}`;
        }

        await ctx.stub.putState(paymentId, Buffer.from(JSON.stringify(payment)));
        return JSON.stringify(payment);
    }

    /**
     * SettlePayment: Invoked by Bank once payment settlement audit is verified
     */
    async SettlePayment(ctx, paymentId, bankSettlementRef) {
        const paymentJson = await this.GetPayment(ctx, paymentId);
        const payment = JSON.parse(paymentJson);

        PaymentRecord.validateTransition(payment.status, PaymentState.SETTLED);

        const txId = ctx.stub.getTxID();
        const timestamp = this._getTxTimestamp(ctx);

        payment.status = PaymentState.SETTLED;
        payment.settledAt = timestamp;
        payment.txHistory.settleTxId = txId;
        if (bankSettlementRef) {
            payment.notes = payment.notes + ` | Settlement Ref: ${bankSettlementRef}`;
        }

        await ctx.stub.putState(paymentId, Buffer.from(JSON.stringify(payment)));
        return JSON.stringify(payment);
    }

    /**
     * GetPaymentHistory: Returns full blockchain transaction audit trail for a voucher
     */
    async GetPaymentHistory(ctx, paymentId) {
        const exists = await this.PaymentExists(ctx, paymentId);
        if (!exists) {
            throw new Error(`Not Found: Payment record with ID [${paymentId}] does not exist on the ledger.`);
        }

        const iterator = await ctx.stub.getHistoryForKey(paymentId);
        const history = [];

        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value.toString()) {
                const jsonRecord = {};
                jsonRecord.txId = result.value.txId;
                try {
                    const seconds = result.value.timestamp.seconds.low || result.value.timestamp.seconds;
                    jsonRecord.timestamp = new Date(seconds * 1000).toISOString();
                } catch (e) {
                    jsonRecord.timestamp = new Date().toISOString();
                }
                jsonRecord.isDelete = result.value.isDelete;
                try {
                    jsonRecord.record = JSON.parse(result.value.value.toString('utf8'));
                } catch (err) {
                    jsonRecord.record = result.value.value.toString('utf8');
                }
                history.push(jsonRecord);
            }
            result = await iterator.next();
        }
        await iterator.close();

        return JSON.stringify(history);
    }

    /**
     * QueryByStatus: Rich query supported by CouchDB state database
     */
    async QueryByStatus(ctx, status) {
        const queryString = JSON.stringify({
            selector: {
                docType: 'paymentRecord',
                status: status
            }
        });

        const iterator = await ctx.stub.getQueryResult(queryString);
        const allResults = [];

        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value.toString()) {
                try {
                    allResults.push(JSON.parse(result.value.value.toString('utf8')));
                } catch (err) {
                    allResults.push(result.value.value.toString('utf8'));
                }
            }
            result = await iterator.next();
        }
        await iterator.close();

        return JSON.stringify(allResults);
    }
}

module.exports = ErupiContract;
