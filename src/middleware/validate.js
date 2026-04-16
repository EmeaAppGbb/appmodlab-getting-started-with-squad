const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,      // Report all errors, not just the first
      stripUnknown: true,      // Remove fields not in the schema
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          details,
        },
      });
    }

    req.body = value; // Use sanitized/trimmed values
    next();
  };
};

module.exports = validate;
