const { prisma } = require('../../config/db');

exports.createIPDOrder = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        // 1️⃣ Create Order Master
        const master = await tx.ipdOrderMaster.create({
            data: {
                ipd_admission_id: BigInt(payload.ipd_admission_id),
                doctor_id: BigInt(payload.doctor_id),
                priority: payload.priority || 'Routine',
                order_source: payload.order_source || 'Manual',
                verbal_order_flag: !!payload.verbal_order_flag,
                verbal_order_verified_by: payload.verbal_order_verified_by ? BigInt(payload.verbal_order_verified_by) : null,
                clinical_notes: payload.clinical_notes || null,
                is_package_case: !!payload.is_package_case,
                created_by: BigInt(userId)
            }
        });

        if (payload.items && Array.isArray(payload.items)) {
            for (const item of payload.items) {
                // 2️⃣ Create Order Item
                const orderItem = await tx.ipdOrderItem.create({
                    data: {
                        order_master_id: master.order_master_id,
                        order_type: item.order_type,
                        reference_code: item.reference_code ? BigInt(item.reference_code) : null,
                        scheduled_datetime: item.scheduled_datetime ? new Date(item.scheduled_datetime) : null,
                        is_critical: !!item.is_critical,
                        remarks: item.remarks || null
                    }
                });

                // 3️⃣ Basic Order Details (Simplified for refactor)
                // In a full implementation, we'd use specific models for MedicationOrder, LabOrder etc.
                // For now, keeping it extensible via conditional logic.

                // 4️⃣ Optional Billing Link
                if (item.billing_details) {
                    // Logic to link to billing is handled by the Billing Service or a specific billing trigger.
                    // For now, we can log it or create a placeholder if a model exists.
                }
            }
        }

        return { order_master_id: master.order_master_id, status: 'Success' };
    });
};

exports.getOrdersByAdmission = async (admissionId) => {
    return prisma.ipdOrderMaster.findMany({
        where: { ipd_admission_id: BigInt(admissionId) },
        include: {
            items: true
        },
        orderBy: { order_datetime: 'desc' }
    });
};

exports.getOrderById = async (orderId) => {
    return prisma.ipdOrderMaster.findUnique({
        where: { order_master_id: BigInt(orderId) },
        include: {
            items: true
        }
    });
};

exports.getOrdersByPatient = async (patientId) => {
    // Note: Since orders are linked to admissions, we join via IpdAdmissionMaster
    return prisma.ipdOrderMaster.findMany({
        where: {
            admission: {
                patient_id: BigInt(patientId)
            }
        },
        include: {
            items: true,
            admission: {
                select: { admission_no: true }
            }
        },
        orderBy: { order_datetime: 'desc' }
    });
};

