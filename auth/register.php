<?php
// ─── 3D Invenza — Registration Handler ─────────────────────
session_start();
include 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: register.html'); exit; }

function clean($v) { return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8'); }

$name     = clean($_POST['name']             ?? '');
$email    = clean($_POST['email']            ?? '');
$phone    = clean($_POST['phone']            ?? '');
$password = $_POST['password']               ?? '';
$confirm  = $_POST['password_confirm']       ?? '';

// Validate
if (empty($name) || empty($email) || empty($password))
  { header("Location: register.html?error=" . urlencode('Name, email and password are required.')); exit; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL))
  { header("Location: register.html?error=" . urlencode('Please enter a valid email address.')); exit; }
if (strlen($password) < 8)
  { header("Location: register.html?error=" . urlencode('Password must be at least 8 characters.')); exit; }
if ($password !== $confirm)
  { header("Location: register.html?error=" . urlencode('Passwords do not match.')); exit; }

// Duplicate check
$chk = $conn->prepare("SELECT id FROM users WHERE email = ?");
$chk->bind_param("s", $email);
$chk->execute();
$chk->store_result();
if ($chk->num_rows > 0) { header("Location: register.html?error=" . urlencode('This email is already registered. Please sign in.')); exit; }
$chk->close();

// Hash password & insert
$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $conn->prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $name, $email, $phone, $hash);

if ($stmt->execute()) {
    $stmt->close(); $conn->close();
    header("Location: login.html?registered=1"); exit;
} else {
    $stmt->close(); $conn->close();
    header("Location: register.html?error=" . urlencode('Registration failed. Please try again.')); exit;
}
?>
