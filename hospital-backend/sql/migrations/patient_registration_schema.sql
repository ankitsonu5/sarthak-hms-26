-- =============================================
-- Migration: 001_patient_registration_schema
-- Description: Core patient registration tables with master data normalization AND Infrastructure (UHID, Audit)
-- Created: 2026-01-24
-- =============================================

-- =============================================
-- 0️⃣ INFRASTRUCTURE TABLES (Sequence & Audit)
-- =============================================

-- 1. UHID Sequence Table (For backend generation)
CREATE TABLE IF NOT EXISTS uhid_sequence (
    branch_id BIGINT PRIMARY KEY,
    last_number BIGINT NOT NULL,
    prefix VARCHAR(10) NOT NULL
);

-- Seed initial sequence for Main Hospital (Branch ID 1 assumed, or handled in seed)
-- INSERT INTO uhid_sequence (branch_id, last_number, prefix) VALUES (1, 0, 'HMS'); 
-- (Moved to seed data to avoid hardcoding here)

-- 2. Audit Log (Core Legal Requirement)
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT, 
    performed_by BIGINT,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- 3. Hospital Branch (Dependency)
CREATE TABLE IF NOT EXISTS hospital_branch (
    branch_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    branch_name VARCHAR(100) NOT NULL UNIQUE,
    branch_code VARCHAR(20) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 1️⃣ MASTER DATA TABLES (Dropdown Controls)
-- =============================================

-- Patient Category (Self, Insurance, etc.)
CREATE TABLE IF NOT EXISTS master_patient_category (
    category_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) UNIQUE NOT NULL
);

-- Marital Status
CREATE TABLE IF NOT EXISTS master_marital_status (
    marital_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) UNIQUE NOT NULL
);

-- Blood Group
CREATE TABLE IF NOT EXISTS master_blood_group (
    blood_group_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(10) UNIQUE NOT NULL
);

-- Occupation
CREATE TABLE IF NOT EXISTS master_occupation (
    occupation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    occupation_name VARCHAR(100) UNIQUE NOT NULL
);

-- Education Level
CREATE TABLE IF NOT EXISTS master_education_level (
    education_level_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    level_name VARCHAR(100) UNIQUE NOT NULL
);

-- Socio-Economic Class
CREATE TABLE IF NOT EXISTS master_socio_economic_class (
    class_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(100) UNIQUE NOT NULL
);

-- Relationship (for Emergency Contacts)
CREATE TABLE IF NOT EXISTS master_relationship (
    relationship_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    relationship_name VARCHAR(50) UNIQUE NOT NULL
);

-- =============================================
-- 2️⃣ CORE PATIENT TABLES
-- =============================================

-- 1. Patient Master (CORE)
CREATE TABLE IF NOT EXISTS patient_master (
    patient_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    uhid VARCHAR(30) NOT NULL UNIQUE,  -- Generated via fn_generate_uhid

    first_name  VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name   VARCHAR(100) NOT NULL,

    age INT NOT NULL,                 -- Calculated via fn_calculate_age
    date_of_birth DATE NOT NULL,

    gender ENUM (
        'Male',
        'Female',
        'Other',
        'Transgender',
        'Prefer not to say'
    ) NOT NULL,

    mobile_primary   VARCHAR(15) NOT NULL,
    mobile_alternate VARCHAR(15),
    email VARCHAR(150),

    nationality VARCHAR(50) DEFAULT 'Indian',

    hospital_branch_id BIGINT NOT NULL,
    patient_category_id BIGINT NOT NULL,

    is_vip BOOLEAN DEFAULT FALSE,
    is_mlc BOOLEAN DEFAULT FALSE,
    is_unknown_patient BOOLEAN DEFAULT FALSE,

    registration_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_by BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    status ENUM ('Active','Inactive','Deceased') DEFAULT 'Active',

    CONSTRAINT fk_patient_branch
        FOREIGN KEY (hospital_branch_id) REFERENCES hospital_branch(branch_id),
    
    CONSTRAINT fk_patient_category
        FOREIGN KEY (patient_category_id) REFERENCES master_patient_category(category_id)
);

-- 2. Patient Demographics (Extended Info)
CREATE TABLE IF NOT EXISTS patient_demographics (
    patient_id BIGINT PRIMARY KEY,

    marital_status_id BIGINT,
    blood_group_id BIGINT,
    occupation_id BIGINT,
    education_level_id BIGINT,
    socio_economic_class_id BIGINT,

    CONSTRAINT fk_demo_patient
        FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_demo_marital
        FOREIGN KEY (marital_status_id) REFERENCES master_marital_status(marital_status_id),
    
    CONSTRAINT fk_demo_blood
        FOREIGN KEY (blood_group_id) REFERENCES master_blood_group(blood_group_id),
    
    CONSTRAINT fk_demo_occupation
        FOREIGN KEY (occupation_id) REFERENCES master_occupation(occupation_id),
    
    CONSTRAINT fk_demo_education
        FOREIGN KEY (education_level_id) REFERENCES master_education_level(education_level_id),
    
    CONSTRAINT fk_demo_socio
        FOREIGN KEY (socio_economic_class_id) REFERENCES master_socio_economic_class(class_id)
);

-- 3. Patient Address
CREATE TABLE IF NOT EXISTS patient_address (
    address_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,

    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),

    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10) NOT NULL,

    is_primary BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_address_patient
        FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
        ON DELETE CASCADE
);

-- 4. Patient Emergency Contact
CREATE TABLE IF NOT EXISTS patient_emergency_contact (
    emergency_contact_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,

    contact_name VARCHAR(150) NOT NULL,
    relationship_id BIGINT NOT NULL,
    mobile VARCHAR(15) NOT NULL,

    CONSTRAINT fk_emergency_patient
        FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_emergency_relationship
        FOREIGN KEY (relationship_id) REFERENCES master_relationship(relationship_id)
);

-- 5. Patient Consent (Legal)
CREATE TABLE IF NOT EXISTS patient_consent (
    consent_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,

    consent_to_treatment BOOLEAN NOT NULL DEFAULT FALSE,
    consent_to_share_reports BOOLEAN NOT NULL DEFAULT FALSE,

    consent_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_consent_patient
        FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
        ON DELETE CASCADE
);

-- 6. Patient Documents
CREATE TABLE IF NOT EXISTS patient_documents (
    document_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,

    document_type ENUM ('Photo','Signature','Thumb Impression') NOT NULL,
    file_path VARCHAR(255) NOT NULL,

    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doc_patient
        FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
        ON DELETE CASCADE
);

-- 7. Patient Identifiers (QR / Barcode / ABHA)
CREATE TABLE IF NOT EXISTS patient_identifier (
    identifier_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,

    identifier_type ENUM ('QR','BARCODE','ABHA') NOT NULL,
    identifier_value VARCHAR(100) NOT NULL,

    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_identifier_patient
        FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
        ON DELETE CASCADE
);
