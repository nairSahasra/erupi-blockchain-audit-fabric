
'use strict';

const express = require('express');
const router = express.Router();

const {
    requireRole
} = require('../middlewares/roleAuth');

const {
    createPayment,
    getPayment,
    verifyPayment,
    redeemPayment,
    settlePayment
} = require('../controllers/paymentController');

const {
    getPaymentHistory,
    queryByStatus
} = require('../controllers/auditController');

router.post(
    '/',
    requireRole('government'),
    createPayment
);

router.get(
    '/',
    requireRole('government', 'bank', 'auditor'),
    queryByStatus
);

router.get(
    '/:id',
    requireRole('government', 'bank', 'merchant', 'auditor'),
    getPayment
);

router.put(
    '/:id/verify',
    requireRole('bank'),
    verifyPayment
);

router.put(
    '/:id/redeem',
    requireRole('merchant'),
    redeemPayment
);

router.put(
    '/:id/settle',
    requireRole('bank'),
    settlePayment
);

router.get(
    '/:id/history',
    requireRole('government', 'bank', 'merchant', 'auditor'),
    getPaymentHistory
);

module.exports = router;

