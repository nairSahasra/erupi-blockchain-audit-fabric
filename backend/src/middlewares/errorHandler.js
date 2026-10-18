'use strict';

function errorHandler(err, req, res, next) {
    console.error(err.message);

    const status = err.statusCode || 500;

    res.status(status).json({
        success: false,
        error: err.message || 'Internal server error'
    });
}

module.exports = errorHandler;