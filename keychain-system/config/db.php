<?php
// ─── 3D Invenza — Database Configuration ────────────────────
// Database: spotify_keychain
// Host: localhost (XAMPP default)
// Run the SQL below to create the table before using the system.

/*
SQL SETUP — run this in phpMyAdmin:

CREATE DATABASE IF NOT EXISTS spotify_keychain CHARACTER SET utf8mb4;

USE spotify_keychain;

CREATE TABLE IF NOT EXISTS students (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  enrollment   VARCHAR(50)  NOT NULL,
  gender       VARCHAR(20),
  phone        VARCHAR(20)  NOT NULL,
  email        VARCHAR(100),
  city         VARCHAR(100),
  department   VARCHAR(100),
  year         VARCHAR(50),
  batch        VARCHAR(50),
  instagram    VARCHAR(100),
  song_link    TEXT,
  title        VARCHAR(200),
  barcode_path TEXT,
  stl_path     TEXT,
  status       ENUM('pending','processing','printed','delivered') DEFAULT 'pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

*/

$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "spotify_keychain";

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");
?>
