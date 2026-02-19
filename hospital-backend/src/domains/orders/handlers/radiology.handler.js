exports.processIPDRadiology = async (conn, orderItemId, details) => {
    await conn.query(
        `INSERT INTO ipd_radiology_orders (order_item_id, radiology_test_id, clinical_indication, contrast_required) VALUES (?, ?, ?, ?)`,
        [orderItemId, details.radiology_test_id, details.clinical_indication, details.contrast_required ? 1 : 0]
    );
};

exports.processCPOERadiology = async (conn, itemId, item) => {
    await conn.query(
        `INSERT INTO radiology_execution
        (order_item_id, contrast_required, sedation_required)
        VALUES (?, ?, ?)`,
        [itemId, item.contrast_required || false, item.sedation_required || false]
    );
};
