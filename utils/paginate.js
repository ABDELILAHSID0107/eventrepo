const paginate = async (model, query = {}, options = {}) => {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let modelQuery = model.find(query);

    if (options.select) {
        modelQuery = modelQuery.select(options.select);
    }

    if (options.sort) {
        modelQuery = modelQuery.sort(options.sort);
    }

    if (options.populate) {
        modelQuery = modelQuery.populate(options.populate);
    }

    modelQuery = modelQuery.skip(startIndex).limit(limit);

    const [data, total] = await Promise.all([
        modelQuery,
        model.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};

module.exports = paginate;