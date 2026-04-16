const { prisma } = require('../../../config/db');

exports.createIPDAdmission = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        // 1️⃣ Generate Admission Number (Simulated logic from SP)
        const year = new Date().getFullYear();
        const count = await tx.ipdAdmissionMaster.count();
        const admissionNo = `IPD-${year}-${(count + 1).toString().padStart(6, '0')}`;

        // 2️⃣ Create IPD Admission with Nested Relations
        const admission = await tx.ipdAdmissionMaster.create({
            data: {
                admission_no: admissionNo,
                patient_id: BigInt(payload.patient_id),
                opd_visit_id: payload.opd_visit_id ? BigInt(payload.opd_visit_id) : null,
                admission_date: payload.admission_date ? new Date(payload.admission_date) : new Date(),
                admission_type: payload.admission_type,
                hospital_branch_id: BigInt(payload.hospital_branch_id),
                department_id: BigInt(payload.department_id),
                admitting_doctor_id: BigInt(payload.admitting_doctor_id),
                consultant_doctor_id: payload.consultant_doctor_id ? BigInt(payload.consultant_doctor_id) : null,
                patient_category: payload.patient_category,
                primary_diagnosis: payload.primary_diagnosis || null,
                provisional_diagnosis: payload.provisional_diagnosis || null,
                icd10_code: payload.icd10_code || null,
                expected_discharge_date: payload.expected_discharge_date ? new Date(payload.expected_discharge_date) : null,
                is_mlc: !!payload.is_mlc,
                mlc_number: payload.mlc_number || null,
                created_by: BigInt(userId),
                clinical_details: payload.clinical_details ? {
                    create: {
                        chief_complaint: payload.clinical_details.chief_complaint,
                        past_medical_history: payload.clinical_details.past_medical_history,
                        allergies: payload.clinical_details.allergies,
                        current_medication: payload.clinical_details.current_medication,
                        comorbidities: payload.clinical_details.comorbidities,
                        risk_category: payload.clinical_details.risk_category || 'Low',
                        pregnancy_status: !!payload.clinical_details.pregnancy_status,
                        dnr_status: !!payload.clinical_details.dnr_status,
                    }
                } : undefined,
                bed_allocations: payload.bed_allocation ? {
                    create: {
                        ward_id: BigInt(payload.bed_allocation.ward_id),
                        bed_id: BigInt(payload.bed_allocation.bed_id),
                        bed_type: payload.bed_allocation.bed_type,
                        allocation_start: payload.bed_allocation.allocation_start ? new Date(payload.bed_allocation.allocation_start) : new Date(),
                        isolation_required: !!payload.bed_allocation.isolation_required,
                    }
                } : undefined,
                vitals: payload.vitals_monitoring ? {
                    create: {
                        recorded_by: BigInt(userId),
                        height_cm: payload.vitals_monitoring.height_cm,
                        weight_kg: payload.vitals_monitoring.weight_kg,
                        bmi: payload.vitals_monitoring.bmi,
                        blood_pressure: payload.vitals_monitoring.blood_pressure,
                        pulse_rate: payload.vitals_monitoring.pulse_rate,
                        temperature: payload.vitals_monitoring.temperature,
                        spo2: payload.vitals_monitoring.spo2,
                        respiratory_rate: payload.vitals_monitoring.respiratory_rate,
                        gcs_score: payload.vitals_monitoring.gcs_score,
                        remarks: payload.vitals_monitoring.remarks,
                    }
                } : undefined,
                insurance: payload.insurance_details ? {
                    create: {
                        insurance_company: payload.insurance_details.insurance_company,
                        tpa_name: payload.insurance_details.tpa_name,
                        policy_number: payload.insurance_details.policy_number,
                        corporate_name: payload.insurance_details.corporate_name,
                        authorization_required: !!payload.insurance_details.authorization_required,
                        authorization_status: payload.insurance_details.authorization_status || 'Pending',
                        authorized_amount: payload.insurance_details.authorized_amount || 0,
                        copay_percentage: payload.insurance_details.copay_percentage || 0,
                        package_name: payload.insurance_details.package_name,
                        package_code: payload.insurance_details.package_code,
                        package_amount: payload.insurance_details.package_amount || 0,
                    }
                } : undefined,
                financials: payload.financials ? {
                    create: {
                        room_charges: payload.financials.room_charges || 0,
                        procedure_charges: payload.financials.procedure_charges || 0,
                        pharmacy_charges: payload.financials.pharmacy_charges || 0,
                        lab_charges: payload.financials.lab_charges || 0,
                        other_charges: payload.financials.other_charges || 0,
                        gross_amount: payload.financials.gross_amount || 0,
                        discount_amount: payload.financials.discount_amount || 0,
                        net_amount: payload.financials.net_amount || 0,
                        advance_deposit: payload.financials.advance_deposit || 0,
                        payment_status: payload.financials.payment_status || 'Pending',
                        billing_type: payload.financials.billing_type || 'Open',
                    }
                } : undefined
            }
        });

        // 3️⃣ Perform Audit (Manual or automatic via middleware/extension - doing manual for now)
        await tx.auditLog.create({
            data: {
                entity_type: 'IPD_ADMISSION',
                entity_id: admission.ipd_admission_id,
                action: 'CREATE',
                performed_by: BigInt(userId),
                details: `Created IPD Admission: ${admissionNo}`
            }
        });

        return { ipd_admission_id: admission.ipd_admission_id, admission_no: admissionNo };
    });
};

exports.getAllAdmissions = async () => {
    return prisma.ipdAdmissionMaster.findMany({
        include: {
            patient: {
                select: {
                    first_name: true,
                    last_name: true,
                    uhid: true
                }
            }
        },
        orderBy: { created_at: 'desc' }
    });
};

exports.getAdmissionById = async (id) => {
    return prisma.ipdAdmissionMaster.findUnique({
        where: { ipd_admission_id: BigInt(id) },
        include: {
            patient: true,
            clinical_details: true,
            bed_allocations: true,
            vitals: true,
            insurance: true,
            financials: true,
            consents: true
        }
    });
};

