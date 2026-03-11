<?php
// ─── Admin Auth Guard ────────────────────────────────
session_start();
if (empty($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    header('Location: ../auth/login.html?error=' . urlencode('Admin access required. Please login.'));
    exit;
}

function current_admin_name() { return htmlspecialchars($_SESSION['user_name'] ?? 'Admin'); }
?>
