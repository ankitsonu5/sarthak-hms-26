const AppError = require('./AppError');

class NotFoundError extends AppError {
    constructor(resource = 'Resource', id) {
        const msg = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
        super(msg, 404);
        this.resource = resource;
    }
}

module.exports = NotFoundError;
