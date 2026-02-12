const db = require('../../../config/db');

exports.createIPDAdmission = async (payload, userId) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        console.log("Starting IPD Admission for Patient ID:", payload.patient_id);

        // 1️⃣ Create IPD Admission (Calls sp_create_ipd_admission)
        const [admissionResult] = await conn.query(
            `CALL sp_create_ipd_admission(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.patient_id,
                payload.opd_visit_id || null,
                payload.admission_date || new Date(),
                payload.admission_type,
                payload.hospital_branch_id,
                payload.department_id,
                payload.admitting_doctor_id,
                payload.consultant_doctor_id || null,
                payload.patient_category,
                payload.primary_diagnosis || null,
                payload.provisional_diagnosis || null,
                payload.icd10_code || null,
                payload.expected_discharge_date || null,
                payload.is_mlc ? 1 : 0,
                payload.mlc_number || null,
                userId // created_by
            ]
        );

        const row = admissionResult[0][0];
        if (!row || !row.ipd_admission_id) {
            throw new Error("Failed to create IPD admission record.");
        }

        const ipdAdmissionId = row.ipd_admission_id;
        const admissionNo = row.admission_no;

        console.log(`IPD Admission Created: ID=${ipdAdmissionId}, AdmissionNo=${admissionNo}`);

        // 2️⃣ Save Clinical Details
        if (payload.clinical_details) {
            const cd = payload.clinical_details;
            await conn.query(
                `CALL sp_save_ipd_clinical_details(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    ipdAdmissionId,
                    cd.chief_complaint || null,
                    cd.past_medical_history || null,
                    cd.allergies || null,
                    cd.current_medication || null,
                    cd.comorbidities || null,
                    cd.risk_category || 'Low',
                    cd.pregnancy_status ? 1 : 0,
                    cd.dnr_status ? 1 : 0
                ]
            );
        }

        // 3️⃣ Save Bed Allocation
        if (payload.bed_allocation) {
            const ba = payload.bed_allocation;
            await conn.query(
                `CALL sp_allocate_ipd_bed(?, ?, ?, ?, ?, ?)`,
                [
                    ipdAdmissionId,
                    ba.ward_id,
                    ba.bed_id,
                    ba.bed_type,
                    ba.allocation_start || new Date(),
                    ba.isolation_required ? 1 : 0
                ]
            );
        }

        // 4️⃣ Save Vitals Monitoring
        if (payload.vitals_monitoring) {
            const v = payload.vitals_monitoring;
            await conn.query(
                `CALL sp_save_ipd_vitals_monitoring(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    ipdAdmissionId,
                    userId, // recorded_by
                    v.height_cm || null,
                    v.weight_kg || null,
                    v.bmi || null,
                    v.blood_pressure || null,
                    v.pulse_rate || null,
                    v.temperature || null,
                    v.spo2 || null,
                    v.respiratory_rate || null,
                    v.gcs_score || null,
                    v.remarks || null
                ]
            );
        }

        // 5️⃣ Save Insurance Details (If provided)
        if (payload.insurance_details) {
            const id = payload.insurance_details;
            await conn.query(
                `INSERT INTO ipd_insurance_details (
                    ipd_admission_id, insurance_company, tpa_name, policy_number, 
                    corporate_name, authorization_required, authorization_status, 
                    authorized_amount, copay_percentage, package_name, package_code, package_amount
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    ipdAdmissionId,
                    id.insurance_company || null,
                    id.tpa_name || null,
                    id.policy_number || null,
                    id.corporate_name || null,
                    id.authorization_required ? 1 : 0,
                    id.authorization_status || 'Pending',
                    id.authorized_amount || 0,
                    id.copay_percentage || 0,
                    id.package_name || null,
                    id.package_code || null,
                    id.package_amount || 0
                ]
            );
        }

        // 5️⃣ Initialize Financials
        if (payload.financials) {
            const f = payload.financials;
            await conn.query(
                `INSERT INTO ipd_financials (
                    ipd_admission_id, room_charges, procedure_charges, pharmacy_charges, 
                    lab_charges, other_charges, gross_amount, discount_amount, 
                    net_amount, advance_deposit, payment_status, billing_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    ipdAdmissionId,
                    f.room_charges || 0,
                    f.procedure_charges || 0,
                    f.pharmacy_charges || 0,
                    f.lab_charges || 0,
                    f.other_charges || 0,
                    f.gross_amount || 0,
                    f.discount_amount || 0,
                    f.net_amount || 0,
                    f.advance_deposit || 0,
                    f.payment_status || 'Pending',
                    f.billing_type || 'Open'
                ]
            );
        }

        await conn.commit();
        console.log("IPD Transaction Committed.");

        return {
            ipd_admission_id: ipdAdmissionId,
            admission_no: admissionNo
        };

    } catch (err) {
        await conn.rollback();
        console.error("IPD Transaction Rolled Back:", err.message);
        throw err;
    } finally {
        conn.release();
    }
};
