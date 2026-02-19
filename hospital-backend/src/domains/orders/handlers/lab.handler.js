exports.processIPDLab = async (conn, orderItemId, details) => {
    await conn.query(
        `INSERT INTO ipd_lab_orders (order_item_id, lab_test_id, sample_type, fasting_required) VALUES (?, ?, ?, ?)`,
        [orderItemId, details.lab_test_id, details.sample_type, details.fasting_required ? 1 : 0]
    );
};

exports.processCPOELab = async (conn, itemId, item) => {
    await conn.query(
        `INSERT INTO lab_sample_tracking
        (order_item_id, sample_type, fasting_required, result_status)
        VALUES (?, ?, ?, 'Pending')`,
        [itemId, item.sample_type, item.fasting_required || false]
    );
};
