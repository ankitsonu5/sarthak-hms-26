const { prisma } = require('../../../config/db');

exports.uploadDocument = async (payload, userId) => {
    const result = await prisma.$queryRaw`
        INSERT INTO insurance_claim_document
        (claim_id, preauth_id, document_type_id, file_name, file_path, uploaded_by)
        VALUES (${payload.claim_id || null}, ${payload.preauth_id || null},
                ${payload.document_type_id}, ${payload.file_name},
                ${payload.file_path}, ${userId})
        RETURNING *`;

    const doc = await prisma.$queryRaw`
        SELECT cd.*, dt.document_name
        FROM insurance_claim_document cd
        LEFT JOIN master_claim_document_type dt ON cd.document_type_id = dt.document_type_id
        WHERE cd.claim_document_id = ${result[0].claim_document_id}`;
    return doc[0];
};

exports.getDocumentsByClaim = async (claimId) => {
    return prisma.$queryRaw`
        SELECT cd.*, dt.document_name, dt.is_mandatory
        FROM insurance_claim_document cd
        LEFT JOIN master_claim_document_type dt ON cd.document_type_id = dt.document_type_id
        WHERE cd.claim_id = ${claimId}
        ORDER BY cd.uploaded_at DESC`;
};

exports.getDocumentsByPreauth = async (preauthId) => {
    return prisma.$queryRaw`
        SELECT cd.*, dt.document_name, dt.is_mandatory
        FROM insurance_claim_document cd
        LEFT JOIN master_claim_document_type dt ON cd.document_type_id = dt.document_type_id
        WHERE cd.preauth_id = ${preauthId}
        ORDER BY cd.uploaded_at DESC`;
};

exports.deleteDocument = async (documentId) => {
    const existing = await prisma.$queryRaw`
        SELECT * FROM insurance_claim_document WHERE claim_document_id = ${documentId}`;
    if (!existing.length) return null;

    await prisma.$executeRaw`
        DELETE FROM insurance_claim_document WHERE claim_document_id = ${documentId}`;
    return existing[0];
};

exports.getDocumentChecklist = async (claimId) => {
    const required = await prisma.$queryRaw`
        SELECT dt.document_type_id, dt.document_name, dt.is_mandatory,
               dt.is_pre_auth_document, dt.is_final_claim_document
        FROM master_claim_document_type dt
        WHERE dt.is_active = TRUE`;

    const uploaded = await prisma.$queryRaw`
        SELECT document_type_id FROM insurance_claim_document WHERE claim_id = ${claimId}`;

    const uploadedTypeIds = new Set(uploaded.map(d => d.document_type_id));

    return required.map(doc => ({
        ...doc,
        is_uploaded: uploadedTypeIds.has(doc.document_type_id)
    }));
};
