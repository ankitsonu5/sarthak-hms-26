exports.processIPDDiet = async (tx, orderItemId, details) => {
    await tx.$executeRaw`
        INSERT INTO ipd_diet_orders (order_item_id, diet_type, calories, npo_flag, feeding_route)
        VALUES (${orderItemId}, ${details.diet_type}, ${details.calories}, ${details.npo_flag || false}, ${details.feeding_route})`;
};

exports.processIPDNursing = async (tx, orderItemId, details) => {
    await tx.$executeRaw`
        INSERT INTO ipd_nursing_orders (order_item_id, instruction, frequency)
        VALUES (${orderItemId}, ${details.instruction}, ${details.frequency})`;
};
