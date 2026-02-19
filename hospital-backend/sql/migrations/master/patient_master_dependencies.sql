-- =============================================
-- Master Data: Patient Registration Dependencies
-- Description: Normalized Master Tables for Gender, Nationality, Religion, ID Proof, Address, etc.
-- Created: 2026-02-13
-- =============================================

-- 1️⃣ Gender Master
CREATE TABLE IF NOT EXISTS master_gender (
    gender_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    gender_name VARCHAR(50) UNIQUE NOT NULL,
    gender_code VARCHAR(10) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2️⃣ Nationality Master
CREATE TABLE IF NOT EXISTS master_nationality (
    nationality_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nationality_name VARCHAR(100) UNIQUE NOT NULL,
    iso_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE
);

-- 3️⃣ Religion Master
CREATE TABLE IF NOT EXISTS master_religion (
    religion_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    religion_name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4️⃣ ID Proof Type Master
CREATE TABLE IF NOT EXISTS master_id_proof_type (
    id_proof_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    proof_name VARCHAR(100) UNIQUE NOT NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5️⃣ State Master
CREATE TABLE IF NOT EXISTS master_state (
    state_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    state_name VARCHAR(100) NOT NULL,
    state_code VARCHAR(10),
    country_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 6️⃣ District Master
CREATE TABLE IF NOT EXISTS master_district (
    district_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    district_name VARCHAR(100) NOT NULL,
    state_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (state_id) REFERENCES master_state(state_id)
);

-- 7️⃣ City Master
CREATE TABLE IF NOT EXISTS master_city (
    city_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    city_name VARCHAR(100) NOT NULL,
    district_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (district_id) REFERENCES master_district(district_id)
);

-- 8️⃣ Pincode Master
CREATE TABLE IF NOT EXISTS master_pincode (
    pincode_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pincode VARCHAR(10) NOT NULL,
    city_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (city_id) REFERENCES master_city(city_id)
);

-- 9️⃣ Language Master
CREATE TABLE IF NOT EXISTS master_language (
    language_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    language_name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 🔟 Title Master
CREATE TABLE IF NOT EXISTS master_title (
    title_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title_name VARCHAR(20) UNIQUE NOT NULL,
    gender_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (gender_id) REFERENCES master_gender(gender_id)
);

-- 1️⃣1️⃣ Referral Source Master
CREATE TABLE IF NOT EXISTS master_referral_source (
    referral_source_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_name VARCHAR(150) UNIQUE NOT NULL,
    source_type ENUM('Doctor','Hospital','Corporate','Self','Online','Camp'),
    is_active BOOLEAN DEFAULT TRUE
);

-- 1️⃣2️⃣ Death Cause Master
CREATE TABLE IF NOT EXISTS master_death_cause (
    death_cause_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cause_name VARCHAR(255) NOT NULL,
    icd_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);
