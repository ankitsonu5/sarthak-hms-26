exports.success = (res, data, message = 'Success', statusCode = 200, meta) =>
    res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(meta && { meta })
    });

exports.created = (res, data, message = 'Created successfully') =>
    res.status(201).json({
        success: true,
        message,
        data
    });

exports.paginated = (res, data, total, page, limit) =>
    res.status(200).json({
        success: true,
        data,
        meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });

exports.noContent = (res, message = 'Deleted successfully') =>
    res.status(200).json({
        success: true,
        message
    });
