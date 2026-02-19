const asyncHandler = require('../middleware/asyncHandler');
const response = require('../helpers/response');
const { NotFoundError } = require('../errors');

class BaseController {
    handle(fn) {
        return asyncHandler(fn);
    }

    ok(res, data, msg = 'Success') {
        return response.success(res, data, msg);
    }

    created(res, data, msg = 'Created') {
        return response.created(res, data, msg);
    }

    notFound(entity, id) {
        throw new NotFoundError(entity, id);
    }
}

module.exports = BaseController;
