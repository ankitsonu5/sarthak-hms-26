-- =============================================
-- Migration: insurance_claim_management_engine
-- Description: Insurance Claim Management Engine — Pre-Authorization, Claim Submission,
--              Document Upload, Tracking, Rejection, Settlement & Receivable Control
-- Connects: IPD Billing + Discharge + Coding + Insurance Master
-- Created: 2026-02-19
-- =============================================


-- =============================================
-- MASTER TABLES
-- =============================================

-- 1️⃣ Pre-Authorization Status Master
-- Example: Draft, Submitted, Query Raised, Approved, Partially Approved, Rejected
CREATE TABLE IF NOT EXISTS master_preauth_status (
    preauth_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    status_name VARCHAR(50) UNIQUE NOT NULL,
    is_final BOOLEAN DEFAULT FALSE,
    is_approval BOOLEAN DEFAULT FALSE,
    is_rejection BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE
);

-- 2️⃣ Claim Status Master
-- Example: Draft, Submitted, Under Review, Query Raised, Approved, Rejected, Settled
CREATE TABLE IF NOT EXISTS master_claim_status (
    claim_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    status_name VARCHAR(50) UNIQUE NOT NULL,

    is_final BOOLEAN DEFAULT FALSE,
    is_rejection BOOLEAN DEFAULT FALSE,
    is_settlement BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE
);

-- 3️⃣ Claim Document Type Master
-- Example: Discharge Summary, Final Bill, Investigation Reports, Pre-Auth Form, Implant Sticker
CREATE TABLE IF NOT EXISTS master_claim_document_type (
    document_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    document_name VARCHAR(150) UNIQUE NOT NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_pre_auth_document BOOLEAN DEFAULT FALSE,
    is_final_claim_document BOOLEAN DEFAULT TRUE,

    is_active BOOLEAN DEFAULT TRUE
);

-- 4️⃣ Claim Rejection Reason Master
-- Example: Non-covered Procedure, Incomplete Documentation, Policy Expired, Waiting Period
CREATE TABLE IF NOT EXISTS master_claim_rejection_reason (
    rejection_reason_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    reason_name VARCHAR(255) UNIQUE NOT NULL,
    is_resubmittable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);


-- =============================================
-- TRANSACTIONAL TABLES
-- =============================================

-- 5️⃣ Pre-Authorization Workflow
CREATE TABLE IF NOT EXISTS insurance_pre_authorization (
    preauth_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    ipd_admission_id BIGINT NOT NULL,
    insurance_company_id BIGINT NOT NULL,
    tpa_id BIGINT NULL,

    policy_number VARCHAR(50) NOT NULL,
    requested_amount DECIMAL(14,2) NOT NULL,

    diagnosis_summary TEXT,
    proposed_treatment TEXT,

    preauth_status_id BIGINT NOT NULL,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,

    approved_amount DECIMAL(14,2),
    rejection_reason TEXT,

    created_by BIGINT,
    updated_by BIGINT,
    updated_at DATETIME,

    FOREIGN KEY (ipd_admission_id)
        REFERENCES ipd_admission_master(ipd_admission_id),

    FOREIGN KEY (insurance_company_id)
        REFERENCES master_insurance_company(insurance_company_id),

    FOREIGN KEY (tpa_id)
        REFERENCES master_tpa(tpa_id),

    FOREIGN KEY (preauth_status_id)
        REFERENCES master_preauth_status(preauth_status_id)
);

-- 6️⃣ Claim Master (Submission Engine)
CREATE TABLE IF NOT EXISTS insurance_claim_master (
    claim_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    ipd_admission_id BIGINT NOT NULL,
    preauth_id BIGINT NULL,

    insurance_company_id BIGINT NOT NULL,
    tpa_id BIGINT NULL,

    claim_number VARCHAR(50) UNIQUE,
    claim_amount DECIMAL(14,2) NOT NULL,

    approved_amount DECIMAL(14,2),
    settled_amount DECIMAL(14,2),

    claim_status_id BIGINT NOT NULL,

    submitted_at DATETIME,
    settlement_date DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ipd_admission_id)
        REFERENCES ipd_admission_master(ipd_admission_id),

    FOREIGN KEY (preauth_id)
        REFERENCES insurance_pre_authorization(preauth_id),

    FOREIGN KEY (insurance_company_id)
        REFERENCES master_insurance_company(insurance_company_id),

    FOREIGN KEY (claim_status_id)
        REFERENCES master_claim_status(claim_status_id)
);

-- 7️⃣ Claim Document Upload Engine
CREATE TABLE IF NOT EXISTS insurance_claim_document (
    claim_document_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    claim_id BIGINT NULL,
    preauth_id BIGINT NULL,

    document_type_id BIGINT NOT NULL,
    file_name VARCHAR(255),
    file_path VARCHAR(500),

    uploaded_by BIGINT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id)
        REFERENCES insurance_claim_master(claim_id),

    FOREIGN KEY (preauth_id)
        REFERENCES insurance_pre_authorization(preauth_id),

    FOREIGN KEY (document_type_id)
        REFERENCES master_claim_document_type(document_type_id)
);

-- 8️⃣ Claim Tracking & Audit Log (Complete status timeline)
CREATE TABLE IF NOT EXISTS insurance_claim_tracking (
    tracking_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    claim_id BIGINT NOT NULL,
    claim_status_id BIGINT NOT NULL,

    remarks TEXT,
    updated_by BIGINT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id)
        REFERENCES insurance_claim_master(claim_id),

    FOREIGN KEY (claim_status_id)
        REFERENCES master_claim_status(claim_status_id)
);

-- 9️⃣ Claim Rejection Mapping (per-reason breakdown)
CREATE TABLE IF NOT EXISTS insurance_claim_rejection (
    claim_rejection_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    claim_id BIGINT NOT NULL,
    rejection_reason_id BIGINT NOT NULL,

    rejection_amount DECIMAL(14,2),
    remarks TEXT,

    FOREIGN KEY (claim_id)
        REFERENCES insurance_claim_master(claim_id),

    FOREIGN KEY (rejection_reason_id)
        REFERENCES master_claim_rejection_reason(rejection_reason_id)
);

-- 🔟 Settlement & Receivable Control
CREATE TABLE IF NOT EXISTS insurance_claim_settlement (
    settlement_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    claim_id BIGINT NOT NULL,

    settled_amount DECIMAL(14,2) NOT NULL,
    tds_amount DECIMAL(14,2),
    deduction_amount DECIMAL(14,2),

    payment_reference VARCHAR(100),
    payment_date DATETIME,

    posted_to_ledger BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (claim_id)
        REFERENCES insurance_claim_master(claim_id)
);
