exports.processIPDDiet = async (conn, orderItemId, details) => {
    await conn.query(
        `INSERT INTO ipd_diet_orders (order_item_id, diet_type, calories, npo_flag, feeding_route) VALUES (?, ?, ?, ?, ?)`,
        [orderItemId, details.diet_type, details.calories, details.npo_flag ? 1 : 0, details.feeding_route]
    );
};

exports.processIPDNursing = async (conn, orderItemId, details) => {
    await conn.query(
        `INSERT INTO ipd_nursing_orders (order_item_id, instruction, frequency) VALUES (?, ?, ?)`,
        [orderItemId, details.instruction, details.frequency]
    );
};
