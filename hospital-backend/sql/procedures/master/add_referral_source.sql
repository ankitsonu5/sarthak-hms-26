-- Procedure: sp_add_referral_source
DROP PROCEDURE IF EXISTS sp_add_referral_source;

CREATE PROCEDURE sp_add_referral_source(
    IN p_source_name VARCHAR(150),
    IN p_source_type VARCHAR(50),
    OUT p_source_id BIGINT
)
BEGIN
    DECLARE v_exists INT;

    SELECT referral_source_id INTO v_exists 
    FROM master_referral_source 
    WHERE source_name = p_source_name LIMIT 1;

    IF v_exists IS NOT NULL THEN
        SET p_source_id = v_exists;
    ELSE
        INSERT INTO master_referral_source (source_name, source_type) VALUES (p_source_name, p_source_type);
        SET p_source_id = LAST_INSERT_ID();
    END IF;
END;
