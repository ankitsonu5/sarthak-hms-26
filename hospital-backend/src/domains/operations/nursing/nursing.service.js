const db = require('../../../config/db');

// --- 1. Nursing Header ---
exports.createObservationHeader = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Check if admission is active + get bed details
        const [adm] = await conn.query(`
            SELECT a.ipd_admission_id, a.patient_id, b.bed_id, w.ward_id
            FROM ipd_admission_master a
            JOIN ipd_bed_allocation ba ON a.ipd_admission_id = ba.ipd_admission_id
            JOIN master_bed b ON ba.bed_id = b.bed_id
            JOIN master_ward w ON b.ward_id = w.ward_id
            WHERE a.ipd_admission_id = ? AND ba.allocation_status = 'Allocated'
        `, [payload.admission_id]);

        if (!adm.length) throw new Error('Active admission or bed allocation not found');

        const { ipd_admission_id, patient_id, bed_id, ward_id } = adm[0];

        // Insert Header
        const [result] = await conn.query(
            `INSERT INTO nursing_observation_header 
            (admission_id, patient_id, bed_id, ward_id, observation_datetime, shift_type, recorded_by, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [ipd_admission_id, patient_id, bed_id, ward_id, payload.observation_datetime, payload.shift_type, userId, payload.remarks]
        );

        const observationId = result.insertId;

        // If vitals provided, add them
        if (payload.vitals) {
            await insertVitals(conn, observationId, payload.vitals);
            // Calculate EWS automatically
            await calculateAndInsertEWS(conn, observationId, payload.vitals);
        }

        // If IO provided, add them
        if (payload.io) {
            await insertIntakeOutput(conn, observationId, payload.io);
        }

        await conn.commit();
        return { observation_id: observationId, message: 'Observation Created' };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// --- Helper: Insert Vitals ---
async function insertVitals(conn, observationId, v) {
    await conn.query(
        `INSERT INTO vital_signs 
        (observation_id, temperature, pulse, respiration_rate, systolic_bp, diastolic_bp, spo2, weight, height, pain_score, oxygen_support, oxygen_flow_rate, device_source) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [observationId, v.temperature, v.pulse, v.respiration_rate, v.systolic_bp, v.diastolic_bp, v.spo2, v.weight, v.height, v.pain_score, v.oxygen_support, v.oxygen_flow_rate, 'Manual']
    );
}

// --- Helper: Calculate EWS (Basic Logic) ---
async function calculateAndInsertEWS(conn, observationId, v) {
    let score = 0;
    // Simple mock logic for EWS (Can be expanded per NEWS2 Guidelines)
    if (v.respiration_rate <= 8 || v.respiration_rate >= 25) score += 3;
    else if (v.respiration_rate >= 21) score += 2;

    if (v.spo2 <= 91) score += 3;
    else if (v.spo2 <= 93) score += 2;

    if (v.systolic_bp <= 90 || v.systolic_bp >= 220) score += 3;
    else if (v.systolic_bp <= 100) score += 2;

    if (v.pulse <= 40 || v.pulse >= 131) score += 3;
    else if (v.pulse >= 111) score += 2;

    if (v.temperature <= 35 || v.temperature >= 39.1) score += 3;
    else if (v.temperature >= 38.1) score += 1;

    let risk = 'Low';
    if (score >= 7) risk = 'Critical';
    else if (score >= 5) risk = 'High';
    else if (score >= 1) risk = 'Moderate';

    await conn.query(
        `INSERT INTO early_warning_score 
        (observation_id, temperature_score, pulse_score, respiration_score, bp_score, spo2_score, total_score, risk_level, escalation_triggered) 
        VALUES (?, 0, 0, 0, 0, 0, ?, ?, ?)`, // Simplified individual scores for now
        [observationId, score, risk, risk === 'Critical']
    );
}

// --- Helper: Insert IO ---
async function insertIntakeOutput(conn, observationId, io) {
    const net = (Number(io.oral_intake_ml || 0) + Number(io.iv_intake_ml || 0)) - (Number(io.urine_output_ml || 0));
    await conn.query(
        `INSERT INTO intake_output 
        (observation_id, oral_intake_ml, iv_intake_ml, urine_output_ml, stool_output_ml, vomit_output_ml, drain_output_ml, net_balance_ml) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [observationId, io.oral_intake_ml, io.iv_intake_ml, io.urine_output_ml, io.stool_output_ml, io.vomit_output_ml, io.drain_output_ml, net]
    );
}

// --- 2. Record Medication Administration (MAR) ---
exports.recordMAR = async (payload, userId) => {
    // payload: { admission_id, medication_order_id, medication_name, dose, ... status }
    const [result] = await db.query(
        `INSERT INTO medication_administration 
        (admission_id, medication_order_id, medication_name, dose, route, frequency, scheduled_time, administered_time, administered_by, status, skip_reason) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
        [
            payload.admission_id, payload.medication_order_id, payload.medication_name,
            payload.dose, payload.route, payload.frequency, payload.scheduled_time,
            userId, payload.status, payload.skip_reason
        ]
    );
    return { mar_id: result.insertId, message: 'Medication Recorded' };
};

// --- 3. Add Nursing Note ---
exports.addNursingNote = async (payload, userId) => {
    const [result] = await db.query(
        `INSERT INTO nursing_notes 
        (admission_id, note_type, note_text, escalation_flag, informed_doctor_id, entered_by) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [payload.admission_id, payload.note_type, payload.note_text, payload.escalation_flag, payload.informed_doctor_id, userId]
    );
    return { note_id: result.insertId, message: 'Note Added' };
};

// --- 4. Get Patient Clinical Dashboard ---
exports.getClinicalDashboard = async (admissionId) => {
    // Get latest vitals, pending meds, recent notes
    const [vitals] = await db.query(`
        SELECT v.*, h.observation_datetime, e.risk_level 
        FROM vital_signs v
        JOIN nursing_observation_header h ON v.observation_id = h.observation_id
        LEFT JOIN early_warning_score e ON v.observation_id = e.observation_id
        WHERE h.admission_id = ?
        ORDER BY h.observation_datetime DESC LIMIT 10
    `, [admissionId]);

    const [io] = await db.query(`
        SELECT io.*, h.observation_datetime 
        FROM intake_output io
        JOIN nursing_observation_header h ON io.observation_id = h.observation_id
        WHERE h.admission_id = ?
        ORDER BY h.observation_datetime DESC LIMIT 5
    `, [admissionId]);

    const [notes] = await db.query(`SELECT * FROM nursing_notes WHERE admission_id = ? ORDER BY entered_at DESC LIMIT 5`, [admissionId]);

    const [mar] = await db.query(`SELECT * FROM medication_administration WHERE admission_id = ? ORDER BY administered_time DESC LIMIT 10`, [admissionId]);

    return { vitals, intake_output: io, notes, mar };
};
