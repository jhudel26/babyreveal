-- Run this in your AlwaysData MySQL console
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    father_name VARCHAR(100) NOT NULL,
    mother_name VARCHAR(100) NOT NULL,
    code VARCHAR(16) NOT NULL UNIQUE,
    gender ENUM('boy', 'girl') NOT NULL,
    reveal_type ENUM('scratch', 'balloon', 'gift', 'tap') NOT NULL DEFAULT 'scratch',
    revealed BOOLEAN NOT NULL DEFAULT FALSE,
    revealed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_revealed (revealed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
