const { prisma } = require('../../config/db');

exports.createOPDVisit = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        console.log("Starting OPD Visit Creation for Patient ID:", payload.patient_id);

        // 1️⃣ Generate Visit Number & Token (Simulated logic from SP)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await tx.opdVisitMaster.count({
            where: { visit_date: new Date() }
        });
        const visitNo = `OPD-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
        const tokenNo = count + 1;

        // 2️⃣ Create OPD Visit with Nested Relations
        const visit = await tx.opdVisitMaster.create({
            data: {
                visit_no: visitNo,
                patient_id: BigInt(payload.patient_id),
                visit_type: payload.visit_type,
                appointment_type: payload.appointment_type,
                visit_date: new Date(payload.visit_date),
                visit_time: payload.visit_time,
                hospital_branch_id: BigInt(payload.hospital_branch_id),
                department_id: BigInt(payload.department_id),
                doctor_id: BigInt(payload.doctor_id),
                opd_room: payload.opd_room || null,
                token_no: tokenNo,
                queue_type: payload.queue_type || 'Normal',
                chief_complaint: payload.chief_complaint,
                complaint_duration: payload.complaint_duration || null,
                visit_reason: payload.visit_reason,
                created_by: BigInt(userId),
                vitals: payload.vitals ? {
                    create: {
                        height_cm: payload.vitals.height_cm,
                        weight_kg: payload.vitals.weight_kg,
                        bmi: payload.vitals.bmi,
                        blood_pressure: payload.vitals.blood_pressure,
                        pulse_rate: payload.vitals.pulse_rate,
                        temperature: payload.vitals.temperature,
                        spo2: payload.vitals.spo2,
                        recorded_by: BigInt(userId)
                    }
                } : undefined,
                billing: payload.billing ? {
                    create: {
                        consultation_fee: payload.billing.consultation_fee,
                        discount_amount: payload.billing.discount_amount || 0,
                        discount_reason: payload.billing.discount_reason || null,
                        net_amount: payload.billing.net_amount,
                        payment_mode: payload.billing.payment_mode,
                        payment_status: payload.billing.payment_status || 'Pending'
                    }
                } : undefined,
                insurance: payload.insurance ? {
                    create: {
                        patient_category: payload.insurance.patient_category,
                        corporate_name: payload.insurance.corporate_name || null,
                        insurance_company: payload.insurance.insurance_company || null,
                        tpa_name: payload.insurance.tpa_name || null,
                        authorization_required: !!payload.insurance.authorization_required
                    }
                } : undefined
            }
        });

        console.log(`OPD Visit Created: ID=${visit.opd_visit_id}, VisitNo=${visitNo}, Token=${tokenNo}`);

        return {
            opd_visit_id: visit.opd_visit_id,
            visit_no: visitNo,
            token_no: tokenNo
        };
    });
};

exports.getAllVisits = async () => {
    return prisma.opdVisitMaster.findMany({
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

exports.getVisitById = async (id) => {
    return prisma.opdVisitMaster.findUnique({
        where: { opd_visit_id: BigInt(id) },
        include: {
            patient: true,
            vitals: true,
            billing: true,
            insurance: true
        }
    });
};

