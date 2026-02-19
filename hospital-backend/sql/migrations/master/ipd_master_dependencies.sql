-- =============================================
-- Master Data: IPD Admission Dependencies
-- Description: Normalized Master Tables for Admission Type, Status, Risk, Ward Type,
--              Bed Type/Status, Authorization, Billing Type, Consent, ICD10, etc.
-- Created: 2026-02-14
-- =============================================

-- 1️⃣ Admission Type Master (Replace ENUM)
-- Example: Emergency, Planned, Direct
CREATE TABLE IF NOT EXISTS master_admission_type (
    admission_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_type_name VARCHAR(50) UNIQUE NOT NULL,
    is_emergency BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ Admission Status Master
-- Example Flow: 1=Admitted, 2=Under Treatment, 3=Discharged, 4=Left AMA, 5=Expired
CREATE TABLE IF NOT EXISTS master_admission_status (
    admission_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    status_sequence INT,
    is_final BOOLEAN DEFAULT FALSE,
    is_bill_closure_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3️⃣ Patient Category Master (Shared Across System)
-- Already exists in patient_registration_schema.sql. Adding extra columns for IPD/Billing needs.
ALTER TABLE master_patient_category
    ADD COLUMN IF NOT EXISTS is_insurance_required BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN DEFAULT FALSE;

-- 4️⃣ Risk Category Master
-- Example: Low, Moderate, High, Critical
CREATE TABLE IF NOT EXISTS master_risk_category (
    risk_category_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    risk_name VARCHAR(50) UNIQUE NOT NULL,
    severity_level INT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5️⃣ Ward Type Master (Replace ENUM in master_ward)
CREATE TABLE IF NOT EXISTS master_ward_type (
    ward_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ward_type_name VARCHAR(100) UNIQUE NOT NULL,
    base_daily_rate DECIMAL(12,2),
    is_icu BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 6️⃣ Bed Status Master
-- Example: Available, Occupied, Cleaning, Maintenance
CREATE TABLE IF NOT EXISTS master_bed_status (
    bed_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    is_available BOOLEAN DEFAULT FALSE,
    is_occupiable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 7️⃣ Bed Type Master (Replace ENUM in allocation)
CREATE TABLE IF NOT EXISTS master_bed_type (
    bed_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bed_type_name VARCHAR(100) UNIQUE NOT NULL,
    daily_rate DECIMAL(12,2),
    is_icu BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 8️⃣ Insurance Authorization Status Master
-- Example: Pending, Approved, Rejected
CREATE TABLE IF NOT EXISTS master_authorization_status (
    authorization_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    is_final BOOLEAN DEFAULT FALSE,
    is_approval BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 9️⃣ Billing Type Master
-- Example: Open, Package
CREATE TABLE IF NOT EXISTS master_billing_type (
    billing_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    billing_type_name VARCHAR(50) UNIQUE NOT NULL,
    is_package BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 🔟 Payment Status Master (Shared With OPD)
-- Already created in opd_appointment_master_dependencies.sql. Adding extra column.
ALTER TABLE master_payment_status
    ADD COLUMN IF NOT EXISTS is_closure BOOLEAN DEFAULT FALSE;

-- 1️⃣1️⃣ Consent Type Master (Better Design - replaces boolean columns)
CREATE TABLE IF NOT EXISTS master_consent_type (
    consent_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    consent_name VARCHAR(100) UNIQUE NOT NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Scalable consent records (replaces old ipd_consent_records with boolean columns)
CREATE TABLE IF NOT EXISTS ipd_patient_consent (
    consent_record_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ipd_admission_id BIGINT NOT NULL,
    consent_type_id BIGINT NOT NULL,
    is_signed BOOLEAN DEFAULT FALSE,
    signed_by VARCHAR(150),
    signed_at DATETIME,

    FOREIGN KEY (ipd_admission_id)
        REFERENCES ipd_admission_master(ipd_admission_id),

    FOREIGN KEY (consent_type_id)
        REFERENCES master_consent_type(consent_type_id)
);

-- 1️⃣2️⃣ ICD10 Master (Medical Standard)
CREATE TABLE IF NOT EXISTS master_icd10 (
    icd10_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    icd10_code VARCHAR(20) UNIQUE NOT NULL,
    icd10_description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- 🔄 Add FK columns to ipd_admission_master (Replace ENUMs with Master Table References)
-- =============================================
ALTER TABLE ipd_admission_master
    ADD COLUMN admission_type_id BIGINT NULL,
    ADD COLUMN admission_status_id BIGINT NULL,
    ADD COLUMN patient_category_id BIGINT NULL,
    ADD COLUMN icd10_id BIGINT NULL,

    ADD CONSTRAINT fk_ipd_admission_type
        FOREIGN KEY (admission_type_id)
        REFERENCES master_admission_type(admission_type_id),

    ADD CONSTRAINT fk_ipd_admission_status
        FOREIGN KEY (admission_status_id)
        REFERENCES master_admission_status(admission_status_id),

    ADD CONSTRAINT fk_ipd_patient_category
        FOREIGN KEY (patient_category_id)
        REFERENCES master_patient_category(category_id),

    ADD CONSTRAINT fk_ipd_icd10
        FOREIGN KEY (icd10_id)
        REFERENCES master_icd10(icd10_id),

    ADD CONSTRAINT fk_ipd_admitting_doctor
        FOREIGN KEY (admitting_doctor_id)
        REFERENCES master_doctor(doctor_id),

    ADD CONSTRAINT fk_ipd_consultant_doctor
        FOREIGN KEY (consultant_doctor_id)
        REFERENCES master_doctor(doctor_id),

    ADD CONSTRAINT fk_ipd_department
        FOREIGN KEY (department_id)
        REFERENCES master_department(department_id);

-- =============================================
-- 🔄 Add FK columns to ipd_clinical_details (Replace risk_category ENUM)
-- =============================================
ALTER TABLE ipd_clinical_details
    ADD COLUMN risk_category_id BIGINT NULL,

    ADD CONSTRAINT fk_ipd_clinical_risk
        FOREIGN KEY (risk_category_id)
        REFERENCES master_risk_category(risk_category_id);

-- =============================================
-- 🔄 Add FK columns to master_ward (Replace ward_type ENUM)
-- =============================================
ALTER TABLE master_ward
    ADD COLUMN ward_type_id BIGINT NULL,

    ADD CONSTRAINT fk_ward_type
        FOREIGN KEY (ward_type_id)
        REFERENCES master_ward_type(ward_type_id);

-- =============================================
-- 🔄 Add FK columns to master_bed (Replace bed_status ENUM)
-- =============================================
ALTER TABLE master_bed
    ADD COLUMN bed_status_id BIGINT NULL,

    ADD CONSTRAINT fk_bed_status
        FOREIGN KEY (bed_status_id)
        REFERENCES master_bed_status(bed_status_id);

-- =============================================
-- 🔄 Add FK columns to ipd_bed_allocation (Replace bed_type ENUM)
-- =============================================
ALTER TABLE ipd_bed_allocation
    ADD COLUMN bed_type_id BIGINT NULL,
    ADD COLUMN allocation_status VARCHAR(20) DEFAULT 'Allocated',

    ADD CONSTRAINT fk_bed_allocation_type
        FOREIGN KEY (bed_type_id)
        REFERENCES master_bed_type(bed_type_id);

-- =============================================
-- 🔄 Add FK columns to ipd_insurance_details (Replace authorization_status ENUM)
-- =============================================
ALTER TABLE ipd_insurance_details
    ADD COLUMN insurance_company_id BIGINT NULL,
    ADD COLUMN tpa_id BIGINT NULL,
    ADD COLUMN authorization_status_id BIGINT NULL,

    ADD CONSTRAINT fk_ipd_ins_company
        FOREIGN KEY (insurance_company_id)
        REFERENCES master_insurance_company(insurance_company_id),

    ADD CONSTRAINT fk_ipd_ins_tpa
        FOREIGN KEY (tpa_id)
        REFERENCES master_tpa(tpa_id),

    ADD CONSTRAINT fk_ipd_ins_auth_status
        FOREIGN KEY (authorization_status_id)
        REFERENCES master_authorization_status(authorization_status_id);

-- =============================================
-- 🔄 Add FK columns to ipd_financials (Replace billing_type & payment_status ENUMs)
-- =============================================
ALTER TABLE ipd_financials
    ADD COLUMN billing_type_id BIGINT NULL,
    ADD COLUMN payment_status_id BIGINT NULL,

    ADD CONSTRAINT fk_ipd_fin_billing_type
        FOREIGN KEY (billing_type_id)
        REFERENCES master_billing_type(billing_type_id),

    ADD CONSTRAINT fk_ipd_fin_payment_status
        FOREIGN KEY (payment_status_id)
        REFERENCES master_payment_status(payment_status_id);
