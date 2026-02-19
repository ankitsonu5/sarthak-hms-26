-- =============================================
-- Migration: 002_opd_appointment_schema
-- Description: OPD Appointment and Encounter Schema (Visit, Vitals, Billing, Insurance, Followup, Audit)
-- Created: 2026-01-28
-- =============================================

-- =============================================
-- 1️⃣ opd_visit_master (CORE TABLE – MOST IMPORTANT)
-- =============================================
CREATE TABLE IF NOT EXISTS opd_visit_master (
    opd_visit_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    visit_no VARCHAR(30) NOT NULL UNIQUE,   -- OPD-2025-000123
    patient_id BIGINT NOT NULL,

    visit_type ENUM(
        'New',
        'Follow-up',
        'Review'
    ) NOT NULL,

    appointment_type ENUM(
        'Walk-In',
        'Walk-in',
        'Pre-Booked',
        'Emergency'
    ) NOT NULL,

    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,

    hospital_branch_id BIGINT NOT NULL,

    department_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,

    opd_room VARCHAR(50),

    token_no INT NOT NULL,
    queue_type ENUM(
        'Normal',
        'Regular',
        'VIP',
        'Emergency'
    ) DEFAULT 'Normal',

    chief_complaint TEXT NOT NULL,
    complaint_duration VARCHAR(50),

    visit_reason ENUM(
        'Consultation',
        'Report Review',
        'Second Opinion',
        'Procedure'
    ),

    encounter_status ENUM(
        'Waiting',
        'With Doctor',
        'Completed',
        'Closed'
    ) DEFAULT 'Waiting',

    created_by BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
);

-- =============================================
-- 2️⃣ opd_vitals (NURSE / TRIAGE)
-- =============================================
CREATE TABLE IF NOT EXISTS opd_vitals (
    vitals_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    opd_visit_id BIGINT NOT NULL,

    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(5,2),

    blood_pressure VARCHAR(20),  -- 120/80
    pulse_rate INT,
    temperature DECIMAL(4,1),
    spo2 DECIMAL(4,1),

    recorded_by BIGINT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (opd_visit_id) REFERENCES opd_visit_master(opd_visit_id)
);

-- =============================================
-- 3️⃣ opd_billing (CONSULTATION BILLING)
-- =============================================
CREATE TABLE IF NOT EXISTS opd_billing (
    opd_billing_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    opd_visit_id BIGINT NOT NULL,

    consultation_fee DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_reason VARCHAR(255),

    net_amount DECIMAL(10,2) NOT NULL,

    payment_mode ENUM(
        'Cash',
        'UPI',
        'Card',
        'Insurance',
        'Corporate',
        'Ayushman'
    ) NOT NULL,

    payment_status ENUM(
        'Paid',
        'Pending',
        'Waived'
    ) DEFAULT 'Pending',

    payment_datetime DATETIME,

    FOREIGN KEY (opd_visit_id) REFERENCES opd_visit_master(opd_visit_id)
);

-- =============================================
-- 4️⃣ opd_insurance_corporate (TAGGING ONLY)
-- =============================================
CREATE TABLE IF NOT EXISTS opd_insurance_corporate (
    opd_insurance_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    opd_visit_id BIGINT NOT NULL,

    patient_category ENUM(
        'Self-Pay',
        'Corporate',
        'Insurance',
        'Ayushman'
    ) NOT NULL,

    corporate_name VARCHAR(150),
    insurance_company VARCHAR(150),
    tpa_name VARCHAR(150),

    authorization_required BOOLEAN DEFAULT FALSE,
    authorization_status ENUM(
        'Not Required',
        'Pending',
        'Approved',
        'Rejected'
    ) DEFAULT 'Not Required',

    FOREIGN KEY (opd_visit_id) REFERENCES opd_visit_master(opd_visit_id)
);

-- =============================================
-- 5️⃣ opd_followup (NEXT ACTION)
-- =============================================
CREATE TABLE IF NOT EXISTS opd_followup (
    followup_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    opd_visit_id BIGINT NOT NULL,

    followup_required BOOLEAN DEFAULT FALSE,
    followup_date DATE,

    admission_advised BOOLEAN DEFAULT FALSE,

    referred_to_doctor_id BIGINT,
    referred_department_id BIGINT,

    FOREIGN KEY (opd_visit_id) REFERENCES opd_visit_master(opd_visit_id)
);

-- =============================================
-- 6️⃣ opd_audit_log (LEGAL + NABH MUST)
-- =============================================
CREATE TABLE IF NOT EXISTS opd_audit_log (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    opd_visit_id BIGINT NOT NULL,

    action ENUM(
        'CREATE',
        'UPDATE',
        'CLOSE'
    ) NOT NULL,

    action_by BIGINT NOT NULL,
    action_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,

    remarks VARCHAR(255),

    FOREIGN KEY (opd_visit_id) REFERENCES opd_visit_master(opd_visit_id)
);
