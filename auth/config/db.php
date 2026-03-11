<?php
// ─── 3D Invenza — Shared DB Config ─────────────────────────
$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "invenza_db";

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    die(json_encode(['error' => 'DB connection failed']));
}
$conn->set_charset("utf8mb4");
