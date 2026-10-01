'use strict';

const { getContractForRole } = require('../fabric/client');

function parseResult(bytes) {
    const text = Buffer.from(bytes).toString('utf8');
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function fabricError(err) {
    const message = err?.message || String(err);

    const details = Array.isArray(err?.details)
        ? err.details
            .map(detail => detail?.message || String(detail))
            .join(' ')
        : '';

    const combinedMessage = `${message} ${details}`;

    if (/already exists|Conflict/i.test(combinedMessage)) {
        const e = new Error('Payment record already exists');
        e.statusCode = 409;
        return e;
    }

    if (/not found|does not exist/i.test(combinedMessage)) {
        const e = new Error(message);
        e.statusCode = 404;
        return e;
    }

    if (/unauthorized|forbidden|locked to merchant/i.test(combinedMessage)) {
        const e = new Error(message);
        e.statusCode = 403;
        return e;
    }

    return err;
}

async function createPayment(req, res, next) {
    try {
        const {
            paymentId,
            purpose,
            amount,
            issuer,
            beneficiaryRef,
            merchantId,
            merchantName,
            expiryDate,
            notes
        } = req.body;

        if (!paymentId || !purpose || !amount || !issuer ||
            !beneficiaryRef || !merchantId || !merchantName || !expiryDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required payment fields'
            });
        }

        const { contract } = await getContractForRole(req.userRole);

        const result = await contract.submitTransaction(
            'CreatePayment',
            String(paymentId),
            String(purpose),
            String(amount),
            String(issuer),
            String(beneficiaryRef),
            String(merchantId),
            String(merchantName),
            String(expiryDate),
            String(notes || '')
        );

        return res.status(201).json({
            success: true,
            data: parseResult(result)
        });
    } catch (err) {
        next(fabricError(err));
    }
}

async function getPayment(req, res, next) {
    try {
        const { contract } = await getContractForRole(req.userRole);

        const result = await contract.evaluateTransaction(
            'GetPayment',
            req.params.id
        );

        return res.json({
            success: true,
            data: parseResult(result)
        });
    } catch (err) {
        next(fabricError(err));
    }
}

async function verifyPayment(req, res, next) {
    try {
        const { bankRef, remarks } = req.body;

        if (!bankRef) {
            return res.status(400).json({
                success: false,
                error: 'bankRef is required'
            });
        }

        const { contract } = await getContractForRole(req.userRole);

        const result = await contract.submitTransaction(
            'VerifyPayment',
            req.params.id,
            String(bankRef),
            String(remarks || '')
        );

        return res.json({
            success: true,
            data: parseResult(result)
        });
    } catch (err) {
        next(fabricError(err));
    }
}

async function redeemPayment(req, res, next) {
    try {
        const { merchantId, locationRef } = req.body;

        if (!merchantId) {
            return res.status(400).json({
                success: false,
                error: 'merchantId is required'
            });
        }

        const { contract } = await getContractForRole(req.userRole);

        const result = await contract.submitTransaction(
            'RedeemPayment',
            req.params.id,
            String(merchantId),
            String(locationRef || '')
        );

        return res.json({
            success: true,
            data: parseResult(result)
        });
    } catch (err) {
        next(fabricError(err));
    }
}

async function settlePayment(req, res, next) {
    try {
        const { bankSettlementRef } = req.body;

        if (!bankSettlementRef) {
            return res.status(400).json({
                success: false,
                error: 'bankSettlementRef is required'
            });
        }

        const { contract } = await getContractForRole(req.userRole);

        const result = await contract.submitTransaction(
            'SettlePayment',
            req.params.id,
            String(bankSettlementRef)
        );

        return res.json({
            success: true,
            data: parseResult(result)
        });
    } catch (err) {
        next(fabricError(err));
    }
}

module.exports = {
    createPayment,
    getPayment,
    verifyPayment,
    redeemPayment,
    settlePayment
};
