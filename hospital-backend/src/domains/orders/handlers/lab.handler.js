exports.processIPDLab = async (tx, orderItemId, details) => {
    await tx.$executeRaw`
        INSERT INTO ipd_lab_orders (order_item_id, lab_test_id, sample_type, fasting_required)
        VALUES (${orderItemId}, ${details.lab_test_id}, ${details.sample_type}, ${details.fasting_required || false})`;
};

exports.processCPOELab = async (tx, itemId, item) => {
    await tx.$executeRaw`
        INSERT INTO lab_sample_tracking
        (order_item_id, sample_type, fasting_required, result_status)
        VALUES (${itemId}, ${item.sample_type}, ${item.fasting_required || false}, 'Pending')`;
};
