exports.processIPDRadiology = async (tx, orderItemId, details) => {
    await tx.$executeRaw`
        INSERT INTO ipd_radiology_orders (order_item_id, radiology_test_id, clinical_indication, contrast_required)
        VALUES (${orderItemId}, ${details.radiology_test_id}, ${details.clinical_indication}, ${details.contrast_required || false})`;
};

exports.processCPOERadiology = async (tx, itemId, item) => {
    await tx.$executeRaw`
        INSERT INTO radiology_execution
        (order_item_id, contrast_required, sedation_required)
        VALUES (${itemId}, ${item.contrast_required || false}, ${item.sedation_required || false})`;
};
