const { AppError } = require('../errors');

const errorHandler = (err, req, res, next) => {
  // Log all errors (stack trace only for unexpected errors)
  if (err instanceof AppError) {
    console.error(`[${err.name}] ${err.message}`);
  } else {
    console.error('[UnhandledError]', err.stack);
  }

  // Known operational errors
  if (err instanceof AppError) {
    const response = {
      error: {
        status: err.status,
        message: err.message,
      },
    };
    // Attach details if present (e.g., validation errors)
    if (err.details) {
      response.error.details = err.details;
    }
    return res.status(err.status).json(response);
  }

  // Handle JSON parse errors from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Invalid JSON in request body',
      },
    });
  }

  // Unknown/unexpected errors — don't leak internals
  res.status(500).json({
    error: {
      status: 500,
      message: 'Internal server error',
    },
  });
};

module.exports = errorHandler;
