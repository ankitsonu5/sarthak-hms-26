-- =============================================
-- Procedure: Patient Registration Workflow (Backend Logic Enhanced)
-- Description: Core registration with UHID generation, Validation, and Audit
-- Created: 2026-01-24
-- =============================================

DELIMITER $$

-- 1️⃣ PROCEDURE: Create Patient (CORE + VALIDATION + UHID + AUDIT)
DROP PROCEDURE IF EXISTS sp_create_patient_master$$
CREATE PROCEDURE sp_create_patient_master (
    IN p_uhid_input VARCHAR(30), -- Optional: if null, we generate
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    -- IN p_age INT, -- REMOVED: Calculated from DOB
    IN p_dob DATE,
    IN p_gender VARCHAR(30),
    IN p_mobile_primary VARCHAR(15),
    IN p_mobile_alternate VARCHAR(15),
    IN p_email VARCHAR(150),
    IN p_branch_id BIGINT,
    IN p_patient_category_id BIGINT,
    IN p_created_by BIGINT
)
BEGIN
    DECLARE v_new_uhid VARCHAR(30);
    DECLARE v_calc_age INT;
    DECLARE v_patient_id BIGINT;
    DECLARE v_existing_id BIGINT;
    DECLARE v_prefix VARCHAR(10);
    DECLARE v_last_seq BIGINT;

    -- A) DUPLICATE CHECK (Mobile)
    SELECT patient_id INTO v_existing_id 
    FROM patient_master 
    WHERE mobile_primary = p_mobile_primary 
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Patient already registered with this mobile number.';
    END IF;

    -- B) UHID GENERATION (If not provided)
    IF p_uhid_input IS NULL OR p_uhid_input = '' THEN
        -- Locking read for sequence
        SELECT last_number, prefix INTO v_last_seq, v_prefix
        FROM uhid_sequence
        WHERE branch_id = p_branch_id
        FOR UPDATE;

        IF v_prefix IS NULL THEN
            -- Fallback if sequence not init
            SET v_prefix = 'HMS';
            SET v_last_seq = 0;
            INSERT INTO uhid_sequence (branch_id, last_number, prefix) VALUES (p_branch_id, 0, 'HMS');
        END IF;

        SET v_last_seq = v_last_seq + 1;

        -- Update Sequence
        UPDATE uhid_sequence 
        SET last_number = v_last_seq 
        WHERE branch_id = p_branch_id;

        -- Format: PRE-YYYY-000000N
        SET v_new_uhid = CONCAT(v_prefix, '-', YEAR(CURDATE()), '-', LPAD(v_last_seq, 7, '0'));
    ELSE
        SET v_new_uhid = p_uhid_input;
    END IF;

    -- C) AGE CALCULATION (Consistency)
    SET v_calc_age = fn_calculate_age(p_dob);

    -- D) INSERT PATIENT MASTER
    INSERT INTO patient_master (
        uhid,
        first_name,
        middle_name,
        last_name,
        age,
        date_of_birth,
        gender,
        mobile_primary,
        mobile_alternate,
        email,
        hospital_branch_id,
        patient_category_id,
        created_by
    )
    VALUES (
        v_new_uhid,
        p_first_name,
        p_middle_name,
        p_last_name,
        v_calc_age,
        p_dob,
        p_gender,
        p_mobile_primary,
        p_mobile_alternate,
        p_email,
        p_branch_id,
        p_patient_category_id,
        p_created_by
    );

    SET v_patient_id = LAST_INSERT_ID();

    -- E) AUDIT LOG
    INSERT INTO audit_log (
        entity_type, 
        entity_id, 
        action, 
        performed_by,
        details
    )
    VALUES (
        'PATIENT',
        v_patient_id,
        'REGISTER',
        p_created_by,
        CONCAT('Registered new patient: ', v_new_uhid)
    );

    -- F) AUTO QR GENERATION (Backend Logic)
    CALL sp_generate_patient_identifier(v_patient_id, 'QR', v_new_uhid);

    -- Return ID and UHID for Frontend
    SELECT v_patient_id AS patient_id, v_new_uhid AS uhid;

END$$

-- 2️⃣ PROCEDURE: Save Patient Demographics
DROP PROCEDURE IF EXISTS sp_save_patient_demographics$$
CREATE PROCEDURE sp_save_patient_demographics (
    IN p_patient_id BIGINT,
    IN p_marital_status_id BIGINT,
    IN p_blood_group_id BIGINT,
    IN p_occupation_id BIGINT,
    IN p_education_level_id BIGINT,
    IN p_socio_economic_class_id BIGINT
)
BEGIN
    INSERT INTO patient_demographics (
        patient_id,
        marital_status_id,
        blood_group_id,
        occupation_id,
        education_level_id,
        socio_economic_class_id
    )
    VALUES (
        p_patient_id,
        p_marital_status_id,
        p_blood_group_id,
        p_occupation_id,
        p_education_level_id,
        p_socio_economic_class_id
    )
    ON DUPLICATE KEY UPDATE
        marital_status_id = VALUES(marital_status_id),
        blood_group_id = VALUES(blood_group_id),
        occupation_id = VALUES(occupation_id),
        education_level_id = VALUES(education_level_id),
        socio_economic_class_id = VALUES(socio_economic_class_id);
END$$

-- 3️ PROCEDURE: Save Patient Address
DROP PROCEDURE IF EXISTS sp_save_patient_address$$
CREATE PROCEDURE sp_save_patient_address (
    IN p_patient_id BIGINT,
    IN p_address_line1 VARCHAR(255),
    IN p_address_line2 VARCHAR(255),
    IN p_city VARCHAR(100),
    IN p_state VARCHAR(100),
    IN p_country VARCHAR(100),
    IN p_pincode VARCHAR(10)
)
BEGIN
    INSERT INTO patient_address (
        patient_id,
        address_line1,
        address_line2,
        city,
        state,
        country,
        pincode
    )
    VALUES (
        p_patient_id,
        p_address_line1,
        p_address_line2,
        p_city,
        p_state,
        p_country,
        p_pincode
    );
END$$

-- 4️ PROCEDURE: Save Emergency Contact
DROP PROCEDURE IF EXISTS sp_save_emergency_contact$$
CREATE PROCEDURE sp_save_emergency_contact (
    IN p_patient_id BIGINT,
    IN p_contact_name VARCHAR(150),
    IN p_relationship_id BIGINT,
    IN p_mobile VARCHAR(15)
)
BEGIN
    INSERT INTO patient_emergency_contact (
        patient_id,
        contact_name,
        relationship_id,
        mobile
    )
    VALUES (
        p_patient_id,
        p_contact_name,
        p_relationship_id,
        p_mobile
    );
END$$

--  PROCEDURE: Save Patient Consent (LEGAL)
DROP PROCEDURE IF EXISTS sp_save_patient_consent$$
CREATE PROCEDURE sp_save_patient_consent (
    IN p_patient_id BIGINT,
    IN p_consent_treatment BOOLEAN,
    IN p_consent_share BOOLEAN
)
BEGIN
    INSERT INTO patient_consent (
        patient_id,
        consent_to_treatment,
        consent_to_share_reports
    )
    VALUES (
        p_patient_id,
        p_consent_treatment,
        p_consent_share
    );
END$$

--  PROCEDURE: Generate QR / Barcode
DROP PROCEDURE IF EXISTS sp_generate_patient_identifier$$
CREATE PROCEDURE sp_generate_patient_identifier (
    IN p_patient_id BIGINT,
    IN p_identifier_type VARCHAR(20),
    IN p_identifier_value VARCHAR(100)
)
BEGIN
    INSERT INTO patient_identifier (
        patient_id,
        identifier_type,
        identifier_value
    )
    VALUES (
        p_patient_id,
        p_identifier_type,
        p_identifier_value
    );
END$$

DELIMITER ;
