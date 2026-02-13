const db = require('../../../config/db');

// 1️⃣ Create Draft Discharge
exports.createDraftDischarge = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Generate Discharge Number
        const [count] = await conn.query('SELECT COUNT(*) as c FROM ipd_discharges WHERE YEAR(created_at) = YEAR(CURDATE())');
        const dischargeNumber = `DIS-${new Date().getFullYear()}-${String(count[0].c + 1).padStart(6, '0')}`;

        // Insert Master
        const [result] = await conn.query(
            `INSERT INTO ipd_discharges (
                admission_id, patient_id, discharge_number, discharge_type, discharge_date, 
                condition_at_discharge, discharge_notes, prepared_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.admission_id, payload.patient_id, dischargeNumber, payload.discharge_type,
                payload.discharge_date, payload.condition_at_discharge, payload.discharge_notes, userId
            ]
        );

        const dischargeId = result.insertId;

        // Insert Diagnosis
        if (payload.diagnosis && payload.diagnosis.length) {
            for (const d of payload.diagnosis) {
                await conn.query(
                    `INSERT INTO ipd_discharge_diagnosis (discharge_id, diagnosis_type, icd_code, diagnosis_name, remarks) VALUES (?, ?, ?, ?, ?)`,
                    [dischargeId, d.type, d.icd_code, d.name, d.remarks]
                );
            }
        }

        // Insert Medications
        if (payload.medications && payload.medications.length) {
            for (const m of payload.medications) {
                await conn.query(
                    `INSERT INTO ipd_discharge_medications (discharge_id, medicine_name, dosage, frequency, duration, route, instructions) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [dischargeId, m.name, m.dosage, m.frequency, m.duration, m.route, m.instructions]
                );
            }
        }

        // Insert Follow-up
        if (payload.followup) {
            await conn.query(
                `INSERT INTO ipd_discharge_followups (discharge_id, followup_date, instructions) VALUES (?, ?, ?)`,
                [dischargeId, payload.followup.date, payload.followup.instructions]
            );
        }

        await conn.commit();
        return { discharge_id: dischargeId, discharge_number: dischargeNumber };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// 2️⃣ Finalize Discharge & Release Bed
exports.finalizeDischarge = async (dischargeId, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Update Status
        await conn.query(
            `UPDATE ipd_discharges SET discharge_status = 'FINALIZED', finalized_at = NOW(), approved_by = ? WHERE discharge_id = ?`,
            [userId, dischargeId]
        );

        // Get Admission ID
        const [discharge] = await conn.query('SELECT admission_id FROM ipd_discharges WHERE discharge_id = ?', [dischargeId]);
        const admissionId = discharge[0].admission_id;

        // Close Admission
        await conn.query(`UPDATE ipd_admission_master SET admission_status = 'Discharged', discharge_datetime = NOW() WHERE ipd_admission_id = ?`, [admissionId]);

        // Release Bed
        const [bed] = await conn.query("SELECT bed_id FROM ipd_bed_allocation WHERE ipd_admission_id = ? AND allocation_status = 'Allocated'", [admissionId]);
        if (bed.length) {
            await conn.query(`UPDATE master_bed SET bed_status = 'Available' WHERE bed_id = ?`, [bed[0].bed_id]);
            await conn.query(`UPDATE ipd_bed_allocation SET allocation_status = 'Released', end_date = NOW() WHERE ipd_admission_id = ?`, [admissionId]);
        }

        await conn.commit();
        return { message: 'Discharge Finalized & Bed Released' };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// 3️⃣ Get Discharge Summary
exports.getDischargeSummary = async (dischargeId) => {
    const [header] = await db.query('SELECT * FROM ipd_discharges WHERE discharge_id = ?', [dischargeId]);
    if (!header.length) return null;

    const [diagnosis] = await db.query('SELECT * FROM ipd_discharge_diagnosis WHERE discharge_id = ?', [dischargeId]);
    const [medications] = await db.query('SELECT * FROM ipd_discharge_medications WHERE discharge_id = ?', [dischargeId]);
    const [followup] = await db.query('SELECT * FROM ipd_discharge_followups WHERE discharge_id = ?', [dischargeId]);

    return {
        header: header[0],
        diagnosis,
        medications,
        followup: followup[0] || null
    };
};
