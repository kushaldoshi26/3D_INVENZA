<?php
// ─── 3D Invenza — Login Handler ─────────────────────────────
session_start();
include 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: login.html'); exit; }

function clean($v) { return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8'); }

$email    = clean($_POST['email']    ?? '');
$password = $_POST['password']       ?? '';
$remember = isset($_POST['remember']);

if (empty($email) || empty($password))
  { header("Location: login.html?error=" . urlencode('Email and password are required.')); exit; }

$stmt = $conn->prepare("SELECT id, name, email, password, role, status FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user['password'])) {
    $conn->close();
    header("Location: login.html?error=" . urlencode('Invalid email or password.')); exit;
}
if ($user['status'] === 'suspended') {
    $conn->close();
    header("Location: login.html?error=" . urlencode('Your account has been suspended. Please contact support.')); exit;
}

// Update last login
$conn->query("UPDATE users SET last_login=NOW() WHERE id=" . (int)$user['id']);
$conn->close();

// Set session
$_SESSION['user_id']   = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_role'] = $user['role'];
$_SESSION['user_email']= $user['email'];

// Remember me cookie (30 days)
if ($remember) {
    setcookie('invenza_remember', base64_encode($user['email']), time()+86400*30, '/', '', false, true);
}

// Redirect by role
if ($user['role'] === 'admin') { header('Location: ../admin/index.php'); }
else                           { header('Location: ../dashboard.html?welcome=1'); }
exit;
?>
