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

function handleError(err) {
    const message = err?.message || String(err);

    if (/not found|does not exist/i.test(message)) {
        err.statusCode = 404;
    }

    return err;
}

async function getPaymentHistory(req, res, next) {
    try {
        const { contract } = await getContractForRole(req.userRole);

        const result = await contract.evaluateTransaction(
            'GetPaymentHistory',
            req.params.id
        );

        return res.json({
            success: true,
            data: parseResult(result)
        });
    } catch (err) {
        next(handleError(err));
    }
}

async function queryByStatus(req, res, next) {
    try {
        const status = String(req.query.status || '').toUpperCase();

        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'status query parameter is required'
            });
        }

        const { contract } = await getContractForRole(req.userRole);

        const result = await contract.evaluateTransaction(
            'QueryByStatus',
            status
        );

        return res.json({
            success: true,
            data: parseResult(result)
        });
    } catch (err) {
        next(handleError(err));
    }
}

module.exports = {
    getPaymentHistory,
    queryByStatus
};
