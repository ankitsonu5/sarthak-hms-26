const db = require('../../../config/db');

exports.uploadDocument = async (payload, userId) => {
    const [result] = await db.query(
        `INSERT INTO insurance_claim_document
         (claim_id, preauth_id, document_type_id, file_name, file_path, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            payload.claim_id || null,
            payload.preauth_id || null,
            payload.document_type_id,
            payload.file_name,
            payload.file_path,
            userId
        ]
    );

    const [doc] = await db.query(
        `SELECT cd.*, dt.document_name
         FROM insurance_claim_document cd
         LEFT JOIN master_claim_document_type dt ON cd.document_type_id = dt.document_type_id
         WHERE cd.claim_document_id = ?`,
        [result.insertId]
    );
    return doc[0];
};

exports.getDocumentsByClaim = async (claimId) => {
    const [rows] = await db.query(
        `SELECT cd.*, dt.document_name, dt.is_mandatory
         FROM insurance_claim_document cd
         LEFT JOIN master_claim_document_type dt ON cd.document_type_id = dt.document_type_id
         WHERE cd.claim_id = ?
         ORDER BY cd.uploaded_at DESC`,
        [claimId]
    );
    return rows;
};

exports.getDocumentsByPreauth = async (preauthId) => {
    const [rows] = await db.query(
        `SELECT cd.*, dt.document_name, dt.is_mandatory
         FROM insurance_claim_document cd
         LEFT JOIN master_claim_document_type dt ON cd.document_type_id = dt.document_type_id
         WHERE cd.preauth_id = ?
         ORDER BY cd.uploaded_at DESC`,
        [preauthId]
    );
    return rows;
};

exports.deleteDocument = async (documentId) => {
    const [existing] = await db.query(
        'SELECT * FROM insurance_claim_document WHERE claim_document_id = ?',
        [documentId]
    );
    if (!existing.length) return null;

    await db.query(
        'DELETE FROM insurance_claim_document WHERE claim_document_id = ?',
        [documentId]
    );
    return existing[0];
};

exports.getDocumentChecklist = async (claimId) => {
    const [required] = await db.query(
        `SELECT dt.document_type_id, dt.document_name, dt.is_mandatory,
                dt.is_pre_auth_document, dt.is_final_claim_document
         FROM master_claim_document_type dt
         WHERE dt.is_active = TRUE`
    );

    const [uploaded] = await db.query(
        `SELECT document_type_id FROM insurance_claim_document WHERE claim_id = ?`,
        [claimId]
    );

    const uploadedTypeIds = new Set(uploaded.map(d => d.document_type_id));

    return required.map(doc => ({
        ...doc,
        is_uploaded: uploadedTypeIds.has(doc.document_type_id)
    }));
};
