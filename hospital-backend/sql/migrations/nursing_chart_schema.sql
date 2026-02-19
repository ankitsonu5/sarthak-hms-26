-- =============================================
-- Migration: 006_nursing_chart_schema
-- Description: Nursing Chart, Vitals, IO, MAR, Notes, EWS, Neuro, Ventilator, Wound, Device Logs, Audit
-- Created: 2026-02-13
-- =============================================

-- 1️⃣ Nursing_Observation_Header
CREATE TABLE IF NOT EXISTS nursing_observation_header (
    observation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    bed_id BIGINT,
    ward_id BIGINT,
    observation_datetime DATETIME NOT NULL,
    shift_type ENUM('Morning','Evening','Night') NOT NULL,
    recorded_by BIGINT NOT NULL,
    verified_by BIGINT,
    status ENUM('Draft','Final','Amended') DEFAULT 'Draft',
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id),
    FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
);

-- 📊 2️⃣ Vital_Signs
CREATE TABLE IF NOT EXISTS vital_signs (
    vital_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    observation_id BIGINT NOT NULL,
    temperature DECIMAL(4,2),
    pulse INT,
    respiration_rate INT,
    systolic_bp INT,
    diastolic_bp INT,
    spo2 INT,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(5,2),
    pain_score INT,
    gcs_eye INT,
    gcs_verbal INT,
    gcs_motor INT,
    gcs_total INT,
    oxygen_support BOOLEAN DEFAULT FALSE,
    oxygen_flow_rate DECIMAL(5,2),
    device_source VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (observation_id) REFERENCES nursing_observation_header(observation_id)
);

-- 💧 3️⃣ Intake_Output
CREATE TABLE IF NOT EXISTS intake_output (
    io_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    observation_id BIGINT NOT NULL,
    oral_intake_ml DECIMAL(8,2),
    iv_intake_ml DECIMAL(8,2),
    blood_transfusion_ml DECIMAL(8,2),
    urine_output_ml DECIMAL(8,2),
    stool_output_ml DECIMAL(8,2),
    vomit_output_ml DECIMAL(8,2),
    drain_output_ml DECIMAL(8,2),
    gastric_output_ml DECIMAL(8,2),
    net_balance_ml DECIMAL(8,2),
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (observation_id) REFERENCES nursing_observation_header(observation_id)
);

-- 💊 4️⃣ Medication_Administration_Record (MAR)
CREATE TABLE IF NOT EXISTS medication_administration (
    mar_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT NOT NULL,
    medication_order_id BIGINT NOT NULL,
    medication_name VARCHAR(255),
    dose VARCHAR(100),
    route VARCHAR(50),
    frequency VARCHAR(50),
    scheduled_time DATETIME,
    administered_time DATETIME,
    administered_by BIGINT,
    status ENUM('Given','Missed','Delayed','Held') DEFAULT 'Given',
    skip_reason TEXT,
    barcode_verified BOOLEAN DEFAULT FALSE,
    adverse_reaction_flag BOOLEAN DEFAULT FALSE,
    reaction_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id)
    -- FOREIGN KEY (medication_order_id) REFERENCES ipd_order_items(order_item_id) -- Assuming order items table exists or similar
);

-- 📝 5️⃣ Nursing_Notes
CREATE TABLE IF NOT EXISTS nursing_notes (
    note_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT NOT NULL,
    note_type ENUM('Progress','Critical','Incident','Transfer','General'),
    note_text TEXT NOT NULL,
    escalation_flag BOOLEAN DEFAULT FALSE,
    escalation_time DATETIME,
    informed_doctor_id BIGINT,
    entered_by BIGINT NOT NULL,
    entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id)
);

-- 🚨 6️⃣ Early_Warning_Score
CREATE TABLE IF NOT EXISTS early_warning_score (
    ews_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    observation_id BIGINT NOT NULL,
    temperature_score INT,
    pulse_score INT,
    respiration_score INT,
    bp_score INT,
    spo2_score INT,
    gcs_score INT,
    total_score INT,
    risk_level ENUM('Low','Moderate','High','Critical'),
    escalation_triggered BOOLEAN DEFAULT FALSE,
    escalation_time DATETIME,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (observation_id) REFERENCES nursing_observation_header(observation_id)
);

-- 🧠 7️⃣ Neuro_Chart (ICU/Head Injury)
CREATE TABLE IF NOT EXISTS neuro_chart (
    neuro_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    observation_id BIGINT NOT NULL,
    pupil_size_left DECIMAL(3,1),
    pupil_size_right DECIMAL(3,1),
    pupil_reaction_left ENUM('Brisk','Sluggish','Fixed'),
    pupil_reaction_right ENUM('Brisk','Sluggish','Fixed'),
    limb_movement VARCHAR(255),
    seizure_activity BOOLEAN DEFAULT FALSE,
    notes TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (observation_id) REFERENCES nursing_observation_header(observation_id)
);

-- 🫁 8️⃣ Ventilator_Chart (ICU)
CREATE TABLE IF NOT EXISTS ventilator_chart (
    ventilator_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    observation_id BIGINT NOT NULL,
    mode VARCHAR(100),
    fio2 DECIMAL(5,2),
    peep DECIMAL(5,2),
    tidal_volume DECIMAL(8,2),
    respiratory_rate INT,
    airway_pressure DECIMAL(8,2),
    ventilator_settings TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (observation_id) REFERENCES nursing_observation_header(observation_id)
);

-- 🩺 9️⃣ Wound_Assessment
CREATE TABLE IF NOT EXISTS wound_assessment (
    wound_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT NOT NULL,
    wound_location VARCHAR(255),
    wound_type VARCHAR(255),
    wound_size_cm VARCHAR(100),
    infection_sign BOOLEAN DEFAULT FALSE,
    dressing_done BOOLEAN DEFAULT FALSE,
    photo_path VARCHAR(500),
    assessed_by BIGINT,
    assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id)
);

-- 📊 🔟 Device_Data_Log (IoT Integration)
CREATE TABLE IF NOT EXISTS device_data_log (
    device_log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT NOT NULL,
    device_id VARCHAR(100),
    parameter_name VARCHAR(100),
    parameter_value VARCHAR(100),
    recorded_at DATETIME,
    source ENUM('Manual','Monitor','Ventilator','InfusionPump'),
    
    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id)
);

-- 🔐 1️⃣1️⃣ Nursing_Audit_Log
CREATE TABLE IF NOT EXISTS nursing_audit_log (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(100),
    record_id BIGINT,
    action_type ENUM('Insert','Update','Delete'),
    old_value TEXT,
    new_value TEXT,
    modified_by BIGINT,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
