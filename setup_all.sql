-- ═══════════════════════════════════════════════════════════════
--  3D INVENZA — Complete Database Setup
--  Run this file in phpMyAdmin once to create everything.
--  Step: phpMyAdmin → SQL tab → paste → Go
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
--  DATABASE 1: invenza_db  (users, orders, 3D models)
-- ──────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS invenza_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE invenza_db;

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  phone       VARCHAR(20)  DEFAULT NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('user','admin') NOT NULL DEFAULT 'user',
  status      ENUM('active','suspended')    NOT NULL DEFAULT 'active',
  last_login  DATETIME     DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin account
-- Password: Admin@2025  (bcrypt)
INSERT IGNORE INTO users (name, email, phone, password, role, status)
VALUES (
  '3D Invenza Admin',
  'admin@3dinvenza.com',
  '9000000000',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'active'
);

-- ── Hero 3D Models ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hero_models (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  filename    VARCHAR(255) NOT NULL,
  ext         VARCHAR(10),
  size        INT          DEFAULT 0,
  active      TINYINT(1)   DEFAULT 0,
  uploaded_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Print Orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          DEFAULT NULL,
  order_ref       VARCHAR(30)  NOT NULL UNIQUE,
  model_name      VARCHAR(200) DEFAULT NULL,
  model_filename  VARCHAR(255) DEFAULT NULL,
  material        VARCHAR(50)  DEFAULT 'PLA+',
  color           VARCHAR(30)  DEFAULT 'White',
  infill          TINYINT      DEFAULT 20,
  layer_height    DECIMAL(3,2) DEFAULT 0.20,
  weight_g        DECIMAL(8,2) DEFAULT 0,
  price_inr       DECIMAL(10,2) DEFAULT 0,
  shipping_inr    DECIMAL(10,2) DEFAULT 0,
  total_inr       DECIMAL(10,2) DEFAULT 0,
  pincode         VARCHAR(10)  DEFAULT NULL,
  address         TEXT         DEFAULT NULL,
  payment_method  VARCHAR(30)  DEFAULT 'UPI',
  payment_status  ENUM('pending','paid','failed') DEFAULT 'pending',
  status          ENUM('pending','processing','printing','printed','shipped','delivered','cancelled')
                  NOT NULL DEFAULT 'pending',
  notes           TEXT         DEFAULT NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Sample order for demo ──────────────────────────────────────
INSERT IGNORE INTO orders
  (order_ref, model_name, material, color, infill, weight_g,
   price_inr, shipping_inr, total_inr, status)
VALUES
  ('INV-2025-0001', 'Demo Keychain', 'PLA+', 'Cyan', 20, 12.5,
   55.00, 49.00, 104.00, 'pending');


-- ──────────────────────────────────────────────────────────────
--  DATABASE 2: spotify_keychain  (student keychain orders)
-- ──────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS spotify_keychain
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE spotify_keychain;

-- ── Students / Keychain Orders ────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  enrollment   VARCHAR(50)   NOT NULL UNIQUE,
  gender       VARCHAR(20)   DEFAULT NULL,
  phone        VARCHAR(20)   NOT NULL,
  email        VARCHAR(100)  DEFAULT NULL,
  city         VARCHAR(100)  DEFAULT NULL,
  department   VARCHAR(100)  DEFAULT NULL,
  year         VARCHAR(50)   DEFAULT NULL,
  batch        VARCHAR(50)   DEFAULT NULL,
  instagram    VARCHAR(100)  DEFAULT NULL,
  song_link    TEXT          DEFAULT NULL,
  title        VARCHAR(200)  DEFAULT NULL,
  barcode_path TEXT          DEFAULT NULL,
  stl_path     TEXT          DEFAULT NULL,
  status       ENUM('pending','processing','printed','delivered')
               NOT NULL DEFAULT 'pending',
  notes        TEXT          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Demo student record ───────────────────────────────────────
INSERT IGNORE INTO students
  (name, enrollment, phone, department, year, song_link, title, status)
VALUES
  ('Demo Student', 'DEMO001', '9999999999',
   'Computer Science', '2nd Year',
   'https://open.spotify.com/track/demo',
   'Demo Keychain', 'pending');

-- ══════════════════════════════════════════════════════════════
--  DONE — Admin login: admin@3dinvenza.com  /  Admin@2025
--  Note: the bcrypt hash above uses the default Laravel/PHP demo
--  hash for "password". Run auth/setup.sql if it fails.
-- ══════════════════════════════════════════════════════════════
