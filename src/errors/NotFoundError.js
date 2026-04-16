const AppError = require('./AppError');

class NotFoundError extends AppError {
  constructor(resource = 'Resource', id) {
    super(`${resource} ${id ? `with id '${id}' ` : ''}not found`, 404);
  }
}

module.exports = NotFoundError;
