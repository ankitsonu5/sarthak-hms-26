-- =============================================
-- Master Data: OPD Appointment Dependencies
-- Description: Normalized Master Tables for Department, Doctor, Schedule,
--              Visit Types, Appointment Types, Queue, Payment, Insurance, TPA, etc.
-- Created: 2026-02-14
-- =============================================

-- 1️⃣ Department Master (Very Critical)
-- OPD, IPD, Doctor mapping, Reporting sab isi se linked hoga.
CREATE TABLE IF NOT EXISTS master_department (
    department_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(150) NOT NULL UNIQUE,
    department_code VARCHAR(20) UNIQUE,
    department_type ENUM('Clinical','Diagnostic','Support') DEFAULT 'Clinical',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ Doctor Master
CREATE TABLE IF NOT EXISTS master_doctor (
    doctor_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    doctor_name VARCHAR(150) NOT NULL,
    doctor_code VARCHAR(30) UNIQUE,

    department_id BIGINT NOT NULL,

    qualification VARCHAR(255),
    specialization VARCHAR(255),

    consultation_fee DECIMAL(10,2),

    is_active BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_department
        FOREIGN KEY (department_id)
        REFERENCES master_department(department_id)
);

-- 3️⃣ Doctor Schedule Master
-- Token control & online booking ke liye required.
CREATE TABLE IF NOT EXISTS master_doctor_schedule (
    schedule_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    doctor_id BIGINT NOT NULL,

    day_of_week ENUM(
        'Monday','Tuesday','Wednesday',
        'Thursday','Friday','Saturday','Sunday'
    ) NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    max_tokens INT DEFAULT 50,

    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_schedule_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES master_doctor(doctor_id)
);

-- 4️⃣ Visit Type Master (Replace ENUM)
-- Example: New, Follow-up, Review
CREATE TABLE IF NOT EXISTS master_visit_type (
    visit_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    visit_type_name VARCHAR(50) UNIQUE NOT NULL,
    is_followup_allowed BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5️⃣ Appointment Type Master
-- Example: Walk-In, Pre-Booked, Emergency
CREATE TABLE IF NOT EXISTS master_appointment_type (
    appointment_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    appointment_type_name VARCHAR(50) UNIQUE NOT NULL,
    priority_level INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

-- 6️⃣ Queue Type Master
-- Example: Normal, VIP, Emergency
CREATE TABLE IF NOT EXISTS master_queue_type (
    queue_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    queue_name VARCHAR(50) UNIQUE NOT NULL,
    priority_weight INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

-- 7️⃣ Visit Reason Master
CREATE TABLE IF NOT EXISTS master_visit_reason (
    visit_reason_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reason_name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 8️⃣ Encounter Status Master
-- Example: Waiting, With Doctor, Completed, Closed
CREATE TABLE IF NOT EXISTS master_encounter_status (
    encounter_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    status_sequence INT,
    is_final BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 9️⃣ OPD Room Master
CREATE TABLE IF NOT EXISTS master_opd_room (
    opd_room_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_name VARCHAR(100) NOT NULL,
    department_id BIGINT,
    branch_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_room_department
        FOREIGN KEY (department_id)
        REFERENCES master_department(department_id)
);

-- 🔟 Payment Mode Master (Billing Integration)
CREATE TABLE IF NOT EXISTS master_payment_mode (
    payment_mode_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payment_mode_name VARCHAR(50) UNIQUE NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 1️⃣1️⃣ Payment Status Master
CREATE TABLE IF NOT EXISTS master_payment_status (
    payment_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 1️⃣2️⃣ Patient Category Master (Shared with Registration)
-- Already created in patient_registration_schema.sql — reuse master_patient_category.

-- 1️⃣3️⃣ Insurance Company Master
CREATE TABLE IF NOT EXISTS master_insurance_company (
    insurance_company_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(150) UNIQUE NOT NULL,
    contact_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);

-- 1️⃣4️⃣ TPA Master
CREATE TABLE IF NOT EXISTS master_tpa (
    tpa_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tpa_name VARCHAR(150) UNIQUE NOT NULL,
    insurance_company_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_tpa_insurance
        FOREIGN KEY (insurance_company_id)
        REFERENCES master_insurance_company(insurance_company_id)
);

-- =============================================
-- 🔄 Add FK columns to opd_visit_master (Replace ENUMs with Master Table References)
-- =============================================
ALTER TABLE opd_visit_master
    ADD COLUMN visit_type_id BIGINT NULL,
    ADD COLUMN appointment_type_id BIGINT NULL,
    ADD COLUMN queue_type_id BIGINT NULL,
    ADD COLUMN encounter_status_id BIGINT NULL,
    ADD COLUMN visit_reason_id BIGINT NULL,
    ADD COLUMN opd_room_id BIGINT NULL,

    ADD CONSTRAINT fk_opd_visit_type
        FOREIGN KEY (visit_type_id)
        REFERENCES master_visit_type(visit_type_id),

    ADD CONSTRAINT fk_opd_appointment_type
        FOREIGN KEY (appointment_type_id)
        REFERENCES master_appointment_type(appointment_type_id),

    ADD CONSTRAINT fk_opd_queue_type
        FOREIGN KEY (queue_type_id)
        REFERENCES master_queue_type(queue_type_id),

    ADD CONSTRAINT fk_opd_encounter_status
        FOREIGN KEY (encounter_status_id)
        REFERENCES master_encounter_status(encounter_status_id),

    ADD CONSTRAINT fk_opd_visit_reason
        FOREIGN KEY (visit_reason_id)
        REFERENCES master_visit_reason(visit_reason_id),

    ADD CONSTRAINT fk_opd_room
        FOREIGN KEY (opd_room_id)
        REFERENCES master_opd_room(opd_room_id),

    ADD CONSTRAINT fk_opd_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES master_doctor(doctor_id),

    ADD CONSTRAINT fk_opd_department
        FOREIGN KEY (department_id)
        REFERENCES master_department(department_id);
