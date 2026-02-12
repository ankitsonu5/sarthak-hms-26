-- =============================================
-- Migration: 005_ipd_billing_engine_schema
-- Description: Complete IPD Billing Engine (Header, Items, Room, Package, Payments, Insurance, Doctor Share, Tax, Refund, Advance, Audit, Tariff, Cost Center)
-- Created: 2026-02-12
-- =============================================

-- 🏥 1️⃣ BILL HEADER
CREATE TABLE IF NOT EXISTS ipd_bill (
    bill_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT NOT NULL,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    bill_type ENUM('PROVISIONAL','INTERIM','FINAL') NOT NULL,
    bill_status ENUM('DRAFT','RUNNING','FINALIZED','CANCELLED') DEFAULT 'RUNNING',

    gross_amount DECIMAL(15,2) DEFAULT 0,
    total_discount DECIMAL(15,2) DEFAULT 0,
    total_tax DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) DEFAULT 0,
    round_off_amount DECIMAL(10,2) DEFAULT 0,

    total_paid_amount DECIMAL(15,2) DEFAULT 0,
    total_due_amount DECIMAL(15,2) DEFAULT 0,

    insurance_claim_amount DECIMAL(15,2) DEFAULT 0,
    insurance_approved_amount DECIMAL(15,2) DEFAULT 0,
    patient_payable_amount DECIMAL(15,2) DEFAULT 0,
    corporate_payable_amount DECIMAL(15,2) DEFAULT 0,

    finalized_by BIGINT,
    finalized_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id)
);

-- 🏢 1️⃣3️⃣ COST CENTER / REVENUE HEAD (Pre-requisite for Bill Items)
CREATE TABLE IF NOT EXISTS cost_center (
    cost_center_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cost_center_name VARCHAR(255),
    department_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 📦 4️⃣ PACKAGE MASTER
CREATE TABLE IF NOT EXISTS ipd_package (
    package_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    package_name VARCHAR(255),
    package_type ENUM('SURGICAL','MEDICAL'),
    package_amount DECIMAL(15,2),
    is_active BOOLEAN DEFAULT TRUE
);

-- 🧾 2️⃣ BILL LINE ITEMS
CREATE TABLE IF NOT EXISTS ipd_bill_items (
    bill_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_id BIGINT NOT NULL,

    service_type ENUM('ROOM','LAB','PHARMACY','PROCEDURE','CONSULTATION','OT','CONSUMABLE','MISC'),
    service_category VARCHAR(100),
    service_id BIGINT,
    service_code VARCHAR(50),
    service_name VARCHAR(255),

    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,

    gross_amount DECIMAL(15,2),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,

    taxable_amount DECIMAL(15,2),
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2),

    net_amount DECIMAL(15,2),

    doctor_id BIGINT,
    department_id BIGINT,
    cost_center_id BIGINT,

    performed_at DATETIME,
    is_package_item BOOLEAN DEFAULT FALSE,
    package_id BIGINT,

    item_status ENUM('ACTIVE','CANCELLED','REFUNDED') DEFAULT 'ACTIVE',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bill_id) REFERENCES ipd_bill(bill_id),
    FOREIGN KEY (cost_center_id) REFERENCES cost_center(cost_center_id),
    FOREIGN KEY (package_id) REFERENCES ipd_package(package_id)
);

-- 🛏 3️⃣ ROOM CHARGE TRACKING
CREATE TABLE IF NOT EXISTS ipd_room_charges (
    room_charge_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT,
    bill_id BIGINT,

    bed_id BIGINT,
    room_type VARCHAR(100),

    per_day_rate DECIMAL(15,2),
    billing_unit ENUM('DAILY','HOURLY'),

    from_datetime DATETIME,
    to_datetime DATETIME,

    total_units DECIMAL(10,2),
    total_amount DECIMAL(15,2),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id),
    FOREIGN KEY (bill_id) REFERENCES ipd_bill(bill_id),
    FOREIGN KEY (bed_id) REFERENCES master_bed(bed_id)
);

-- 📦 4️⃣ PACKAGE ASSIGNMENT
CREATE TABLE IF NOT EXISTS ipd_admission_package (
    admission_package_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT,
    package_id BIGINT,
    package_amount DECIMAL(15,2),
    excess_amount DECIMAL(15,2) DEFAULT 0,
    is_closed BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id),
    FOREIGN KEY (package_id) REFERENCES ipd_package(package_id)
);

-- 💳 5️⃣ PAYMENTS
CREATE TABLE IF NOT EXISTS ipd_payments (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_id BIGINT,

    payment_date DATETIME,
    payment_mode ENUM('CASH','CARD','UPI','NEFT','CHEQUE','INSURANCE','CORPORATE'),

    reference_number VARCHAR(100),
    transaction_id VARCHAR(100),

    amount DECIMAL(15,2),

    received_by BIGINT,
    payment_status ENUM('SUCCESS','FAILED','REFUNDED') DEFAULT 'SUCCESS',

    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bill_id) REFERENCES ipd_bill(bill_id)
);

-- 🏦 6️⃣ INSURANCE / TPA CLAIM
CREATE TABLE IF NOT EXISTS ipd_insurance_claim (
    claim_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT,

    insurance_company_id BIGINT,
    tpa_id BIGINT,

    policy_number VARCHAR(100),
    preauth_number VARCHAR(100),

    claim_amount DECIMAL(15,2),
    approved_amount DECIMAL(15,2),
    rejected_amount DECIMAL(15,2),

    claim_status ENUM('PENDING','APPROVED','PARTIAL','REJECTED','SETTLED'),

    approval_date DATETIME,
    settlement_date DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id)
);

-- 👨⚕️ 7️⃣ DOCTOR SHARE ENGINE
CREATE TABLE IF NOT EXISTS ipd_doctor_share (
    share_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_item_id BIGINT,

    doctor_id BIGINT,
    share_type ENUM('PERCENTAGE','FIXED'),

    share_percent DECIMAL(5,2),
    share_amount DECIMAL(15,2),

    payout_status ENUM('PENDING','PAID') DEFAULT 'PENDING',

    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bill_item_id) REFERENCES ipd_bill_items(bill_item_id)
);

-- 🧮 8️⃣ TAX CONFIGURATION
CREATE TABLE IF NOT EXISTS tax_master (
    tax_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tax_name VARCHAR(100),
    tax_percent DECIMAL(5,2),
    hsn_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);

-- 💰 9️⃣ REFUND / CREDIT NOTE
CREATE TABLE IF NOT EXISTS ipd_refund (
    refund_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_id BIGINT,

    refund_amount DECIMAL(15,2),
    refund_reason TEXT,

    approved_by BIGINT,
    refund_mode ENUM('CASH','BANK','CARD'),

    refund_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bill_id) REFERENCES ipd_bill(bill_id)
);

-- 💵 🔟 ADVANCE / DEPOSIT
CREATE TABLE IF NOT EXISTS ipd_advance (
    advance_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id BIGINT,

    advance_amount DECIMAL(15,2),
    received_date DATETIME,

    payment_mode ENUM('CASH','CARD','UPI','NEFT'),
    reference_number VARCHAR(100),

    adjusted_amount DECIMAL(15,2) DEFAULT 0,
    remaining_balance DECIMAL(15,2),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admission_id) REFERENCES ipd_admission_master(ipd_admission_id)
);

-- 🧾 1️⃣1️⃣ AUDIT TRAIL
CREATE TABLE IF NOT EXISTS billing_audit_log (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    entity_name VARCHAR(100),
    entity_id BIGINT,

    action_type ENUM('INSERT','UPDATE','DELETE'),

    old_value TEXT,
    new_value TEXT,

    changed_by BIGINT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    ip_address VARCHAR(50)
);

-- 🏢 1️⃣2️⃣ TARIFF MASTER (Multi-Rate Support)
CREATE TABLE IF NOT EXISTS tariff_master (
    tariff_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_id BIGINT,

    tariff_type ENUM('GENERAL','CORPORATE','INSURANCE','AYUSHMAN','CGHS'),

    rate DECIMAL(15,2),
    effective_from DATE,
    effective_to DATE,

    is_active BOOLEAN DEFAULT TRUE
);
