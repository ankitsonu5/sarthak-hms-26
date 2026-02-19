-- Auth System: users, roles, sessions, password reset

CREATE TABLE IF NOT EXISTS master_roles (
    role_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL,
    hospital_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES master_roles(role_id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    session_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    refresh_token TEXT NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Seed roles
INSERT IGNORE INTO master_roles (role_id, role_name, description) VALUES
(1, 'SUPER_ADMIN', 'Full system access'),
(2, 'HOSPITAL_ADMIN', 'Hospital-level admin'),
(3, 'DOCTOR', 'Doctor/Consultant'),
(4, 'NURSE', 'Nursing staff'),
(5, 'BILLING', 'Billing staff'),
(6, 'INSURANCE', 'Insurance team');
