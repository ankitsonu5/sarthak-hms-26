const ValidationError = require('../errors/ValidationError');

const validate = (schema, source = 'body') => (req, _res, next) => {
    const data = source === 'body' ? req.body
        : source === 'params' ? req.params
        : source === 'query' ? req.query
        : req.body;

    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        const messages = error.details.map(d => d.message);
        throw new ValidationError(messages);
    }

    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;

    next();
};

module.exports = validate;
