const db = require('../../config/db');

class BaseService {
    constructor(tableName, pk = 'id') {
        this.table = tableName;
        this.pk = pk;
    }

    conn() {
        return db.getConnection();
    }

    async tx(fn) {
        const conn = await this.conn();
        try {
            await conn.beginTransaction();
            const out = await fn(conn);
            await conn.commit();
            return out;
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    }

    async find(id) {
        const [r] = await db.query(`SELECT * FROM ${this.table} WHERE ${this.pk} = ?`, [id]);
        return r[0] || null;
    }
}

module.exports = BaseService;
