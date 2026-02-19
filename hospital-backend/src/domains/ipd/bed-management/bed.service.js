const db = require('../../../config/db');

exports.allocateBed = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `CALL sp_allocate_ipd_bed(?, ?, ?, ?, ?, ?)`,
            [
                payload.ipd_admission_id, payload.ward_id, payload.bed_id,
                payload.bed_type, payload.allocation_start || new Date(),
                payload.isolation_required ? 1 : 0
            ]
        );

        await conn.query(
            `UPDATE master_bed SET bed_status = 'Occupied' WHERE bed_id = ?`,
            [payload.bed_id]
        );

        await conn.commit();
        return { message: 'Bed allocated successfully' };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.transferBed = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `UPDATE ipd_bed_allocation SET allocation_end = NOW(), allocation_status = 'Transferred'
             WHERE ipd_admission_id = ? AND allocation_end IS NULL`,
            [payload.ipd_admission_id]
        );

        await conn.query(
            `UPDATE master_bed SET bed_status = 'Available' WHERE bed_id = ?`,
            [payload.old_bed_id]
        );

        await conn.query(
            `INSERT INTO ipd_bed_allocation (ipd_admission_id, ward_id, bed_id, bed_type, allocation_start, isolation_required)
             VALUES (?, ?, ?, ?, NOW(), ?)`,
            [payload.ipd_admission_id, payload.new_ward_id, payload.new_bed_id, payload.bed_type, payload.isolation_required ? 1 : 0]
        );

        await conn.query(
            `UPDATE master_bed SET bed_status = 'Occupied' WHERE bed_id = ?`,
            [payload.new_bed_id]
        );

        await conn.commit();
        return { message: 'Bed transferred successfully' };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getAvailableBeds = async (wardId) => {
    const sql = wardId
        ? `SELECT b.*, w.ward_name FROM master_bed b JOIN master_ward w ON b.ward_id = w.ward_id WHERE b.bed_status = 'Available' AND b.ward_id = ?`
        : `SELECT b.*, w.ward_name FROM master_bed b JOIN master_ward w ON b.ward_id = w.ward_id WHERE b.bed_status = 'Available'`;
    const params = wardId ? [wardId] : [];
    const [rows] = await db.query(sql, params);
    return rows;
};

exports.getBedOccupancy = async () => {
    const [rows] = await db.query(`
        SELECT w.ward_name, w.ward_id,
            COUNT(b.bed_id) AS total_beds,
            SUM(CASE WHEN b.bed_status = 'Available' THEN 1 ELSE 0 END) AS available,
            SUM(CASE WHEN b.bed_status = 'Occupied' THEN 1 ELSE 0 END) AS occupied
        FROM master_ward w
        LEFT JOIN master_bed b ON w.ward_id = b.ward_id
        WHERE w.is_active = TRUE
        GROUP BY w.ward_id, w.ward_name
    `);
    return rows;
};
