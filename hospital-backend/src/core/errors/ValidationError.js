const AppError = require('./AppError');

class ValidationError extends AppError {
    constructor(errors = []) {
        const message = Array.isArray(errors) ? errors.join('; ') : errors;
        super(message, 422);
        this.errors = Array.isArray(errors) ? errors : [errors];
    }
}

module.exports = ValidationError;
