-- =============================================
-- Master Data: Doctor Order Engine Dependencies
-- Description: Normalized Master Tables for Order Category, Type, Priority, Status,
--              Frequency, Route, Dose Unit, Result Type, Specimen, Cancellation, Approval, Service
-- Created: 2026-02-14
-- =============================================

-- 1️⃣ Order Category Master (Top Level Classification)
-- Example: Medication, Lab, Radiology, Procedure, Diet, Nursing, Blood, OT, Consultation
CREATE TABLE IF NOT EXISTS master_order_category (
    order_category_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    category_code VARCHAR(30) UNIQUE,
    is_clinical BOOLEAN DEFAULT TRUE,
    is_billable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ Order Type Master (Sub Classification)
-- Example: Medication → Regular / Stat / SOS, Lab → Routine / Urgent
CREATE TABLE IF NOT EXISTS master_order_type (
    order_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_category_id BIGINT NOT NULL,

    order_type_name VARCHAR(100) NOT NULL,
    order_type_code VARCHAR(30),

    requires_result BOOLEAN DEFAULT FALSE,
    requires_sample BOOLEAN DEFAULT FALSE,
    requires_scheduling BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (order_category_id)
        REFERENCES master_order_category(order_category_id),

    UNIQUE(order_category_id, order_type_name)
);

-- 3️⃣ Order Priority Master
-- Example: Routine, Urgent, STAT, Emergency
CREATE TABLE IF NOT EXISTS master_order_priority (
    order_priority_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    priority_name VARCHAR(50) UNIQUE NOT NULL,
    priority_weight INT DEFAULT 1,
    tat_minutes INT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4️⃣ Order Status Master (Workflow Control)
-- Example: 1=Created, 2=Approved, 3=In Progress, 4=Completed, 5=Cancelled
CREATE TABLE IF NOT EXISTS master_order_status (
    order_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    status_sequence INT,
    is_initial BOOLEAN DEFAULT FALSE,
    is_final BOOLEAN DEFAULT FALSE,
    is_cancel_allowed BOOLEAN DEFAULT TRUE,
    is_bill_trigger BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5️⃣ Frequency Master (For Medication Orders)
-- Example: OD, BD, TDS, QID, 6 Hourly, 8 Hourly
CREATE TABLE IF NOT EXISTS master_frequency (
    frequency_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    frequency_name VARCHAR(50) UNIQUE NOT NULL,
    frequency_code VARCHAR(20),
    times_per_day INT,
    interval_hours INT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 6️⃣ Route of Administration Master
-- Example: Oral, IV, IM, SC, Topical, Inhalation
CREATE TABLE IF NOT EXISTS master_route (
    route_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(50) UNIQUE NOT NULL,
    route_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);

-- 7️⃣ Dose Unit Master
-- Example: mg, ml, IU, Tablet, Capsule
CREATE TABLE IF NOT EXISTS master_dose_unit (
    dose_unit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    unit_name VARCHAR(50) UNIQUE NOT NULL,
    unit_symbol VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);

-- 8️⃣ Result Type Master (Lab / Radiology)
-- Example: Numeric, Text, PDF, Image
CREATE TABLE IF NOT EXISTS master_result_type (
    result_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    result_type_name VARCHAR(50) UNIQUE NOT NULL,
    is_numeric BOOLEAN DEFAULT FALSE,
    is_text BOOLEAN DEFAULT FALSE,
    is_attachment BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 9️⃣ Specimen Type Master (Lab Orders)
-- Example: Blood, Urine, CSF, Sputum
CREATE TABLE IF NOT EXISTS master_specimen_type (
    specimen_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    specimen_name VARCHAR(100) UNIQUE NOT NULL,
    storage_requirement VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

-- 🔟 Order Cancellation Reason Master
CREATE TABLE IF NOT EXISTS master_order_cancel_reason (
    cancel_reason_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reason_name VARCHAR(150) UNIQUE NOT NULL,
    is_medico_legal BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 1️⃣1️⃣ Order Approval Role Master
-- Example: Consultant, HOD, Medical Superintendent
CREATE TABLE IF NOT EXISTS master_order_approval_role (
    approval_role_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 1️⃣2️⃣ Service Master (Billing Integration)
CREATE TABLE IF NOT EXISTS master_service (
    service_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_type_id BIGINT,

    service_name VARCHAR(150) NOT NULL,
    service_code VARCHAR(50) UNIQUE,

    department_id BIGINT,
    base_rate DECIMAL(12,2),

    is_taxable BOOLEAN DEFAULT TRUE,
    is_package_includable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (order_type_id)
        REFERENCES master_order_type(order_type_id),

    FOREIGN KEY (department_id)
        REFERENCES master_department(department_id)
);

-- =============================================
-- 🔄 Replace ENUMs in ipd_order_master (IPD Order System)
-- =============================================
ALTER TABLE ipd_order_master
    ADD COLUMN order_priority_id BIGINT NULL,
    ADD COLUMN order_status_id BIGINT NULL,
    ADD COLUMN order_category_id BIGINT NULL,

    ADD CONSTRAINT fk_ipd_om_priority
        FOREIGN KEY (order_priority_id)
        REFERENCES master_order_priority(order_priority_id),

    ADD CONSTRAINT fk_ipd_om_status
        FOREIGN KEY (order_status_id)
        REFERENCES master_order_status(order_status_id),

    ADD CONSTRAINT fk_ipd_om_category
        FOREIGN KEY (order_category_id)
        REFERENCES master_order_category(order_category_id),

    ADD CONSTRAINT fk_ipd_om_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES master_doctor(doctor_id);

-- =============================================
-- 🔄 Replace ENUMs in ipd_order_items
-- =============================================
ALTER TABLE ipd_order_items
    ADD COLUMN order_type_id BIGINT NULL,
    ADD COLUMN item_status_id BIGINT NULL,
    ADD COLUMN service_id BIGINT NULL,

    ADD CONSTRAINT fk_ipd_oi_type
        FOREIGN KEY (order_type_id)
        REFERENCES master_order_type(order_type_id),

    ADD CONSTRAINT fk_ipd_oi_status
        FOREIGN KEY (item_status_id)
        REFERENCES master_order_status(order_status_id),

    ADD CONSTRAINT fk_ipd_oi_service
        FOREIGN KEY (service_id)
        REFERENCES master_service(service_id);

-- =============================================
-- 🔄 Replace ENUMs in ipd_medication_orders
-- =============================================
ALTER TABLE ipd_medication_orders
    ADD COLUMN route_id BIGINT NULL,
    ADD COLUMN frequency_id BIGINT NULL,
    ADD COLUMN dose_unit_id BIGINT NULL,

    ADD CONSTRAINT fk_ipd_med_route
        FOREIGN KEY (route_id)
        REFERENCES master_route(route_id),

    ADD CONSTRAINT fk_ipd_med_frequency
        FOREIGN KEY (frequency_id)
        REFERENCES master_frequency(frequency_id),

    ADD CONSTRAINT fk_ipd_med_dose_unit
        FOREIGN KEY (dose_unit_id)
        REFERENCES master_dose_unit(dose_unit_id);

-- =============================================
-- 🔄 Replace ENUMs in ipd_lab_orders
-- =============================================
ALTER TABLE ipd_lab_orders
    ADD COLUMN specimen_type_id BIGINT NULL,
    ADD COLUMN result_type_id BIGINT NULL,

    ADD CONSTRAINT fk_ipd_lab_specimen
        FOREIGN KEY (specimen_type_id)
        REFERENCES master_specimen_type(specimen_type_id),

    ADD CONSTRAINT fk_ipd_lab_result_type
        FOREIGN KEY (result_type_id)
        REFERENCES master_result_type(result_type_id);

-- =============================================
-- 🔄 Replace ENUMs in doctor_order_header (CPOE System)
-- =============================================
ALTER TABLE doctor_order_header
    ADD COLUMN order_category_id BIGINT NULL,
    ADD COLUMN order_priority_id BIGINT NULL,
    ADD COLUMN order_status_id BIGINT NULL,
    ADD COLUMN cancel_reason_id BIGINT NULL,

    ADD CONSTRAINT fk_doh_category
        FOREIGN KEY (order_category_id)
        REFERENCES master_order_category(order_category_id),

    ADD CONSTRAINT fk_doh_priority
        FOREIGN KEY (order_priority_id)
        REFERENCES master_order_priority(order_priority_id),

    ADD CONSTRAINT fk_doh_status
        FOREIGN KEY (order_status_id)
        REFERENCES master_order_status(order_status_id),

    ADD CONSTRAINT fk_doh_cancel_reason
        FOREIGN KEY (cancel_reason_id)
        REFERENCES master_order_cancel_reason(cancel_reason_id),

    ADD CONSTRAINT fk_doh_doctor
        FOREIGN KEY (ordered_by)
        REFERENCES master_doctor(doctor_id),

    ADD CONSTRAINT fk_doh_department
        FOREIGN KEY (department_id)
        REFERENCES master_department(department_id);

-- =============================================
-- 🔄 Replace ENUMs in doctor_order_items
-- =============================================
ALTER TABLE doctor_order_items
    ADD COLUMN order_type_id BIGINT NULL,
    ADD COLUMN item_status_id BIGINT NULL,
    ADD COLUMN service_id BIGINT NULL,

    ADD CONSTRAINT fk_doi_type
        FOREIGN KEY (order_type_id)
        REFERENCES master_order_type(order_type_id),

    ADD CONSTRAINT fk_doi_status
        FOREIGN KEY (item_status_id)
        REFERENCES master_order_status(order_status_id),

    ADD CONSTRAINT fk_doi_service
        FOREIGN KEY (service_id)
        REFERENCES master_service(service_id);

-- =============================================
-- 🔄 Replace ENUMs in medication_order_details
-- =============================================
ALTER TABLE medication_order_details
    ADD COLUMN route_id BIGINT NULL,
    ADD COLUMN frequency_id BIGINT NULL,
    ADD COLUMN dose_unit_id BIGINT NULL,

    ADD CONSTRAINT fk_mod_route
        FOREIGN KEY (route_id)
        REFERENCES master_route(route_id),

    ADD CONSTRAINT fk_mod_frequency
        FOREIGN KEY (frequency_id)
        REFERENCES master_frequency(frequency_id),

    ADD CONSTRAINT fk_mod_dose_unit
        FOREIGN KEY (dose_unit_id)
        REFERENCES master_dose_unit(dose_unit_id);

-- =============================================
-- 🔄 Replace ENUMs in lab_sample_tracking
-- =============================================
ALTER TABLE lab_sample_tracking
    ADD COLUMN specimen_type_id BIGINT NULL,
    ADD COLUMN result_type_id BIGINT NULL,

    ADD CONSTRAINT fk_lst_specimen
        FOREIGN KEY (specimen_type_id)
        REFERENCES master_specimen_type(specimen_type_id),

    ADD CONSTRAINT fk_lst_result_type
        FOREIGN KEY (result_type_id)
        REFERENCES master_result_type(result_type_id);

-- =============================================
-- 🔄 Replace ENUMs in ipd_order_billing
-- =============================================
ALTER TABLE ipd_order_billing
    ADD COLUMN billing_status_id BIGINT NULL,

    ADD CONSTRAINT fk_iob_billing_status
        FOREIGN KEY (billing_status_id)
        REFERENCES master_order_status(order_status_id);

-- =============================================
-- 🔄 Replace ENUMs in order_billing_mapping
-- =============================================
ALTER TABLE order_billing_mapping
    ADD COLUMN billing_status_id BIGINT NULL,

    ADD CONSTRAINT fk_obm_billing_status
        FOREIGN KEY (billing_status_id)
        REFERENCES master_order_status(order_status_id);

-- =============================================
-- 🔄 Add approval role FK to doctor_order_approval
-- =============================================
ALTER TABLE doctor_order_approval
    ADD COLUMN approval_role_id BIGINT NULL,

    ADD CONSTRAINT fk_doa_role
        FOREIGN KEY (approval_role_id)
        REFERENCES master_order_approval_role(approval_role_id);
