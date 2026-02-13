-- =============================================
-- Migration: 005_ipd_discharge_schema
-- Description: IPD Discharge, Diagnosis, Procedures, Medication, Follow-up, Settlement, and Audit
-- Created: 2026-02-13
-- =============================================

-- 1️⃣ MAIN DISCHARGE TABLE
CREATE TABLE IF NOT EXISTS ipd_discharges (
    discharge_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,

    discharge_number VARCHAR(50) UNIQUE NOT NULL,

    discharge_type ENUM('NORMAL','LAMA','DAMA','DEATH','TRANSFER') NOT NULL,
    discharge_status ENUM('DRAFT','UNDER_REVIEW','FINALIZED','CANCELLED') DEFAULT 'DRAFT',

    discharge_date DATETIME NOT NULL,
    discharge_time DATETIME,

    condition_at_discharge VARCHAR(255),
    discharge_notes TEXT,
    discharge_summary LONGTEXT,

    is_medico_legal BOOLEAN DEFAULT FALSE,

    prepared_by BIGINT,
    reviewed_by BIGINT,
    approved_by BIGINT,

    bed_released_at DATETIME,
    bed_released_by BIGINT,

    finalized_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id),
    FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
);

-- 2️⃣ DISCHARGE DIAGNOSIS (ICD Based)
CREATE TABLE IF NOT EXISTS ipd_discharge_diagnosis (
    diagnosis_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    discharge_id BIGINT NOT NULL,

    diagnosis_type ENUM('PRIMARY','SECONDARY','COMORBIDITY'),
    icd_code VARCHAR(20),
    diagnosis_name VARCHAR(255),
    remarks TEXT,

    FOREIGN KEY (discharge_id) REFERENCES ipd_discharges(discharge_id)
);

-- 3️⃣ DISCHARGE PROCEDURES
CREATE TABLE IF NOT EXISTS ipd_discharge_procedures (
    procedure_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    discharge_id BIGINT NOT NULL,

    procedure_code VARCHAR(50),
    procedure_name VARCHAR(255),
    procedure_date DATETIME,

    surgeon_id BIGINT,
    assistant_id BIGINT,

    anesthesia_type VARCHAR(100),
    procedure_notes TEXT,

    FOREIGN KEY (discharge_id) REFERENCES ipd_discharges(discharge_id)
);

-- 4️⃣ DISCHARGE MEDICATIONS
CREATE TABLE IF NOT EXISTS ipd_discharge_medications (
    medication_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    discharge_id BIGINT NOT NULL,

    medicine_name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),

    route VARCHAR(50),
    instructions TEXT,

    FOREIGN KEY (discharge_id) REFERENCES ipd_discharges(discharge_id)
);

-- 5️⃣ FOLLOW-UP PLAN
CREATE TABLE IF NOT EXISTS ipd_discharge_followups (
    followup_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    discharge_id BIGINT NOT NULL,

    followup_date DATE,
    department_id BIGINT,
    doctor_id BIGINT,

    instructions TEXT,
    auto_opd_booking BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (discharge_id) REFERENCES ipd_discharges(discharge_id)
);

-- 6️⃣ FINAL SETTLEMENT SNAPSHOT
CREATE TABLE IF NOT EXISTS ipd_discharge_settlement (
    settlement_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    discharge_id BIGINT NOT NULL UNIQUE,

    gross_amount DECIMAL(15,2),
    total_discount DECIMAL(15,2),
    total_tax DECIMAL(15,2),

    insurance_claimed DECIMAL(15,2),
    insurance_approved DECIMAL(15,2),

    advance_paid DECIMAL(15,2),
    total_paid DECIMAL(15,2),

    refund_amount DECIMAL(15,2),
    balance_due DECIMAL(15,2),

    settlement_status ENUM('PENDING','SETTLED','REFUND_PENDING'),

    settled_by BIGINT,
    settled_at DATETIME,

    FOREIGN KEY (discharge_id) REFERENCES ipd_discharges(discharge_id)
);

-- 7️⃣ DISCHARGE DOCUMENTS
CREATE TABLE IF NOT EXISTS ipd_discharge_documents (
    document_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    discharge_id BIGINT NOT NULL,

    document_type ENUM('SUMMARY','ADVICE','DEATH_CERTIFICATE','INVESTIGATION_REPORT'),
    file_path VARCHAR(500),

    uploaded_by BIGINT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (discharge_id) REFERENCES ipd_discharges(discharge_id)
);

-- 8️⃣ DEATH DETAILS (If Applicable)
CREATE TABLE IF NOT EXISTS ipd_discharge_death_details (
    death_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    discharge_id BIGINT NOT NULL UNIQUE,

    death_time DATETIME,
    cause_of_death TEXT,
    immediate_cause TEXT,
    underlying_cause TEXT,

    informed_to_family BOOLEAN DEFAULT FALSE,
    body_handover_time DATETIME,

    FOREIGN KEY (discharge_id) REFERENCES ipd_discharges(discharge_id)
);

-- 9️⃣ AUDIT TRAIL
CREATE TABLE IF NOT EXISTS ipd_discharge_audit (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    discharge_id BIGINT,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,

    changed_by BIGINT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),

    FOREIGN KEY (discharge_id) REFERENCES ipd_discharges(discharge_id)
);

-- 🔟 READMISSION TRACKING
CREATE TABLE IF NOT EXISTS ipd_readmission_tracking (
    readmission_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    previous_discharge_id BIGINT,
    new_admission_id BIGINT,

    readmission_reason TEXT,
    within_30_days BOOLEAN,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (previous_discharge_id) REFERENCES ipd_discharges(discharge_id),
    FOREIGN KEY (new_admission_id) REFERENCES ipd_admission_master(ipd_admission_id)
);
