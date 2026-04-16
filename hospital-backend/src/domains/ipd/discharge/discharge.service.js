const { prisma } = require('../../../config/db');

exports.createDraftDischarge = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        // 1️⃣ Generate Discharge Number
        const year = new Date().getFullYear();
        const count = await tx.ipdDischarge.count();
        const dischargeNumber = `DIS-${year}-${(count + 1).toString().padStart(6, '0')}`;

        // 2️⃣ Create Draft Discharge with Nested Relations
        const discharge = await tx.ipdDischarge.create({
            data: {
                admission_id: BigInt(payload.admission_id),
                patient_id: BigInt(payload.patient_id),
                discharge_number: dischargeNumber,
                discharge_type: payload.discharge_type,
                discharge_date: new Date(payload.discharge_date),
                condition_at_discharge: payload.condition_at_discharge || null,
                discharge_notes: payload.discharge_notes || null,
                discharge_summary: payload.discharge_summary || null,
                prepared_by: BigInt(userId),
                diagnosis: payload.diagnosis ? {
                    create: payload.diagnosis.map(d => ({
                        diagnosis_type: d.type,
                        icd_code: d.icd_code,
                        diagnosis_name: d.name,
                        remarks: d.remarks
                    }))
                } : undefined,
                medications: payload.medications ? {
                    create: payload.medications.map(m => ({
                        medicine_name: m.name,
                        dosage: m.dosage,
                        frequency: m.frequency,
                        duration: m.duration,
                        route: m.route,
                        instructions: m.instructions
                    }))
                } : undefined,
                followups: payload.followup ? {
                    create: {
                        followup_date: new Date(payload.followup.date),
                        instructions: payload.followup.instructions
                    }
                } : undefined
            }
        });

        return { discharge_id: discharge.discharge_id, discharge_number: dischargeNumber };
    });
};

exports.finalizeDischarge = async (dischargeId, userId) => {
    return prisma.$transaction(async (tx) => {
        // 1️⃣ Update Discharge Status
        const discharge = await tx.ipdDischarge.update({
            where: { discharge_id: BigInt(dischargeId) },
            data: {
                discharge_status: 'FINALIZED',
                finalized_at: new Date(),
                approved_by: BigInt(userId)
            },
            include: { admission: true }
        });

        const admissionId = discharge.admission_id;

        // 2️⃣ Update Admission Master
        await tx.ipdAdmissionMaster.update({
            where: { ipd_admission_id: admissionId },
            data: {
                admission_status: 'Discharged',
                discharge_date: new Date()
            }
        });

        // 3️⃣ Release Bed
        const activeBed = await tx.ipdBedAllocation.findFirst({
            where: {
                ipd_admission_id: admissionId,
                allocation_status: 'Allocated'
            }
        });

        if (activeBed) {
            await tx.masterBed.update({
                where: { bed_id: activeBed.bed_id },
                data: { bed_status: 'Available' }
            });

            await tx.ipdBedAllocation.update({
                where: { bed_allocation_id: activeBed.bed_allocation_id },
                data: {
                    allocation_status: 'Released',
                    allocation_end: new Date()
                }
            });
        }

        return { message: 'Discharge finalized & bed released' };
    });
};

exports.getDischargeSummary = async (dischargeId) => {
    return prisma.ipdDischarge.findUnique({
        where: { discharge_id: BigInt(dischargeId) },
        include: {
            diagnosis: true,
            medications: true,
            followups: true,
            admission: {
                include: { patient: true }
            }
        }
    });
};

