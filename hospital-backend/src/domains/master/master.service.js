const { prisma } = require('../../config/db');

/**
 * @desc Enterprise-grade Master Data Service
 */
class MasterService {

    static ALLOWED_TABLES = [
        'master_roles', 'master_patient_category', 'master_ward', 'master_bed',
        'master_gender', 'master_nationality', 'master_religion',
        'master_id_proof_type', 'master_state', 'master_district',
        'master_city', 'master_pincode', 'master_language',
        'master_title', 'master_referral_source'
    ];

    static PK_MAP = {
        'master_roles': 'role_id',
        'master_patient_category': 'category_id',
        'master_ward': 'ward_id',
        'master_bed': 'bed_id'
    };

    static getPk(tableName) {
        return this.PK_MAP[tableName] || tableName.replace('master_', '') + '_id';
    }

    static async getAll(tableName) {
        if (!this.ALLOWED_TABLES.includes(tableName)) throw new Error("Invalid Master Table");
        return prisma.$queryRawUnsafe(`SELECT * FROM ${tableName} WHERE is_active = TRUE`);
    }

    static async getById(tableName, id) {
        const pk = this.getPk(tableName);
        const result = await prisma.$queryRawUnsafe(
            `SELECT * FROM ${tableName} WHERE ${pk} = $1`,
            BigInt(id)
        );
        return result[0] || null;
    }

    static async create(tableName, data) {
        const keys = Object.keys(data);
        const cols = keys.join(', ');
        const vals = keys.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO ${tableName} (${cols}) VALUES (${vals}) RETURNING *`;
        const result = await prisma.$queryRawUnsafe(query, ...Object.values(data));
        return result[0];
    }

    static async update(tableName, id, data) {
        const pk = this.getPk(tableName);
        const keys = Object.keys(data);
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

        const query = `UPDATE ${tableName} SET ${setClause} WHERE ${pk} = $${keys.length + 1} RETURNING *`;
        const result = await prisma.$queryRawUnsafe(query, ...Object.values(data), BigInt(id));
        return result[0];
    }

    /**
     * @desc Fetching multiple masters for dropdowns (Registration)
     */
    static async getRegistrationMasters() {
        // In PostgreSQL, we avoid Stored Procedures where possible for dynamic data
        const [genders, titles, nationalities, religions, idTypes, states] = await Promise.all([
            this.getAll('master_gender'),
            this.getAll('master_title'),
            this.getAll('master_nationality'),
            this.getAll('master_religion'),
            this.getAll('master_id_proof_type'),
            this.getAll('master_state')
        ]);

        return { genders, titles, nationalities, religions, idTypes, states };
    }
}

module.exports = MasterService;
