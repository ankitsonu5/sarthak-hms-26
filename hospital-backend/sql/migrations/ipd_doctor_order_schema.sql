-- =============================================
-- Migration: 004_ipd_doctor_order_schema
-- Description: IPD Doctor Order System (Master, Items, Medication, Lab, Radiology, Procedures, Diet, Nursing, Billing Link, Audit)
-- Created: 2026-02-12
-- =============================================

-- 🔵 1️⃣ Order Master Table
CREATE TABLE IF NOT EXISTS ipd_order_master (
    order_master_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ipd_admission_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,

    order_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,

    priority ENUM('Routine','Urgent','Stat') DEFAULT 'Routine',

    order_source ENUM('Manual','Template','Verbal','Standing') DEFAULT 'Manual',

    verbal_order_flag BOOLEAN DEFAULT FALSE,
    verbal_order_verified_by BIGINT NULL,

    order_status ENUM('Active','Completed','Cancelled') DEFAULT 'Active',

    clinical_notes TEXT,

    approval_required BOOLEAN DEFAULT FALSE,
    approved_by BIGINT NULL,
    approved_at DATETIME NULL,

    is_package_case BOOLEAN DEFAULT FALSE,

    created_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at DATETIME,

    FOREIGN KEY (ipd_admission_id)
    REFERENCES ipd_admission_master(ipd_admission_id)
);

-- 🔵 2️⃣ Generic Order Item Table
CREATE TABLE IF NOT EXISTS ipd_order_items (
    order_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_master_id BIGINT NOT NULL,

    order_type ENUM(
        'Lab',
        'Radiology',
        'Medication',
        'Procedure',
        'Diet',
        'Nursing'
    ) NOT NULL,

    reference_code BIGINT NULL,

    scheduled_datetime DATETIME NULL,

    order_status ENUM(
        'Ordered',
        'In Progress',
        'Completed',
        'Cancelled'
    ) DEFAULT 'Ordered',

    is_critical BOOLEAN DEFAULT FALSE,
    remarks TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_master_id)
    REFERENCES ipd_order_master(order_master_id)
);

-- 🔵 3️⃣ Medication Orders (Advanced)
CREATE TABLE IF NOT EXISTS ipd_medication_orders (
    medication_order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    drug_id BIGINT NOT NULL,
    generic_name VARCHAR(150),

    dose VARCHAR(50),
    dose_unit VARCHAR(20),
    frequency VARCHAR(50),

    route ENUM('IV','IM','Oral','Subcutaneous','Inhalation','Topical'),

    infusion_rate VARCHAR(50),
    dilution_instruction TEXT,

    start_datetime DATETIME,
    end_datetime DATETIME,

    is_prn BOOLEAN DEFAULT FALSE,
    max_daily_dose VARCHAR(50),

    allergy_checked BOOLEAN DEFAULT TRUE,
    interaction_checked BOOLEAN DEFAULT TRUE,

    high_alert_flag BOOLEAN DEFAULT FALSE,

    stop_reason VARCHAR(255),

    FOREIGN KEY (order_item_id)
    REFERENCES ipd_order_items(order_item_id)
);

-- 🔵 4️⃣ Medication Administration (MAR Table)
CREATE TABLE IF NOT EXISTS ipd_medication_administration (
    administration_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    medication_order_id BIGINT NOT NULL,

    scheduled_time DATETIME,
    administered_time DATETIME,

    administered_by BIGINT,
    status ENUM('Pending','Given','Missed','Refused') DEFAULT 'Pending',

    missed_reason VARCHAR(255),
    nurse_remarks TEXT,

    FOREIGN KEY (medication_order_id)
    REFERENCES ipd_medication_orders(medication_order_id)
);

-- 🔵 5️⃣ Lab Orders
CREATE TABLE IF NOT EXISTS ipd_lab_orders (
    lab_order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    lab_test_id BIGINT NOT NULL,
    sample_type VARCHAR(50),

    fasting_required BOOLEAN DEFAULT FALSE,
    sample_barcode VARCHAR(100),

    sample_collected BOOLEAN DEFAULT FALSE,
    sample_collected_at DATETIME,
    lab_technician_id BIGINT,

    result_value TEXT,
    reference_range VARCHAR(100),
    abnormal_flag BOOLEAN DEFAULT FALSE,
    critical_flag BOOLEAN DEFAULT FALSE,

    critical_informed_to BIGINT,
    result_datetime DATETIME,

    FOREIGN KEY (order_item_id)
    REFERENCES ipd_order_items(order_item_id)
);

-- 🔵 6️⃣ Radiology Orders
CREATE TABLE IF NOT EXISTS ipd_radiology_orders (
    radiology_order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    radiology_test_id BIGINT NOT NULL,
    clinical_indication TEXT,

    contrast_required BOOLEAN DEFAULT FALSE,
    pregnancy_checked BOOLEAN DEFAULT FALSE,

    sedation_required BOOLEAN DEFAULT FALSE,

    dicom_link TEXT,
    film_number VARCHAR(100),

    radiologist_id BIGINT,
    report_text TEXT,
    report_datetime DATETIME,

    critical_flag BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (order_item_id)
    REFERENCES ipd_order_items(order_item_id)
);

-- 🔵 7️⃣ Procedure Orders (OT Integrated)
CREATE TABLE IF NOT EXISTS ipd_procedure_orders (
    procedure_order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    procedure_id BIGINT NOT NULL,

    planned_datetime DATETIME,
    ot_room_id BIGINT,

    surgeon_id BIGINT,
    anaesthetist_id BIGINT,

    consent_taken BOOLEAN DEFAULT FALSE,

    blood_required BOOLEAN DEFAULT FALSE,
    implant_used TEXT,

    procedure_duration INT,
    complication_flag BOOLEAN DEFAULT FALSE,

    procedure_notes TEXT,

    status ENUM('Planned','Ongoing','Completed','Cancelled') DEFAULT 'Planned',

    FOREIGN KEY (order_item_id)
    REFERENCES ipd_order_items(order_item_id)
);

-- 🔵 8️⃣ Diet Orders
CREATE TABLE IF NOT EXISTS ipd_diet_orders (
    diet_order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    diet_type VARCHAR(150),
    calories INT,

    npo_flag BOOLEAN DEFAULT FALSE,
    fluid_restriction_ml INT,

    feeding_route ENUM('Oral','NG','PEG','IV'),

    dietician_id BIGINT,
    special_instruction TEXT,

    start_date DATE,
    end_date DATE,

    FOREIGN KEY (order_item_id)
    REFERENCES ipd_order_items(order_item_id)
);

-- 🔵 9️⃣ Nursing Instructions
CREATE TABLE IF NOT EXISTS ipd_nursing_orders (
    nursing_order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    instruction TEXT,
    frequency VARCHAR(50),

    escalation_flag BOOLEAN DEFAULT FALSE,

    is_completed BOOLEAN DEFAULT FALSE,
    completed_by BIGINT,
    completed_at DATETIME,

    delay_reason VARCHAR(255),

    FOREIGN KEY (order_item_id)
    REFERENCES ipd_order_items(order_item_id)
);

-- 🔵 🔟 Order Billing Link
CREATE TABLE IF NOT EXISTS ipd_order_billing (
    billing_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_item_id BIGINT NOT NULL,

    billing_transaction_id BIGINT,

    charge_amount DECIMAL(12,2),
    package_covered BOOLEAN DEFAULT FALSE,

    billing_status ENUM('Pending','Billed','Cancelled') DEFAULT 'Pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_item_id)
    REFERENCES ipd_order_items(order_item_id)
);

-- 🔵 1️⃣1️⃣ Order Audit Log
CREATE TABLE IF NOT EXISTS ipd_order_audit (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_master_id BIGINT,

    action ENUM(
        'CREATE',
        'UPDATE',
        'CANCEL',
        'COMPLETE'
    ),

    action_by BIGINT,
    action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);
