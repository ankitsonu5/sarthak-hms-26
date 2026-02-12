-- =============================================
-- Procedure: IPD Billing Engine
-- Description: Core billing logic for Bill Creation, Item Addition, and Payments
-- Created: 2026-02-12
-- =============================================

DELIMITER $$

-- 1️⃣ PROCEDURE: Create IPD Bill (Initial/Provisional)
DROP PROCEDURE IF EXISTS sp_create_ipd_bill$$
CREATE PROCEDURE sp_create_ipd_bill (
    IN p_admission_id BIGINT,
    IN p_bill_type VARCHAR(20),      -- PROVISIONAL, INTERIM, FINAL
    IN p_created_by BIGINT
)
BEGIN
    DECLARE v_bill_no VARCHAR(50);
    DECLARE v_bill_id BIGINT;
    DECLARE v_year_count INT;
    
    -- A) GENERATE BILL NO: BILL-YYYY-000001
    SELECT COUNT(*) INTO v_year_count 
    FROM ipd_bill 
    WHERE YEAR(created_at) = YEAR(CURDATE());
    
    SET v_bill_no = CONCAT('BILL-', YEAR(CURDATE()), '-', LPAD(v_year_count + 1, 6, '0'));

    -- B) INSERT BILL HEADER
    INSERT INTO ipd_bill (
        admission_id,
        bill_number,
        bill_type,
        bill_status,
        created_at
    )
    VALUES (
        p_admission_id,
        v_bill_no,
        p_bill_type,
        'RUNNING',
        NOW()
    );

    SET v_bill_id = LAST_INSERT_ID();

    -- Return New ID
    SELECT v_bill_id AS bill_id, v_bill_no AS bill_number;

END$$

-- 2️⃣ PROCEDURE: Add IPD Bill Item
DROP PROCEDURE IF EXISTS sp_add_ipd_bill_item$$
CREATE PROCEDURE sp_add_ipd_bill_item (
    IN p_bill_id BIGINT,
    IN p_service_type VARCHAR(20),
    IN p_service_id BIGINT,
    IN p_service_name VARCHAR(255),
    IN p_quantity DECIMAL(10,2),
    IN p_unit_price DECIMAL(15,2),
    IN p_discount_percent DECIMAL(5,2),
    IN p_tax_percent DECIMAL(5,2),
    IN p_doctor_id BIGINT,
    IN p_department_id BIGINT,
    IN p_cost_center_id BIGINT
)
BEGIN
    DECLARE v_gross_amount DECIMAL(15,2);
    DECLARE v_discount_amount DECIMAL(15,2);
    DECLARE v_taxable_amount DECIMAL(15,2);
    DECLARE v_tax_amount DECIMAL(15,2);
    DECLARE v_net_amount DECIMAL(15,2);

    -- Calculations
    SET v_gross_amount = p_quantity * p_unit_price;
    SET v_discount_amount = v_gross_amount * (p_discount_percent / 100);
    SET v_taxable_amount = v_gross_amount - v_discount_amount;
    SET v_tax_amount = v_taxable_amount * (p_tax_percent / 100);
    SET v_net_amount = v_taxable_amount + v_tax_amount;

    INSERT INTO ipd_bill_items (
        bill_id,
        service_type,
        service_id,
        service_name,
        quantity,
        unit_price,
        gross_amount,
        discount_percent,
        discount_amount,
        taxable_amount,
        tax_percent,
        tax_amount,
        net_amount,
        doctor_id,
        department_id,
        cost_center_id,
        performed_at
    )
    VALUES (
        p_bill_id,
        p_service_type,
        p_service_id,
        p_service_name,
        p_quantity,
        p_unit_price,
        v_gross_amount,
        p_discount_percent,
        v_discount_amount,
        v_taxable_amount,
        p_tax_percent,
        v_tax_amount,
        v_net_amount,
        p_doctor_id,
        p_department_id,
        p_cost_center_id,
        NOW()
    );

    -- Proactively update Bill Header summary
    UPDATE ipd_bill 
    SET gross_amount = (SELECT SUM(gross_amount) FROM ipd_bill_items WHERE bill_id = p_bill_id AND item_status = 'ACTIVE'),
        total_discount = (SELECT SUM(discount_amount) FROM ipd_bill_items WHERE bill_id = p_bill_id AND item_status = 'ACTIVE'),
        total_tax = (SELECT SUM(tax_amount) FROM ipd_bill_items WHERE bill_id = p_bill_id AND item_status = 'ACTIVE'),
        net_amount = (SELECT SUM(net_amount) FROM ipd_bill_items WHERE bill_id = p_bill_id AND item_status = 'ACTIVE'),
        total_due_amount = net_amount - total_paid_amount
    WHERE bill_id = p_bill_id;

END$$

-- 3️⃣ PROCEDURE: Process IPD Payment
DROP PROCEDURE IF EXISTS sp_process_ipd_payment$$
CREATE PROCEDURE sp_process_ipd_payment (
    IN p_bill_id BIGINT,
    IN p_amount DECIMAL(15,2),
    IN p_payment_mode VARCHAR(20),
    IN p_reference_number VARCHAR(100),
    IN p_received_by BIGINT
)
BEGIN
    INSERT INTO ipd_payments (
        bill_id,
        payment_date,
        payment_mode,
        reference_number,
        amount,
        received_by,
        payment_status
    )
    VALUES (
        p_bill_id,
        NOW(),
        p_payment_mode,
        p_reference_number,
        p_amount,
        p_received_by,
        'SUCCESS'
    );

    -- Update Bill Header summary
    UPDATE ipd_bill 
    SET total_paid_amount = (SELECT SUM(amount) FROM ipd_payments WHERE bill_id = p_bill_id AND payment_status = 'SUCCESS'),
        total_due_amount = net_amount - total_paid_amount
    WHERE bill_id = p_bill_id;

END$$

DELIMITER ;
