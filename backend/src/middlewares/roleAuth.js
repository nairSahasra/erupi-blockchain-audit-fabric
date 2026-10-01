'use strict';

const ROLE_ORG = {
    government: 'Org1MSP',
    bank: 'Org1MSP',
    merchant: 'Org2MSP',
    auditor: 'Org2MSP'
};

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const role = String(req.header('X-Role') || '').toLowerCase();

        if (!role) {
            return res.status(401).json({
                success: false,
                error: 'X-Role header is required'
            });
        }

        if (!ROLE_ORG[role]) {
            return res.status(403).json({
                success: false,
                error: 'Invalid role'
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                error: 'Role is not authorized for this operation'
            });
        }

        req.userRole = role;
        req.mspId = ROLE_ORG[role];

        next();
    };
}

module.exports = {
    ROLE_ORG,
    requireRole
};
