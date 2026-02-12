-- =============================================
-- Procedure: OPD Visit Workflow
-- Description: Core OPD logic for Visit Creation, Vitals, Billing and Followup
-- Created: 2026-01-28
-- =============================================

DELIMITER $$

-- 1️⃣ PROCEDURE: Create OPD Visit (CORE)
DROP PROCEDURE IF EXISTS sp_create_opd_visit$$
CREATE PROCEDURE sp_create_opd_visit (
    IN p_patient_id BIGINT,
    IN p_visit_type VARCHAR(20),       -- New, Follow-up, Review
    IN p_appointment_type VARCHAR(20), -- Walk-In, Pre-Booked, Emergency
    IN p_visit_date DATE,
    IN p_visit_time TIME,
    IN p_branch_id BIGINT,
    IN p_department_id BIGINT,
    IN p_doctor_id BIGINT,
    IN p_opd_room VARCHAR(50),
    IN p_queue_type VARCHAR(20),       -- Normal, VIP, Emergency
    IN p_chief_complaint TEXT,
    IN p_complaint_duration VARCHAR(50),
    IN p_visit_reason VARCHAR(50),     -- Consultation, Report Review, etc.
    IN p_created_by BIGINT
)
BEGIN
    DECLARE v_visit_no VARCHAR(30);
    DECLARE v_token_no INT;
    DECLARE v_opd_visit_id BIGINT;
    DECLARE v_daily_count INT;
    DECLARE v_year_count INT;
    
    -- A) GENERATE VISIT NO: OPD-YYYY-000001
    -- (Simple Logic: Count for year + 1. In high concurrency, use a sequence table)
    SELECT COUNT(*) INTO v_year_count 
    FROM opd_visit_master 
    WHERE YEAR(created_at) = YEAR(CURDATE());
    
    SET v_visit_no = CONCAT('OPD-', YEAR(CURDATE()), '-', LPAD(v_year_count + 1, 6, '0'));

    -- B) GENERATE TOKEN NO (Per Department/Doctor Per Day)
    -- Logic: Count visits for this doctor on this date
    SELECT COUNT(*) INTO v_daily_count 
    FROM opd_visit_master 
    WHERE doctor_id = p_doctor_id AND visit_date = p_visit_date;
    
    SET v_token_no = v_daily_count + 1;

    -- C) INSERT VISIT MASTER
    INSERT INTO opd_visit_master (
        visit_no,
        patient_id,
        visit_type,
        appointment_type,
        visit_date,
        visit_time,
        hospital_branch_id,
        department_id,
        doctor_id,
        opd_room,
        token_no,
        queue_type,
        chief_complaint,
        complaint_duration,
        visit_reason,
        encounter_status,
        created_by
    )
    VALUES (
        v_visit_no,
        p_patient_id,
        p_visit_type,
        p_appointment_type,
        p_visit_date,
        p_visit_time,
        p_branch_id,
        p_department_id,
        p_doctor_id,
        p_opd_room,
        v_token_no,
        p_queue_type,
        p_chief_complaint,
        p_complaint_duration,
        p_visit_reason,
        'Waiting', -- Default Status
        p_created_by
    );

    SET v_opd_visit_id = LAST_INSERT_ID();

    -- D) AUDIT LOG
    INSERT INTO opd_audit_log (
        opd_visit_id,
        action,
        action_by,
        remarks
    )
    VALUES (
        v_opd_visit_id,
        'CREATE',
        p_created_by,
        CONCAT('Created Visit: ', v_visit_no)
    );

    -- Return New IDs
    SELECT v_opd_visit_id AS opd_visit_id, v_visit_no AS visit_no, v_token_no AS token_no;

END$$

-- 2️⃣ PROCEDURE: Save OPD Vitals
DROP PROCEDURE IF EXISTS sp_save_opd_vitals$$
CREATE PROCEDURE sp_save_opd_vitals (
    IN p_opd_visit_id BIGINT,
    IN p_height_cm DECIMAL(5,2),
    IN p_weight_kg DECIMAL(5,2),
    IN p_bmi DECIMAL(5,2),
    IN p_blood_pressure VARCHAR(20),
    IN p_pulse_rate INT,
    IN p_temperature DECIMAL(4,1),
    IN p_spo2 DECIMAL(4,1),
    IN p_recorded_by BIGINT
)
BEGIN
    INSERT INTO opd_vitals (
        opd_visit_id,
        height_cm,
        weight_kg,
        bmi,
        blood_pressure,
        pulse_rate,
        temperature,
        spo2,
        recorded_by
    )
    VALUES (
        p_opd_visit_id,
        p_height_cm,
        p_weight_kg,
        p_bmi,
        p_blood_pressure,
        p_pulse_rate,
        p_temperature,
        p_spo2,
        p_recorded_by
    );
END$$

-- 3️⃣ PROCEDURE: Save OPD Billing (Initial)
DROP PROCEDURE IF EXISTS sp_save_opd_billing$$
CREATE PROCEDURE sp_save_opd_billing (
    IN p_opd_visit_id BIGINT,
    IN p_consultation_fee DECIMAL(10,2),
    IN p_discount_amount DECIMAL(10,2),
    IN p_discount_reason VARCHAR(255),
    IN p_net_amount DECIMAL(10,2),
    IN p_payment_mode VARCHAR(20),
    IN p_payment_status VARCHAR(20)
)
BEGIN
    INSERT INTO opd_billing (
        opd_visit_id,
        consultation_fee,
        discount_amount,
        discount_reason,
        net_amount,
        payment_mode,
        payment_status,
        payment_datetime
    )
    VALUES (
        p_opd_visit_id,
        p_consultation_fee,
        p_discount_amount,
        p_discount_reason,
        p_net_amount,
        p_payment_mode,
        p_payment_status,
        NOW()
    );
END$$

-- 4️⃣ PROCEDURE: Save Insurance / Corporate Tagging
DROP PROCEDURE IF EXISTS sp_save_opd_insurance$$
CREATE PROCEDURE sp_save_opd_insurance (
    IN p_opd_visit_id BIGINT,
    IN p_patient_category VARCHAR(20),
    IN p_corporate_name VARCHAR(150),
    IN p_insurance_company VARCHAR(150),
    IN p_tpa_name VARCHAR(150),
    IN p_auth_required BOOLEAN
)
BEGIN
    INSERT INTO opd_insurance_corporate (
        opd_visit_id,
        patient_category,
        corporate_name,
        insurance_company,
        tpa_name,
        authorization_required,
        authorization_status
    )
    VALUES (
        p_opd_visit_id,
        p_patient_category,
        p_corporate_name,
        p_insurance_company,
        p_tpa_name,
        p_auth_required,
        IF(p_auth_required, 'Pending', 'Not Required')
    );
END$$

-- 5️⃣ PROCEDURE: Update Encounter Status (Doctor/Nurse Action)
DROP PROCEDURE IF EXISTS sp_update_opd_status$$
CREATE PROCEDURE sp_update_opd_status (
    IN p_opd_visit_id BIGINT,
    IN p_new_status VARCHAR(20),
    IN p_updated_by BIGINT
)
BEGIN
    UPDATE opd_visit_master
    SET encounter_status = p_new_status
    WHERE opd_visit_id = p_opd_visit_id;

    -- Audit
    INSERT INTO opd_audit_log (
        opd_visit_id,
        action,
        action_by,
        remarks
    )
    VALUES (
        p_opd_visit_id,
        'UPDATE',
        p_updated_by,
        CONCAT('Status changed to: ', p_new_status)
    );
END$$

DELIMITER ;
