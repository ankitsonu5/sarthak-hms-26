const db = require('../../../config/db');

exports.register = async (payload, userId) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        console.log("Starting Registration for:", payload.mobile_primary);

        // 1️⃣ Create Patient Master (Calls sp_create_patient_master)
        // NOTE: Procedure expects: uhid_input, first, middle, last, dob, gender, mob1, mob2, email, branch, category, created_by
        const [patientResult] = await conn.query(
            `CALL sp_create_patient_master(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.uhid || null, // Allow NULL to auto-generate
                payload.first_name,
                payload.middle_name || null,
                payload.last_name,
                payload.date_of_birth,
                payload.gender,
                payload.mobile_primary,
                payload.mobile_alternate || null,
                payload.email || null,
                payload.hospital_branch_id,
                payload.patient_category_id,
                userId
            ]
        );

        // Extract Result (Patient ID & UHID)
        // Procedures return result sets. patientResult[0] is the first result set rows.
        const row = patientResult[0][0];
        if (!row || !row.patient_id) {
            throw new Error("Failed to create patient master record.");
        }

        const patientId = row.patient_id;
        const uhid = row.uhid;

        console.log(`Patient Created: ID=${patientId}, UHID=${uhid}`);

        // 2️⃣ Save Demographics
        await conn.query(
            `CALL sp_save_patient_demographics(?, ?, ?, ?, ?, ?)`,
            [
                patientId,
                payload.marital_status_id || null,
                payload.blood_group_id || null,
                payload.occupation_id || null,
                payload.education_level_id || null,
                payload.socio_economic_class_id || null
            ]
        );

        // 3️⃣ Save Address
        await conn.query(
            `CALL sp_save_patient_address(?, ?, ?, ?, ?, ?, ?)`,
            [
                patientId,
                payload.address_line1,
                payload.address_line2 || null,
                payload.city,
                payload.state,
                payload.country || 'India',
                payload.pincode
            ]
        );

        // 4️⃣ Save Emergency Contact (Optional)
        if (payload.emergency_contact_name) {
            await conn.query(
                `CALL sp_save_emergency_contact(?, ?, ?, ?)`,
                [
                    patientId,
                    payload.emergency_contact_name,
                    payload.emergency_relationship_id || null,
                    payload.emergency_mobile
                ]
            );
        }

        // 5️⃣ Save Consent
        await conn.query(
            `CALL sp_save_patient_consent(?, ?, ?)`,
            [
                patientId,
                payload.consent_to_treatment ? 1 : 0,
                payload.consent_to_share_reports ? 1 : 0
            ]
        );

        await conn.commit();
        console.log("Transaction Committed.");

        return { patient_id: patientId, uhid: uhid };

    } catch (err) {
        await conn.rollback();
        console.error("Transaction Rolled Back:", err.message);
        throw err;
    } finally {
        conn.release();
    }
};
// 6️⃣ List All Patients
exports.getAll = async () => {
    const [rows] = await db.query('SELECT * FROM patient_master ORDER BY created_at DESC');
    return rows;
};

// 7️⃣ Get Patient by ID (Detailed)
exports.getById = async (id) => {
    const [rows] = await db.query('SELECT * FROM patient_master WHERE patient_id = ?', [id]);
    if (rows.length === 0) return null;

    const patient = rows[0];

    // Fetch associated data
    const [demographics] = await db.query('SELECT * FROM patient_demographics WHERE patient_id = ?', [id]);
    const [address] = await db.query('SELECT * FROM patient_address WHERE patient_id = ?', [id]);

    return {
        ...patient,
        demographics: demographics[0] || null,
        address: address[0] || null
    };
};

// 8️⃣ Update Patient
exports.update = async (id, payload) => {
    await db.query(
        `UPDATE patient_master SET 
            first_name = ?, last_name = ?, mobile_primary = ?, email = ?
         WHERE patient_id = ?`,
        [payload.first_name, payload.last_name, payload.mobile_primary, payload.email, id]
    );
    return { message: 'Patient updated successfully' };
};

// 9️⃣ Delete Patient
exports.delete = async (id) => {
    // In hospital systems, we usually don't delete. But for this "simple" request, we will.
    await db.query('DELETE FROM patient_master WHERE patient_id = ?', [id]);
    return { message: 'Patient deleted successfully' };
};
