-- =============================================
-- Seed Data: Master Tables for Patient Registration
-- Description: Populates dropdown values for the application
-- =============================================

-- 1. Hospital Branch (Default)
INSERT INTO hospital_branch (branch_name, branch_code, is_active)
VALUES 
('Main Hospital', 'MAIN001', TRUE)
ON DUPLICATE KEY UPDATE branch_name = branch_name;

-- 2. Patient Categories
INSERT INTO master_patient_category (category_name) VALUES
('Self-Pay'),
('Corporate'),
('Insurance'),
('Govt Scheme'),
('Staff'),
('VIP')
ON DUPLICATE KEY UPDATE category_name = category_name;

-- 3. Marital Status
INSERT INTO master_marital_status (status_name) VALUES
('Single'),
('Married'),
('Divorced'),
('Widowed'),
('Separated')
ON DUPLICATE KEY UPDATE status_name = status_name;

-- 4. Blood Groups
INSERT INTO master_blood_group (group_name) VALUES
('A+'), ('A-'),
('B+'), ('B-'),
('AB+'), ('AB-'),
('O+'), ('O-'),
('Unknown')
ON DUPLICATE KEY UPDATE group_name = group_name;

-- 5. Occupation (Common ones)
INSERT INTO master_occupation (occupation_name) VALUES
('Service'),
('Business'),
('Student'),
('Homemaker'),
('Retired'),
('Farmer'),
('Laborer'),
('Self-Employed'),
('Unemployed'),
('Other')
ON DUPLICATE KEY UPDATE occupation_name = occupation_name;

-- 6. Education Level
INSERT INTO master_education_level (level_name) VALUES
('Illiterate'),
('Primary School'),
('High School'),
('Graduate'),
('Post Graduate'),
('Doctorate'),
('Other')
ON DUPLICATE KEY UPDATE level_name = level_name;

-- 7. Socio-Economic Class (Modified Kuppuswamy or similar standards)
INSERT INTO master_socio_economic_class (class_name) VALUES
('Upper Class'),
('Upper Middle Class'),
('Lower Middle Class'),
('Upper Lower Class'),
('Lower Class')
ON DUPLICATE KEY UPDATE class_name = class_name;

-- 8. Relationships (for Emergency Contacts)
INSERT INTO master_relationship (relationship_name) VALUES
('Father'),
('Mother'),
('Spouse'),
('Son'),
('Daughter'),
('Brother'),
('Sister'),
('Friend'),
('Guardian'),
('Other')
ON DUPLICATE KEY UPDATE relationship_name = relationship_name;
