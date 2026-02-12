-- =============================================
-- Procedure: IPD Admission Workflow
-- Description: Core IPD logic for Admission, Clinical Details, Bed Allocation, etc.
-- Created: 2026-02-12
-- =============================================

DELIMITER $$

-- 1️⃣ PROCEDURE: Create IPD Admission (CORE)
DROP PROCEDURE IF EXISTS sp_create_ipd_admission$$
CREATE PROCEDURE sp_create_ipd_admission (
    IN p_patient_id BIGINT,
    IN p_opd_visit_id BIGINT,
    IN p_admission_date DATETIME,
    IN p_admission_type VARCHAR(20),       -- Emergency, Planned, Direct
    IN p_hospital_branch_id BIGINT,
    IN p_department_id BIGINT,
    IN p_admitting_doctor_id BIGINT,
    IN p_consultant_doctor_id BIGINT,
    IN p_patient_category VARCHAR(20),     -- Self-Pay, Insurance, Corporate, Ayushman
    IN p_primary_diagnosis VARCHAR(255),
    IN p_provisional_diagnosis VARCHAR(255),
    IN p_icd10_code VARCHAR(20),
    IN p_expected_discharge_date DATE,
    IN p_is_mlc BOOLEAN,
    IN p_mlc_number VARCHAR(50),
    IN p_created_by BIGINT
)
BEGIN
    DECLARE v_admission_no VARCHAR(30);
    DECLARE v_ipd_admission_id BIGINT;
    DECLARE v_year_count INT;
    
    -- A) GENERATE ADMISSION NO: IPD-YYYY-000001
    SELECT COUNT(*) INTO v_year_count 
    FROM ipd_admission_master 
    WHERE YEAR(created_at) = YEAR(CURDATE());
    
    SET v_admission_no = CONCAT('IPD-', YEAR(CURDATE()), '-', LPAD(v_year_count + 1, 6, '0'));

    -- B) INSERT ADMISSION MASTER
    INSERT INTO ipd_admission_master (
        admission_no,
        patient_id,
        opd_visit_id,
        admission_date,
        admission_type,
        hospital_branch_id,
        department_id,
        admitting_doctor_id,
        consultant_doctor_id,
        patient_category,
        primary_diagnosis,
        provisional_diagnosis,
        icd10_code,
        admission_status,
        expected_discharge_date,
        is_mlc,
        mlc_number,
        created_by
    )
    VALUES (
        v_admission_no,
        p_patient_id,
        p_opd_visit_id,
        p_admission_date,
        p_admission_type,
        p_hospital_branch_id,
        p_department_id,
        p_admitting_doctor_id,
        p_consultant_doctor_id,
        p_patient_category,
        p_primary_diagnosis,
        p_provisional_diagnosis,
        p_icd10_code,
        'Admitted',
        p_expected_discharge_date,
        p_is_mlc,
        p_mlc_number,
        p_created_by
    );

    SET v_ipd_admission_id = LAST_INSERT_ID();

    -- C) AUDIT LOG
    INSERT INTO ipd_audit_log (
        ipd_admission_id,
        action,
        action_by,
        remarks
    )
    VALUES (
        v_ipd_admission_id,
        'CREATE',
        p_created_by,
        CONCAT('Created IPD Admission: ', v_admission_no)
    );

    -- Return New IDs
    SELECT v_ipd_admission_id AS ipd_admission_id, v_admission_no AS admission_no;

END$$

-- 2️⃣ PROCEDURE: Save IPD Clinical Details
DROP PROCEDURE IF EXISTS sp_save_ipd_clinical_details$$
CREATE PROCEDURE sp_save_ipd_clinical_details (
    IN p_ipd_admission_id BIGINT,
    IN p_chief_complaint TEXT,
    IN p_past_medical_history TEXT,
    IN p_allergies TEXT,
    IN p_current_medication TEXT,
    IN p_comorbidities TEXT,
    IN p_risk_category VARCHAR(20),
    IN p_pregnancy_status BOOLEAN,
    IN p_dnr_status BOOLEAN
)
BEGIN
    INSERT INTO ipd_clinical_details (
        ipd_admission_id,
        chief_complaint,
        past_medical_history,
        allergies,
        current_medication,
        comorbidities,
        risk_category,
        pregnancy_status,
        dnr_status
    )
    VALUES (
        p_ipd_admission_id,
        p_chief_complaint,
        p_past_medical_history,
        p_allergies,
        p_current_medication,
        p_comorbidities,
        p_risk_category,
        p_pregnancy_status,
        p_dnr_status
    );
END$$

-- 3️⃣ PROCEDURE: Allocate IPD Bed
DROP PROCEDURE IF EXISTS sp_allocate_ipd_bed$$
CREATE PROCEDURE sp_allocate_ipd_bed (
    IN p_ipd_admission_id BIGINT,
    IN p_ward_id BIGINT,
    IN p_bed_id BIGINT,
    IN p_bed_type VARCHAR(20),
    IN p_allocation_start DATETIME,
    IN p_isolation_required BOOLEAN
)
BEGIN
    INSERT INTO ipd_bed_allocation (
        ipd_admission_id,
        ward_id,
        bed_id,
        bed_type,
        allocation_start,
        isolation_required
    )
    VALUES (
        p_ipd_admission_id,
        p_ward_id,
        p_bed_id,
        p_bed_type,
        p_allocation_start,
        p_isolation_required
    );
END$$

-- 4️⃣ PROCEDURE: Save IPD Vitals Monitoring
DROP PROCEDURE IF EXISTS sp_save_ipd_vitals_monitoring$$
CREATE PROCEDURE sp_save_ipd_vitals_monitoring (
    IN p_ipd_admission_id BIGINT,
    IN p_recorded_by BIGINT,
    IN p_height_cm DECIMAL(5,2),
    IN p_weight_kg DECIMAL(5,2),
    IN p_bmi DECIMAL(5,2),
    IN p_blood_pressure VARCHAR(20),
    IN p_pulse_rate INT,
    IN p_temperature DECIMAL(4,1),
    IN p_spo2 DECIMAL(4,1),
    IN p_respiratory_rate INT,
    IN p_gcs_score INT,
    IN p_remarks VARCHAR(255)
)
BEGIN
    INSERT INTO ipd_vitals_monitoring (
        ipd_admission_id,
        recorded_by,
        recorded_at,
        height_cm,
        weight_kg,
        bmi,
        blood_pressure,
        pulse_rate,
        temperature,
        spo2,
        respiratory_rate,
        gcs_score,
        remarks
    )
    VALUES (
        p_ipd_admission_id,
        p_recorded_by,
        NOW(),
        p_height_cm,
        p_weight_kg,
        p_bmi,
        p_blood_pressure,
        p_pulse_rate,
        p_temperature,
        p_spo2,
        p_respiratory_rate,
        p_gcs_score,
        p_remarks
    );
END$$

DELIMITER ;
