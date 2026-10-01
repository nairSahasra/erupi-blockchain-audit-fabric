/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const PaymentState = Object.freeze({
    ISSUED: 'ISSUED',
    VERIFIED: 'VERIFIED',
    REDEEMED: 'REDEEMED',
    SETTLED: 'SETTLED'
});

class PaymentRecord {
    /**
     * Factory to instantiate a new payment audit record
     */
    static createInstance(paymentId, purpose, amount, issuer, beneficiaryRef, merchantId, merchantName, expiryDate, notes, txId, timestamp) {
        if (!paymentId || paymentId.trim() === '') {
            throw new Error('Payment ID cannot be empty');
        }
        if (isNaN(amount) || Number(amount) <= 0) {
            throw new Error(`Invalid voucher amount: ${amount}. Amount must be greater than zero.`);
        }

        return {
            docType: 'paymentRecord',
            paymentId: paymentId.trim(),
            purpose: purpose ? purpose.trim() : 'General',
            amount: Number(amount),
            currency: 'INR',
            issuer: issuer ? issuer.trim() : 'Government Sponsor',
            beneficiaryRef: beneficiaryRef ? beneficiaryRef.trim() : 'BEN-ANONYMIZED',
            merchantId: merchantId ? merchantId.trim() : 'UNASSIGNED',
            merchantName: merchantName ? merchantName.trim() : 'General Retailer',
            status: PaymentState.ISSUED,
            createdAt: timestamp,
            verifiedAt: null,
            redeemedAt: null,
            settledAt: null,
            expiryDate: expiryDate ? expiryDate.trim() : null,
            txHistory: {
                issueTxId: txId,
                verifyTxId: null,
                redeemTxId: null,
                settleTxId: null
            },
            notes: notes ? notes.trim() : 'e-RUPI audit trail initialized'
        };
    }

    /**
     * Enforce valid lifecycle state transitions
     */
    static validateTransition(currentStatus, targetStatus) {
        const allowedTransitions = {
            [PaymentState.ISSUED]: [PaymentState.VERIFIED],
            [PaymentState.VERIFIED]: [PaymentState.REDEEMED],
            [PaymentState.REDEEMED]: [PaymentState.SETTLED],
            [PaymentState.SETTLED]: [] // Terminal state
        };

        const validTargets = allowedTransitions[currentStatus] || [];
        if (!validTargets.includes(targetStatus)) {
            throw new Error(
                `Illegal State Transition: Cannot transition payment from [${currentStatus}] to [${targetStatus}]. ` +
                `Valid lifecycle sequence is: ISSUED -> VERIFIED -> REDEEMED -> SETTLED.`
            );
        }
    }
}

module.exports = {
    PaymentState,
    PaymentRecord
};
