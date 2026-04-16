const { prisma } = require('../../config/db');

exports.createBill = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        // 1️⃣ Generate Bill Number
        const year = new Date().getFullYear();
        const count = await tx.ipdBill.count();
        const billNumber = `BILL-${year}-${(count + 1).toString().padStart(6, '0')}`;

        // 2️⃣ Create Bill Header
        const bill = await tx.ipdBill.create({
            data: {
                admission_id: BigInt(payload.admission_id),
                bill_number: billNumber,
                bill_type: payload.bill_type || 'PROVISIONAL',
                bill_status: 'RUNNING'
            }
        });

        return bill;
    });
};

exports.addBillItem = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        const qty = payload.quantity || 1;
        const price = payload.unit_price;
        const disc = payload.discount_percent || 0;
        const tax = payload.tax_percent || 0;

        const gross = qty * price;
        const discAmt = gross * (disc / 100);
        const taxable = gross - discAmt;
        const taxAmt = taxable * (tax / 100);
        const net = taxable + taxAmt;

        // 1️⃣ Create Bill Item
        await tx.ipdBillItem.create({
            data: {
                bill_id: BigInt(payload.bill_id),
                service_type: payload.service_type,
                service_id: payload.service_id ? BigInt(payload.service_id) : null,
                service_name: payload.service_name,
                quantity: qty,
                unit_price: price,
                gross_amount: gross,
                discount_percent: disc,
                discount_amount: discAmt,
                taxable_amount: taxable,
                tax_percent: tax,
                tax_amount: taxAmt,
                net_amount: net,
                doctor_id: payload.doctor_id ? BigInt(payload.doctor_id) : null,
                department_id: payload.department_id ? BigInt(payload.department_id) : null,
                cost_center_id: payload.cost_center_id ? BigInt(payload.cost_center_id) : null
            }
        });

        // 2️⃣ Update Bill Totals
        const aggregate = await tx.ipdBillItem.aggregate({
            where: { bill_id: BigInt(payload.bill_id), item_status: 'ACTIVE' },
            _sum: {
                gross_amount: true,
                discount_amount: true,
                tax_amount: true,
                net_amount: true
            }
        });

        const updatedBill = await tx.ipdBill.update({
            where: { bill_id: BigInt(payload.bill_id) },
            data: {
                gross_amount: aggregate._sum.gross_amount || 0,
                total_discount: aggregate._sum.discount_amount || 0,
                total_tax: aggregate._sum.tax_amount || 0,
                net_amount: aggregate._sum.net_amount || 0,
                total_due_amount: (aggregate._sum.net_amount || 0) - (await tx.ipdPayment.aggregate({
                    where: { bill_id: BigInt(payload.bill_id), payment_status: 'SUCCESS' },
                    _sum: { amount: true }
                }))._sum.amount || 0
            }
        });

        return updatedBill;
    });
};

exports.processPayment = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        // 1️⃣ Record Payment
        await tx.ipdPayment.create({
            data: {
                bill_id: BigInt(payload.bill_id),
                payment_date: new Date(),
                payment_mode: payload.payment_mode || 'CASH',
                reference_number: payload.reference_number || null,
                amount: payload.amount,
                received_by: BigInt(userId),
                payment_status: 'SUCCESS'
            }
        });

        // 2️⃣ Update Bill Paid/Due
        const totalPaid = await tx.ipdPayment.aggregate({
            where: { bill_id: BigInt(payload.bill_id), payment_status: 'SUCCESS' },
            _sum: { amount: true }
        });

        const bill = await tx.ipdBill.findUnique({ where: { bill_id: BigInt(payload.bill_id) } });

        const updatedBill = await tx.ipdBill.update({
            where: { bill_id: BigInt(payload.bill_id) },
            data: {
                total_paid_amount: totalPaid._sum.amount || 0,
                total_due_amount: (bill.net_amount || 0) - (totalPaid._sum.amount || 0)
            }
        });

        return updatedBill;
    });
};

exports.getBillDetails = async (billId) => {
    return prisma.ipdBill.findUnique({
        where: { bill_id: BigInt(billId) },
        include: {
            items: { where: { item_status: 'ACTIVE' } },
            payments: true,
            admission: {
                include: { patient: true }
            }
        }
    });
};

exports.getAllBills = async () => {
    return prisma.ipdBill.findMany({
        include: {
            admission: {
                select: {
                    admission_no: true,
                    patient: {
                        select: { uhid: true, first_name: true, last_name: true }
                    }
                }
            }
        },
        orderBy: { created_at: 'desc' }
    });
};

