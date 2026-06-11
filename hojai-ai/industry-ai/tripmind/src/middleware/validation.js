const { ValidationError } = require('../utils/errors');

const validate = (schema) => {
  return (req, res, next) => {
    const dataToValidate = {
      ...req.body,
      ...req.query,
      ...req.params
    };

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return next(new ValidationError('Validation failed', errors));
    }

    req.validatedData = result.data;
    next();
  };
};

const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return next(new ValidationError('Validation failed', errors));
    }

    req.validatedBody = result.data;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return next(new ValidationError('Invalid query parameters', errors));
    }

    req.validatedQuery = result.data;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return next(new ValidationError('Invalid path parameters', errors));
    }

    req.validatedParams = result.data;
    next();
  };
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams
};