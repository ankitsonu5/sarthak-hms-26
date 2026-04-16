const { prisma } = require('../../config/db');
const BaseService = require('../../core/base/BaseService');

/**
 * @desc Enterprise Patient Management Service
 */
class PatientService extends BaseService {
    constructor() {
        super('patientMaster', 'patient_id');
    }

    async register(payload, userId) {
        return this.tx(async (tx) => {
            // 1️⃣ Check for Duplicate Mobile
            const existing = await tx.patientMaster.findFirst({
                where: { mobile_primary: payload.mobile_primary }
            });

            if (existing) throw new Error("Patient already registered with this mobile number.");

            // 2️⃣ UHID Generation Logic
            const seq = await tx.uhidSequence.upsert({
                where: { branch_id: BigInt(payload.hospital_branch_id) },
                update: { last_number: { increment: 1 } },
                create: {
                    branch_id: BigInt(payload.hospital_branch_id),
                    last_number: 1,
                    prefix: 'HMS'
                }
            });

            const year = new Date().getFullYear();
            const uhid = payload.uhid || `${seq.prefix}-${year}-${seq.last_number.toString().padStart(7, '0')}`;

            // 3️⃣ Create Patient Record
            const patient = await tx.patientMaster.create({
                data: {
                    uhid,
                    first_name: payload.first_name,
                    middle_name: payload.middle_name || null,
                    last_name: payload.last_name,
                    age: payload.age || 0,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                    mobile_primary: payload.mobile_primary,
                    mobile_alternate: payload.mobile_alternate || null,
                    email: payload.email || null,
                    hospital_branch_id: BigInt(payload.hospital_branch_id),
                    patient_category_id: BigInt(payload.patient_category_id),
                    created_by: BigInt(userId),
                    demographics: {
                        create: {
                            marital_status_id: payload.marital_status_id ? BigInt(payload.marital_status_id) : null,
                            blood_group_id: payload.blood_group_id ? BigInt(payload.blood_group_id) : null,
                        }
                    },
                    addresses: {
                        create: {
                            address_line1: payload.address_line1,
                            city: payload.city,
                            state: payload.state,
                            pincode: payload.pincode,
                        }
                    }
                }
            });

            // 4️⃣ Audit Log
            await tx.auditLog.create({
                data: {
                    entity_type: 'PATIENT',
                    entity_id: patient.patient_id,
                    action: 'REGISTER',
                    performed_by: BigInt(userId),
                    details: `Registered UHID: ${uhid}`
                }
            });

            return { patient_id: patient.patient_id, uhid };
        });
    }

    async getFullDetails(id) {
        return this.model.findUnique({
            where: { patient_id: BigInt(id) },
            include: {
                demographics: true,
                addresses: true,
                emergency_contacts: true,
                consents: true
            }
        });
    }
}

module.exports = new PatientService();
