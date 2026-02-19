-- Procedure: sp_get_patient_registration_masters
DROP PROCEDURE IF EXISTS sp_get_patient_registration_masters;

CREATE PROCEDURE sp_get_patient_registration_masters()
BEGIN
    -- 1. Genders
    SELECT gender_id, gender_name FROM master_gender WHERE is_active = TRUE;

    -- 2. Titles
    SELECT title_id, title_name, gender_id FROM master_title WHERE is_active = TRUE;

    -- 3. Nationalities
    SELECT nationality_id, nationality_name, iso_code FROM master_nationality WHERE is_active = TRUE;

    -- 4. Religions
    SELECT religion_id, religion_name FROM master_religion WHERE is_active = TRUE;

    -- 5. ID Proof Types
    SELECT id_proof_type_id, proof_name, is_mandatory FROM master_id_proof_type WHERE is_active = TRUE;

    -- 6. Referral Sources
    SELECT referral_source_id, source_name, source_type FROM master_referral_source WHERE is_active = TRUE;

    -- 7. List States
    SELECT state_id, state_name FROM master_state WHERE is_active = TRUE;
END;
