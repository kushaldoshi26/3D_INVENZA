<?php
include '../admin/config.php';
include '../auth/config/db.php';

// Stats
$total_users     = $conn->query("SELECT COUNT(*) AS c FROM users WHERE role='user'")->fetch_assoc()['c'];
$total_keychains = $conn->query("SELECT COUNT(*) AS c FROM invenza_db.users")->fetch_assoc()['c'] ?? 0;
$total_admins    = $conn->query("SELECT COUNT(*) AS c FROM users WHERE role='admin'")->fetch_assoc()['c'];
// Try to get keychain stats from keychain DB if available
$kc_pending = 0; $kc_total = 0;
$kc = @new mysqli("localhost","root","","spotify_keychain");
if (!$kc->connect_error) {
  $kc_total   = $kc->query("SELECT COUNT(*) AS c FROM students")->fetch_assoc()['c'] ?? 0;
  $kc_pending = $kc->query("SELECT COUNT(*) AS c FROM students WHERE status='pending'")->fetch_assoc()['c'] ?? 0;
  $kc->close();
}

// Recent 5 users
$recent = $conn->query("SELECT id,name,email,role,status,created_at FROM users ORDER BY created_at DESC LIMIT 5");
$conn->close();

$status_colors = ['active'=>'#1db954','suspended'=>'#ef4444'];
$role_colors   = ['admin'=>'#f97316','user'=>'#00f5ff'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Dashboard — 3D Invenza</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/premium-php.css" />
  <style>
    /* Page specific overrides */
    .stat-box { --accent: var(--cyan); }
    .stat-box:nth-child(2) { --accent: var(--violet); }
    .stat-box:nth-child(3) { --accent: var(--orange); }
    .stat-box:nth-child(4) { --accent: var(--green); }
    
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid rgba(0,245,255,0.15); }
    .stat-num { font-family: var(--font-display); font-size: 2.2rem; font-weight: 900; line-height: 1; margin-bottom: 6px; }
    .stat-lbl { font-family: var(--font-display); font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(224, 242, 254, 0.5); }
    
    .content { padding: 32px; position: relative; z-index: 1; }
    .main { flex: 1; margin-left: 260px; min-height: 100vh; }
    .topbar { padding: 20px 32px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: rgba(2,8,18,0.8); backdrop-filter: blur(20px); position: sticky; top:0; z-index: 5; }
    .sidebar { width: 260px; background: var(--sidebar); border-right: 1px solid var(--border); position: fixed; top: 0; left: 0; bottom: 0; z-index: 10; backdrop-filter: blur(20px); display: flex; flex-direction: column; }
    
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-family: var(--font-display); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
  </style>
</head>
<body>
<!-- ── SIDEBAR ─────────────────────────────────────── -->
<aside class="sidebar">
  <div class="sb-logo">
    <span class="sb-logo-icon">⬡</span>
    <span class="sb-logo-text">3D<span>INVENZA</span></span>
  </div>

  <div class="sb-label">Main</div>
  <nav class="sb-nav">
    <a href="index.php" class="sb-link active">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      Dashboard
    </a>
    <a href="users.php" class="sb-link">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
      Users
    </a>
    <a href="orders.php" class="sb-link">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
      Orders
    </a>
    <a href="models.php" class="sb-link">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
      3D Models
    </a>
    <a href="../keychain-system/admin.php" class="sb-link">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
      Keychains
    </a>
  </nav>

  <div class="sb-label">Settings</div>
  <nav class="sb-nav">
    <a href="../index.html" class="sb-link">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      View Website
    </a>
  </nav>

  <div class="sb-footer">
    <div class="sb-user">
      <div class="sb-avatar"><?= strtoupper(substr($_SESSION['user_name'],0,1)) ?></div>
      <div>
        <div class="sb-uname"><?= current_admin_name() ?></div>
        <div class="sb-urole">Administrator</div>
      </div>
    </div>
    <a href="../auth/logout.php" class="sb-logout">Sign Out →</a>
  </div>
</aside>

<!-- ── MAIN ───────────────────────────────────────── -->
<main class="main">
  <div class="topbar">
    <div>
      <div class="topbar-title">Admin Dashboard</div>
      <div class="topbar-breadcrumb">3D Invenza · Admin Panel</div>
    </div>
    <div class="topbar-actions">
      <a href="users.php" class="btn-sm">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        Manage Users
      </a>
      <a href="../auth/login.html" class="btn-sm btn-primary-sm">View Site →</a>
    </div>
  </div>

  <div class="content">
    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-box premium-card">
        <div class="stat-icon" style="background:var(--cyan-dim)">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="stat-num" style="color:var(--cyan)"><?= $total_users ?></div>
        <div class="stat-lbl">Registered Users</div>
      </div>
      <div class="stat-box premium-card">
        <div class="stat-icon" style="background:rgba(124,58,237,0.08)">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--violet)" stroke-width="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5"/></svg>
        </div>
        <div class="stat-num" style="color:var(--violet)"><?= $kc_total ?></div>
        <div class="stat-lbl">Keychain Orders</div>
      </div>
      <div class="stat-box premium-card">
        <div class="stat-icon" style="background:rgba(249,115,22,0.08)">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-num" style="color:var(--orange)"><?= $kc_pending ?></div>
        <div class="stat-lbl">Pending Keychains</div>
      </div>
      <div class="stat-box premium-card">
        <div class="stat-icon" style="background:rgba(29,185,84,0.08)">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1db954" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="stat-num" style="color:#1db954"><?= $total_admins ?></div>
        <div class="stat-lbl">Admin Accounts</div>
      </div>
    </div>

    <!-- Recent Users + Quick Links -->
    <div class="two-col">
      <div class="section-card premium-card">
        <div class="sc-header">
          <div class="sc-title">Recent Users</div>
          <a href="users.php" class="premium-btn">View All →</a>
        </div>
        <table class="premium-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            <?php if ($recent && $recent->num_rows > 0): ?>
              <?php while($r = $recent->fetch_assoc()): $sc=$status_colors[$r['status']]??'#999'; $rc=$role_colors[$r['role']]??'#999'; ?>
                <tr>
                  <td><div class="td-name"><?= htmlspecialchars($r['name']) ?></div></td>
                  <td><div class="td-muted"><?= htmlspecialchars($r['email']) ?></div></td>
                  <td><span class="badge" style="background:<?=$rc?>22;color:<?=$rc?>;border:1px solid <?=$rc?>44"><?= strtoupper($r['role']) ?></span></td>
                  <td><span class="badge" style="background:<?=$sc?>22;color:<?=$sc?>;border:1px solid <?=$sc?>44"><?= strtoupper($r['status']) ?></span></td>
                  <td class="td-muted"><?= date('d M', strtotime($r['created_at'])) ?></td>
                </tr>
              <?php endwhile; ?>
            <?php else: ?>
              <tr><td colspan="5" style="text-align:center;padding:32px;color:rgba(224, 242, 254, 0.5);font-family:var(--font-display);font-size:0.7rem">No users yet.</td></tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>

      <!-- Quick Links + System Info -->
      <div>
        <div class="section-card premium-card" style="margin-bottom:20px">
          <div class="sc-header"><div class="sc-title">Quick Actions</div></div>
          <div class="quick-links">
            <a href="users.php" class="ql-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>
              <span>Manage All Users</span><span class="ql-arrow">→</span>
            </a>
            <a href="../keychain-system/admin.php" class="ql-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778"/></svg>
              <span>Keychain Orders</span><span class="ql-arrow">→</span>
            </a>
            <a href="../index.html" class="ql-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              <span>View Live Website</span><span class="ql-arrow">→</span>
            </a>
            <a href="../auth/logout.php" class="ql-item" style="border-color:rgba(239,68,68,0.15);color:#f87171">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span style="color:#f87171">Sign Out</span><span class="ql-arrow">→</span>
            </a>
          </div>
        </div>
        <div class="section-card premium-card">
          <div class="sc-header"><div class="sc-title">System Info</div></div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
            <?php
            $items = [
              ['PHP Version', PHP_VERSION, 'var(--cyan)'],
              ['Server', $_SERVER['SERVER_SOFTWARE'] ?? 'localhost', 'var(--violet)'],
              ['DB', 'MySQL / MariaDB', '#1db954'],
              ['Logged in as', current_admin_name(), 'var(--orange)'],
            ];
            foreach($items as [$k,$v,$c]): ?>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="font-family:var(--font-d);font-size:0.6rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)"><?= $k ?></span>
              <span style="font-family:var(--font-d);font-size:0.68rem;color:<?= $c ?>"><?= htmlspecialchars($v) ?></span>
            </div>
            <?php endforeach; ?>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
</body>
</html>
