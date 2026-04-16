const { prisma } = require('../../../config/db');

exports.allocateBed = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
            INSERT INTO ipd_bed_allocation
            (ipd_admission_id, ward_id, bed_id, bed_type, allocation_start, isolation_required)
            VALUES (${payload.ipd_admission_id}, ${payload.ward_id}, ${payload.bed_id},
                    ${payload.bed_type}, ${payload.allocation_start || new Date()},
                    ${payload.isolation_required || false})`;

        await tx.$executeRaw`
            UPDATE master_bed SET bed_status = 'Occupied' WHERE bed_id = ${payload.bed_id}`;

        return { message: 'Bed allocated successfully' };
    });
};

exports.transferBed = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
            UPDATE ipd_bed_allocation SET allocation_end = NOW(), allocation_status = 'Transferred'
            WHERE ipd_admission_id = ${payload.ipd_admission_id} AND allocation_end IS NULL`;

        await tx.$executeRaw`
            UPDATE master_bed SET bed_status = 'Available' WHERE bed_id = ${payload.old_bed_id}`;

        await tx.$executeRaw`
            INSERT INTO ipd_bed_allocation (ipd_admission_id, ward_id, bed_id, bed_type, allocation_start, isolation_required)
            VALUES (${payload.ipd_admission_id}, ${payload.new_ward_id}, ${payload.new_bed_id},
                    ${payload.bed_type}, NOW(), ${payload.isolation_required || false})`;

        await tx.$executeRaw`
            UPDATE master_bed SET bed_status = 'Occupied' WHERE bed_id = ${payload.new_bed_id}`;

        return { message: 'Bed transferred successfully' };
    });
};

exports.getAvailableBeds = async (wardId) => {
    if (wardId) {
        return prisma.$queryRaw`
            SELECT b.*, w.ward_name FROM master_bed b
            JOIN master_ward w ON b.ward_id = w.ward_id
            WHERE b.bed_status = 'Available' AND b.ward_id = ${wardId}`;
    }
    return prisma.$queryRaw`
        SELECT b.*, w.ward_name FROM master_bed b
        JOIN master_ward w ON b.ward_id = w.ward_id
        WHERE b.bed_status = 'Available'`;
};

exports.getBedOccupancy = async () => {
    return prisma.$queryRaw`
        SELECT w.ward_name, w.ward_id,
            COUNT(b.bed_id)::int AS total_beds,
            SUM(CASE WHEN b.bed_status = 'Available' THEN 1 ELSE 0 END)::int AS available,
            SUM(CASE WHEN b.bed_status = 'Occupied' THEN 1 ELSE 0 END)::int AS occupied
        FROM master_ward w
        LEFT JOIN master_bed b ON w.ward_id = b.ward_id
        WHERE w.is_active = TRUE
        GROUP BY w.ward_id, w.ward_name`;
};
