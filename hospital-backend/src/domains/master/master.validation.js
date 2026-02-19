const Joi = require('joi');

exports.tableName = Joi.object({
    tableName: Joi.string().pattern(/^master_[a-z_]+$/).required()
        .messages({ 'string.pattern.base': 'Table name must start with master_ and contain only lowercase letters and underscores' })
});

exports.tableNameWithId = Joi.object({
    tableName: Joi.string().pattern(/^master_[a-z_]+$/).required(),
    id: Joi.number().integer().positive().required()
});
