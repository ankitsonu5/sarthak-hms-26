-- =============================================
-- Migration: 007_doctor_order_management_schema
-- Description: Enterprise Doctor Order Management System
-- Includes: Order Header, Items, Medication, Lab, Radiology, Procedure, Diet, Billing, Audit
-- Created: 2026-02-13
-- =============================================

-- 🏥 1️⃣ Doctor Order Header (Main Control Table)
CREATE TABLE IF NOT EXISTS doctor_order_header (
    order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,

    patient_id BIGINT NOT NULL,
    admission_id BIGINT,
    encounter_id BIGINT,

    order_type ENUM(
        'Medication',
        'Lab',
        'Radiology',
        'Procedure',
        'Diet',
        'Service',
        'Consultation'
    ) NOT NULL,

    priority ENUM('Routine','Urgent','STAT','Emergency') DEFAULT 'Routine',

    clinical_indication TEXT,
    diagnosis_code VARCHAR(50),

    ordered_by BIGINT NOT NULL,
    department_id BIGINT,

    target_department ENUM(
        'Pharmacy',
        'Laboratory',
        'Radiology',
        'OT',
        'Dietary',
        'Nursing'
    ),

    order_datetime DATETIME NOT NULL,
    expected_execution_time DATETIME,

    status ENUM(
        'Draft','Signed','Sent','Acknowledged',
        'In_Process','Completed','Partially_Completed',
        'Cancelled','Rejected','On_Hold'
    ) DEFAULT 'Draft',

    cancellation_reason TEXT,
    cancelled_by BIGINT,
    cancelled_at DATETIME,

    billing_status ENUM('Pending','Mapped','Billed','Waived') DEFAULT 'Pending',

    insurance_pre_auth_required BOOLEAN DEFAULT FALSE,
    insurance_status ENUM('Not_Required','Pending','Approved','Rejected'),

    remarks TEXT,

    version_number INT DEFAULT 1,
    amended_flag BOOLEAN DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id),
    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id)
);

-- 📦 2️⃣ Doctor Order Items
CREATE TABLE IF NOT EXISTS doctor_order_items (
    order_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,

    item_category ENUM(
        'Medication','Lab_Test',
        'Radiology_Test','Procedure',
        'Diet','Service'
    ) NOT NULL,

    item_master_id BIGINT,
    item_code VARCHAR(50),
    item_name VARCHAR(255) NOT NULL,

    quantity INT DEFAULT 1,
    unit VARCHAR(50),

    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2),

    execution_status ENUM(
        'Pending','Acknowledged','In_Process',
        'Completed','Cancelled','Rejected'
    ) DEFAULT 'Pending',

    executed_by BIGINT,
    executed_at DATETIME,

    result_reference_id BIGINT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES doctor_order_header(order_id)
);

-- 💊 3️⃣ Medication Details
CREATE TABLE IF NOT EXISTS medication_order_details (
    med_detail_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    dosage VARCHAR(100),
    route VARCHAR(50),
    frequency VARCHAR(50),
    duration VARCHAR(50),

    prn_flag BOOLEAN DEFAULT FALSE,
    max_daily_dose VARCHAR(100),

    renal_adjusted BOOLEAN DEFAULT FALSE,
    high_alert_flag BOOLEAN DEFAULT FALSE,
    narcotic_flag BOOLEAN DEFAULT FALSE,

    duplicate_check_flag BOOLEAN DEFAULT FALSE,
    interaction_flag BOOLEAN DEFAULT FALSE,
    allergy_override_flag BOOLEAN DEFAULT FALSE,

    stop_date DATETIME,
    auto_stop_flag BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (order_item_id) REFERENCES doctor_order_items(order_item_id)
);

-- 🕒 4️⃣ Medication Schedule
CREATE TABLE IF NOT EXISTS medication_schedule (
    schedule_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,
    scheduled_datetime DATETIME NOT NULL,

    administration_status ENUM(
        'Scheduled','Given','Missed',
        'Delayed','Held'
    ) DEFAULT 'Scheduled',

    administered_by BIGINT,
    administered_at DATETIME,

    barcode_verified BOOLEAN DEFAULT FALSE,
    adverse_reaction_flag BOOLEAN DEFAULT FALSE,
    notes TEXT,

    FOREIGN KEY (order_item_id) REFERENCES doctor_order_items(order_item_id)
);

-- 🧪 5️⃣ Lab Sample Tracking
CREATE TABLE IF NOT EXISTS lab_sample_tracking (
    sample_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    sample_barcode VARCHAR(100),
    sample_type VARCHAR(100),

    fasting_required BOOLEAN DEFAULT FALSE,
    sample_priority ENUM('Routine','STAT') DEFAULT 'Routine',

    collected_by BIGINT,
    collected_at DATETIME,
    received_at DATETIME,

    rejected_flag BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,

    result_status ENUM('Pending','In_Process','Completed','Critical'),

    FOREIGN KEY (order_item_id) REFERENCES doctor_order_items(order_item_id)
);

-- 🩻 6️⃣ Radiology Execution
CREATE TABLE IF NOT EXISTS radiology_execution (
    radiology_exec_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    technician_id BIGINT,
    machine_id BIGINT,

    contrast_required BOOLEAN DEFAULT FALSE,
    sedation_required BOOLEAN DEFAULT FALSE,

    scheduled_time DATETIME,
    performed_time DATETIME,

    report_uploaded BOOLEAN DEFAULT FALSE,
    pacs_reference VARCHAR(255),

    FOREIGN KEY (order_item_id) REFERENCES doctor_order_items(order_item_id)
);

-- 🔪 7️⃣ Procedure Execution
CREATE TABLE IF NOT EXISTS procedure_execution (
    procedure_exec_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    consent_required BOOLEAN DEFAULT TRUE,
    consent_signed BOOLEAN DEFAULT FALSE,

    ot_slot_id BIGINT,
    anesthesia_type VARCHAR(100),

    implant_required BOOLEAN DEFAULT FALSE,

    procedure_start_time DATETIME,
    procedure_end_time DATETIME,

    surgeon_id BIGINT,
    notes TEXT,

    FOREIGN KEY (order_item_id) REFERENCES doctor_order_items(order_item_id)
);

-- 🍽 8️⃣ Diet Order Execution
CREATE TABLE IF NOT EXISTS diet_order_execution (
    diet_exec_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    diet_type VARCHAR(100),
    calorie_value INT,

    meal_time ENUM('Breakfast','Lunch','Dinner','Snacks'),

    dispatched BOOLEAN DEFAULT FALSE,
    dispatched_time DATETIME,

    FOREIGN KEY (order_item_id) REFERENCES doctor_order_items(order_item_id)
);

-- 💰 9️⃣ Billing Mapping
CREATE TABLE IF NOT EXISTS order_billing_mapping (
    billing_map_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,
    billing_item_id BIGINT,
    invoice_id BIGINT,
    billed_amount DECIMAL(12,2),
    billing_status ENUM('Pending','Billed','Waived'),

    FOREIGN KEY (order_item_id) REFERENCES doctor_order_items(order_item_id)
);

-- 🔐 🔟 Order Status Log (Audit Trail)
CREATE TABLE IF NOT EXISTS doctor_order_status_log (
    status_log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by BIGINT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    ip_address VARCHAR(50),
    device_id VARCHAR(100),

    FOREIGN KEY (order_id) REFERENCES doctor_order_header(order_id)
);

-- 🏥 1️⃣1️⃣ Order Approval / Co-Sign
CREATE TABLE IF NOT EXISTS doctor_order_approval (
    approval_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    approver_id BIGINT NOT NULL,
    approval_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    approval_datetime DATETIME,
    remarks TEXT,

    FOREIGN KEY (order_id) REFERENCES doctor_order_header(order_id)
);

-- 🧠 1️⃣2️⃣ Order Template (Speed Ordering)
CREATE TABLE IF NOT EXISTS order_template (
    template_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(255),
    department_id BIGINT,
    created_by BIGINT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 🧠 1️⃣3️⃣ Order Template Items
CREATE TABLE IF NOT EXISTS order_template_items (
    template_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_id BIGINT NOT NULL,
    item_master_id BIGINT,
    default_dosage VARCHAR(100),
    default_frequency VARCHAR(50),
    default_duration VARCHAR(50),

    FOREIGN KEY (template_id) REFERENCES order_template(template_id)
);
