'use strict';

function errorHandler(err, req, res, next) {
    console.error(err.message);

    const status = err.statusCode || 500;

    res.status(status).json({
        success: false,
        error: status === 500
            ? 'Internal server error'
            : err.message
    });
}

module.exports = errorHandler;
