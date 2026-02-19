class BaseJob {
    constructor(name) {
        this.name = name || this.constructor.name;
    }

    async run() {
        const start = Date.now();
        try {
            const result = await this.execute();
            console.log(`[Job] ${this.name} done in ${Date.now() - start}ms`);
            return result;
        } catch (err) {
            console.error(`[Job] ${this.name} failed:`, err.message);
            throw err;
        }
    }

    async execute() {
        throw new Error('Override execute()');
    }
}

module.exports = BaseJob;
