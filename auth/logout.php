<?php
// ─── 3D Invenza — Logout ────────────────────────────────────
session_start();
session_destroy();
setcookie('invenza_remember', '', time()-3600, '/');
header('Location: ../auth/login.html?logout=1');
exit;
?>
