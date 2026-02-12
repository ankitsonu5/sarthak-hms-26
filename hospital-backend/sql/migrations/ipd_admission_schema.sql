-- =============================================
-- Migration: 003_ipd_admission_schema
-- Description: IPD Admission Complete Database Schema (Core, Clinical, Bed, Vitals, Insurance, Financials, Consent, Audit)
-- Created: 2026-02-12
-- =============================================

-- 1️⃣ ipd_admission_master (CORE TABLE)
CREATE TABLE IF NOT EXISTS ipd_admission_master (
    ipd_admission_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    admission_no VARCHAR(30) NOT NULL UNIQUE,   -- IPD-2026-000123
    patient_id BIGINT NOT NULL,
    opd_visit_id BIGINT NULL,

    admission_date DATETIME NOT NULL,
    discharge_date DATETIME NULL,

    admission_type ENUM(
        'Emergency',
        'Planned',
        'Direct'
    ) NOT NULL,

    hospital_branch_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,

    admitting_doctor_id BIGINT NOT NULL,
    consultant_doctor_id BIGINT NULL,

    patient_category ENUM(
        'Self-Pay',
        'Insurance',
        'Corporate',
        'Ayushman'
    ) NOT NULL,

    primary_diagnosis VARCHAR(255),
    provisional_diagnosis VARCHAR(255),
    icd10_code VARCHAR(20),

    admission_status ENUM(
        'Admitted',
        'Under Treatment',
        'Discharged',
        'Left AMA',
        'Expired'
    ) DEFAULT 'Admitted',

    expected_discharge_date DATE,
    length_of_stay INT,

    is_mlc BOOLEAN DEFAULT FALSE,
    mlc_number VARCHAR(50),

    created_by BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at DATETIME,

    FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id),
    FOREIGN KEY (opd_visit_id) REFERENCES opd_visit_master(opd_visit_id)
);


-- 2️⃣ ipd_clinical_details
CREATE TABLE IF NOT EXISTS ipd_clinical_details (
    clinical_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ipd_admission_id BIGINT NOT NULL,

    chief_complaint TEXT,
    past_medical_history TEXT,
    allergies TEXT,
    current_medication TEXT,
    comorbidities TEXT,

    risk_category ENUM(
        'Low',
        'Moderate',
        'High',
        'Critical'
    ),

    pregnancy_status BOOLEAN,
    dnr_status BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (ipd_admission_id)
    REFERENCES ipd_admission_master(ipd_admission_id)
);


-- 0️⃣ IPD MASTER TABLES (WARDS & BEDS)
CREATE TABLE IF NOT EXISTS master_ward (
    ward_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ward_name VARCHAR(100) NOT NULL UNIQUE,
    ward_type ENUM('General', 'Semi-Private', 'Private', 'ICU', 'NICU', 'Emergency') NOT NULL,
    floor_no VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS master_bed (
    bed_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ward_id BIGINT NOT NULL,
    bed_number VARCHAR(50) NOT NULL,
    bed_status ENUM('Available', 'Occupied', 'Cleaning', 'Maintenance') DEFAULT 'Available',
    FOREIGN KEY (ward_id) REFERENCES master_ward(ward_id),
    UNIQUE(ward_id, bed_number)
);

-- 3️⃣ ipd_bed_allocation
CREATE TABLE IF NOT EXISTS ipd_bed_allocation (
    bed_allocation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ipd_admission_id BIGINT NOT NULL,

    ward_id BIGINT NOT NULL,
    bed_id BIGINT NOT NULL,
    bed_type ENUM(
        'General',
        'Semi-Private',
        'Private',
        'ICU',
        'NICU',
        'OT Recovery'
    ) NOT NULL,

    allocation_start DATETIME NOT NULL,
    allocation_end DATETIME NULL,

    isolation_required BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (ipd_admission_id) REFERENCES ipd_admission_master(ipd_admission_id),
    FOREIGN KEY (ward_id) REFERENCES master_ward(ward_id),
    FOREIGN KEY (bed_id) REFERENCES master_bed(bed_id)
);


-- 4️⃣ ipd_vitals_monitoring
CREATE TABLE IF NOT EXISTS ipd_vitals_monitoring (
    vitals_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ipd_admission_id BIGINT NOT NULL,

    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    recorded_by BIGINT,

    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(5,2),

    blood_pressure VARCHAR(20),
    pulse_rate INT,
    temperature DECIMAL(4,1),
    spo2 DECIMAL(4,1),
    respiratory_rate INT,
    gcs_score INT,

    remarks VARCHAR(255),

    FOREIGN KEY (ipd_admission_id)
    REFERENCES ipd_admission_master(ipd_admission_id)
);


-- 5️⃣ ipd_insurance_details
CREATE TABLE IF NOT EXISTS ipd_insurance_details (
    insurance_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ipd_admission_id BIGINT NOT NULL,

    insurance_company VARCHAR(150),
    tpa_name VARCHAR(150),
    policy_number VARCHAR(50),

    corporate_name VARCHAR(150),

    authorization_required BOOLEAN DEFAULT TRUE,
    authorization_status ENUM(
        'Pending',
        'Approved',
        'Rejected'
    ) DEFAULT 'Pending',

    authorized_amount DECIMAL(12,2),
    copay_percentage DECIMAL(5,2),

    package_name VARCHAR(150),
    package_code VARCHAR(50),
    package_amount DECIMAL(12,2),

    FOREIGN KEY (ipd_admission_id)
    REFERENCES ipd_admission_master(ipd_admission_id)
);


-- 6️⃣ ipd_financials
CREATE TABLE IF NOT EXISTS ipd_financials (
    financial_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ipd_admission_id BIGINT NOT NULL,

    room_charges DECIMAL(12,2),
    procedure_charges DECIMAL(12,2),
    pharmacy_charges DECIMAL(12,2),
    lab_charges DECIMAL(12,2),
    other_charges DECIMAL(12,2),

    gross_amount DECIMAL(12,2),
    discount_amount DECIMAL(12,2),
    net_amount DECIMAL(12,2),

    advance_deposit DECIMAL(12,2),
    payment_status ENUM(
        'Paid',
        'Pending',
        'Partially Paid'
    ) DEFAULT 'Pending',

    billing_type ENUM(
        'Open',
        'Package'
    ) DEFAULT 'Open',

    FOREIGN KEY (ipd_admission_id)
    REFERENCES ipd_admission_master(ipd_admission_id)
);


-- 7️⃣ ipd_consent_records
CREATE TABLE IF NOT EXISTS ipd_consent_records (
    consent_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ipd_admission_id BIGINT NOT NULL,

    general_consent BOOLEAN DEFAULT FALSE,
    surgery_consent BOOLEAN DEFAULT FALSE,
    icu_consent BOOLEAN DEFAULT FALSE,
    blood_consent BOOLEAN DEFAULT FALSE,
    high_risk_consent BOOLEAN DEFAULT FALSE,

    consent_signed_by VARCHAR(150),
    consent_date DATETIME,

    FOREIGN KEY (ipd_admission_id)
    REFERENCES ipd_admission_master(ipd_admission_id)
);


-- 8️⃣ ipd_audit_log
CREATE TABLE IF NOT EXISTS ipd_audit_log (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ipd_admission_id BIGINT NOT NULL,

    action ENUM(
        'CREATE',
        'UPDATE',
        'BED_TRANSFER',
        'DISCHARGE',
        'EXPIRED'
    ),

    action_by BIGINT,
    action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    remarks VARCHAR(255),

    FOREIGN KEY (ipd_admission_id)
    REFERENCES ipd_admission_master(ipd_admission_id)
);
