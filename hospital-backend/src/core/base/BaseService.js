const { prisma } = require('../../config/db');

class BaseService {
    constructor(modelName, pk = 'id') {
        this.modelName = modelName;
        this.pk = pk;
    }

    get model() {
        return prisma[this.modelName];
    }

    async tx(fn) {
        return prisma.$transaction(fn);
    }

    async findById(id) {
        if (!id) return null;
        return this.model.findUnique({
            where: { [this.pk]: BigInt(id) }
        });
    }

    async findAll(params = {}) {
        return this.model.findMany(params);
    }

    async create(data) {
        return this.model.create({ data });
    }

    async update(id, data) {
        return this.model.update({
            where: { [this.pk]: BigInt(id) },
            data
        });
    }

    async delete(id) {
        return this.model.update({
            where: { [this.pk]: BigInt(id) },
            data: { is_active: false }
        });
    }

    async hardDelete(id) {
        return this.model.delete({
            where: { [this.pk]: BigInt(id) }
        });
    }
}

module.exports = BaseService;
