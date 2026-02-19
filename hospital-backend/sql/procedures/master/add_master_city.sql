-- Procedure: sp_add_master_city
DROP PROCEDURE IF EXISTS sp_add_master_city;

CREATE PROCEDURE sp_add_master_city(
    IN p_city_name VARCHAR(100),
    IN p_district_id BIGINT,
    IN p_pincode VARCHAR(10),
    OUT p_city_id BIGINT
)
BEGIN
    DECLARE v_city_exists INT;

    SELECT city_id INTO v_city_exists 
    FROM master_city 
    WHERE city_name = p_city_name AND district_id = p_district_id 
    LIMIT 1;

    IF v_city_exists IS NOT NULL THEN
        SET p_city_id = v_city_exists;
    ELSE
        INSERT INTO master_city (city_name, district_id) VALUES (p_city_name, p_district_id);
        SET p_city_id = LAST_INSERT_ID();
    END IF;

    IF p_pincode IS NOT NULL AND p_pincode != '' THEN
        INSERT IGNORE INTO master_pincode (pincode, city_id) VALUES (p_pincode, p_city_id);
    END IF;
END;
