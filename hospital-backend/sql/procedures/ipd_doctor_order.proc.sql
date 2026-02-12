-- =============================================
-- Procedure: IPD Doctor Order System
-- Description: Procedures for Order Master and Type-Specific Orders
-- Created: 2026-02-12
-- =============================================

DELIMITER $$

-- 1️⃣ PROCEDURE: Create IPD Order Master
DROP PROCEDURE IF EXISTS sp_create_ipd_order_master$$
CREATE PROCEDURE sp_create_ipd_order_master (
    IN p_ipd_admission_id BIGINT,
    IN p_doctor_id BIGINT,
    IN p_priority VARCHAR(20),       -- Routine, Urgent, Stat
    IN p_order_source VARCHAR(20),   -- Manual, Template, Verbal, Standing
    IN p_verbal_order_flag BOOLEAN,
    IN p_verbal_order_verified_by BIGINT,
    IN p_clinical_notes TEXT,
    IN p_is_package_case BOOLEAN,
    IN p_created_by BIGINT
)
BEGIN
    DECLARE v_order_master_id BIGINT;
    
    INSERT INTO ipd_order_master (
        ipd_admission_id,
        doctor_id,
        order_datetime,
        priority,
        order_source,
        verbal_order_flag,
        verbal_order_verified_by,
        order_status,
        clinical_notes,
        is_package_case,
        created_by
    )
    VALUES (
        p_ipd_admission_id,
        p_doctor_id,
        NOW(),
        p_priority,
        p_order_source,
        p_verbal_order_flag,
        p_verbal_order_verified_by,
        'Active',
        p_clinical_notes,
        p_is_package_case,
        p_created_by
    );

    SET v_order_master_id = LAST_INSERT_ID();

    -- Audit Log
    INSERT INTO ipd_order_audit (
        order_master_id,
        action,
        action_by,
        remarks
    )
    VALUES (
        v_order_master_id,
        'CREATE',
        p_created_by,
        'Created Order Master'
    );

    SELECT v_order_master_id AS order_master_id;
END$$

-- 2️⃣ PROCEDURE: Add Order Item (Generic)
DROP PROCEDURE IF EXISTS sp_add_ipd_order_item$$
CREATE PROCEDURE sp_add_ipd_order_item (
    IN p_order_master_id BIGINT,
    IN p_order_type VARCHAR(20),     -- Lab, Radiology, Medication, Procedure, Diet, Nursing
    IN p_reference_code BIGINT,
    IN p_scheduled_datetime DATETIME,
    IN p_is_critical BOOLEAN,
    IN p_remarks TEXT
)
BEGIN
    DECLARE v_order_item_id BIGINT;

    INSERT INTO ipd_order_items (
        order_master_id,
        order_type,
        reference_code,
        scheduled_datetime,
        order_status,
        is_critical,
        remarks
    )
    VALUES (
        p_order_master_id,
        p_order_type,
        p_reference_code,
        p_scheduled_datetime,
        'Ordered',
        p_is_critical,
        p_remarks
    );

    SET v_order_item_id = LAST_INSERT_ID();
    
    SELECT v_order_item_id AS order_item_id;
END$$

-- 3️⃣ PROCEDURE: Add Medication Order
DROP PROCEDURE IF EXISTS sp_add_ipd_medication_order$$
CREATE PROCEDURE sp_add_ipd_medication_order (
    IN p_order_item_id BIGINT,
    IN p_drug_id BIGINT,
    IN p_generic_name VARCHAR(150),
    IN p_dose VARCHAR(50),
    IN p_dose_unit VARCHAR(20),
    IN p_frequency VARCHAR(50),
    IN p_route VARCHAR(20),
    IN p_infusion_rate VARCHAR(50),
    IN p_dilution_instruction TEXT,
    IN p_start_datetime DATETIME,
    IN p_end_datetime DATETIME,
    IN p_is_prn BOOLEAN,
    IN p_max_daily_dose VARCHAR(50),
    IN p_high_alert_flag BOOLEAN
)
BEGIN
    INSERT INTO ipd_medication_orders (
        order_item_id,
        drug_id,
        generic_name,
        dose,
        dose_unit,
        frequency,
        route,
        infusion_rate,
        dilution_instruction,
        start_datetime,
        end_datetime,
        is_prn,
        max_daily_dose,
        high_alert_flag
    )
    VALUES (
        p_order_item_id,
        p_drug_id,
        p_generic_name,
        p_dose,
        p_dose_unit,
        p_frequency,
        p_route,
        p_infusion_rate,
        p_dilution_instruction,
        p_start_datetime,
        p_end_datetime,
        p_is_prn,
        p_max_daily_dose,
        p_high_alert_flag
    );
END$$

DELIMITER ;
