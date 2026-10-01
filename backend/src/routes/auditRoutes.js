'use strict';

const express = require('express');
const router = express.Router();

const { requireRole } = require('../middlewares/roleAuth');
const { queryByStatus } = require('../controllers/auditController');

router.get(
    '/payments',
    requireRole('government', 'bank', 'auditor'),
    queryByStatus
);

module.exports = router;
