const { prisma } = require('../../config/db');

// --- 1. Nursing Header ---
exports.createObservationHeader = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        // Check if admission is active + get bed details
        const adm = await tx.ipdAdmissionMaster.findUnique({
            where: { ipd_admission_id: BigInt(payload.admission_id) },
            include: {
                bed_allocations: {
                    where: { allocation_status: 'Allocated' },
                    include: { admission: true }
                }
            }
        });

        if (!adm) throw new Error('Active admission not found');
        const activeAllocation = adm.bed_allocations[0];
        if (!activeAllocation) throw new Error('Bed allocation not found');

        // Insert Header
        const observation = await tx.nursingObservationHeader.create({
            data: {
                admission_id: BigInt(payload.admission_id),
                patient_id: BigInt(adm.patient_id),
                bed_id: activeAllocation.bed_id,
                ward_id: activeAllocation.ward_id,
                observation_datetime: new Date(payload.observation_datetime),
                shift_type: payload.shift_type,
                recorded_by: BigInt(userId),
                remarks: payload.remarks || null,
                vitals: payload.vitals ? {
                    create: {
                        temperature: payload.vitals.temperature,
                        pulse: payload.vitals.pulse,
                        respiration_rate: payload.vitals.respiration_rate,
                        systolic_bp: payload.vitals.systolic_bp,
                        diastolic_bp: payload.vitals.diastolic_bp,
                        spo2: payload.vitals.spo2,
                        weight: payload.vitals.weight,
                        height: payload.vitals.height,
                        pain_score: payload.vitals.pain_score,
                        oxygen_support: !!payload.vitals.oxygen_support,
                        oxygen_flow_rate: payload.vitals.oxygen_flow_rate,
                        device_source: 'Manual'
                    }
                } : undefined,
                intake_output: payload.io ? {
                    create: {
                        oral_intake_ml: payload.io.oral_intake_ml,
                        iv_intake_ml: payload.io.iv_intake_ml,
                        urine_output_ml: payload.io.urine_output_ml,
                        stool_output_ml: payload.io.stool_output_ml,
                        vomit_output_ml: payload.io.vomit_output_ml,
                        drain_output_ml: payload.io.drain_output_ml,
                        net_balance_ml: (Number(payload.io.oral_intake_ml || 0) + Number(payload.io.iv_intake_ml || 0)) - (Number(payload.io.urine_output_ml || 0))
                    }
                } : undefined
            }
        });

        // 2️⃣ Calculate EWS automatically if vitals provided
        if (payload.vitals) {
            await calculateAndInsertEWS(tx, observation.observation_id, payload.vitals);
        }

        return { observation_id: observation.observation_id, message: 'Observation Created' };
    });
};

// --- Helper: Calculate EWS (Basic Logic) ---
async function calculateAndInsertEWS(tx, observationId, v) {
    let score = 0;
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

    await tx.earlyWarningScore.create({
        data: {
            observation_id: observationId,
            total_score: score,
            risk_level: risk,
            escalation_triggered: risk === 'Critical'
        }
    });
}

// --- 2. Record Medication Administration (MAR) ---
exports.recordMAR = async (payload, userId) => {
    const mar = await prisma.medicationAdministration.create({
        data: {
            admission_id: BigInt(payload.admission_id),
            medication_order_id: BigInt(payload.medication_order_id),
            medication_name: payload.medication_name,
            dose: payload.dose,
            route: payload.route,
            frequency: payload.frequency,
            scheduled_time: payload.scheduled_time ? new Date(payload.scheduled_time) : null,
            administered_time: new Date(),
            administered_by: BigInt(userId),
            status: payload.status,
            skip_reason: payload.skip_reason || null
        }
    });
    return { mar_id: mar.mar_id, message: 'Medication Recorded' };
};

// --- 3. Add Nursing Note ---
exports.addNursingNote = async (payload, userId) => {
    const note = await prisma.nursingNote.create({
        data: {
            admission_id: BigInt(payload.admission_id),
            note_type: payload.note_type,
            note_text: payload.note_text,
            escalation_flag: !!payload.escalation_flag,
            informed_doctor_id: payload.informed_doctor_id ? BigInt(payload.informed_doctor_id) : null,
            entered_by: BigInt(userId)
        }
    });
    return { note_id: note.note_id, message: 'Note Added' };
};

// --- 4. Get Patient Clinical Dashboard ---
exports.getClinicalDashboard = async (admissionId) => {
    const admission_id = BigInt(admissionId);

    const vitals = await prisma.nursingVitalSigns.findMany({
        where: { observation: { admission_id } },
        include: { observation: true },
        orderBy: { created_at: 'desc' },
        take: 10
    });

    const io = await prisma.intakeOutput.findMany({
        where: { observation: { admission_id } },
        include: { observation: true },
        orderBy: { calculated_at: 'desc' },
        take: 5
    });

    const notes = await prisma.nursingNote.findMany({
        where: { admission_id },
        orderBy: { entered_at: 'desc' },
        take: 5
    });

    const mar = await prisma.medicationAdministration.findMany({
        where: { admission_id },
        orderBy: { administered_time: 'desc' },
        take: 10
    });

    return { vitals, intake_output: io, notes, mar };
};

