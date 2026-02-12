const db = require('../../../config/db');

exports.createBill = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            'CALL sp_create_ipd_bill(?, ?, ?)',
            [payload.admission_id, payload.bill_type || 'PROVISIONAL', userId]
        );

        const bill = result[0][0];

        await conn.commit();
        return bill;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.addBillItem = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            'CALL sp_add_ipd_bill_item(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                payload.bill_id,
                payload.service_type,
                payload.service_id,
                payload.service_name,
                payload.quantity || 1,
                payload.unit_price,
                payload.discount_percent || 0,
                payload.tax_percent || 0,
                payload.doctor_id || null,
                payload.department_id || null,
                payload.cost_center_id || null
            ]
        );

        // Fetch updated bill header
        const [updatedBill] = await conn.query('SELECT * FROM ipd_bill WHERE bill_id = ?', [payload.bill_id]);

        await conn.commit();
        return updatedBill[0];
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.processPayment = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            'CALL sp_process_ipd_payment(?, ?, ?, ?, ?)',
            [
                payload.bill_id,
                payload.amount,
                payload.payment_mode || 'CASH',
                payload.reference_number || null,
                userId
            ]
        );

        const [updatedBill] = await conn.query('SELECT * FROM ipd_bill WHERE bill_id = ?', [payload.bill_id]);

        await conn.commit();
        return updatedBill[0];
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getBillDetails = async (billId) => {
    const conn = await db.getConnection();
    try {
        const [bill] = await conn.query('SELECT * FROM ipd_bill WHERE bill_id = ?', [billId]);
        if (!bill.length) throw new Error('Bill not found');

        const [items] = await conn.query('SELECT * FROM ipd_bill_items WHERE bill_id = ? AND item_status = "ACTIVE"', [billId]);
        const [payments] = await conn.query('SELECT * FROM ipd_payments WHERE bill_id = ?', [billId]);

        return {
            header: bill[0],
            items: items,
            payments: payments
        };
    } finally {
        conn.release();
    }
};
