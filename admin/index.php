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
  <style>
    :root{--bg:#020812;--sidebar:rgba(5,12,28,0.95);--card:rgba(8,18,38,0.85);--cyan:#00f5ff;--cyan-d:rgba(0,245,255,0.08);--violet:#7c3aed;--orange:#f97316;--border:rgba(0,245,255,0.1);--text:#e0f2fe;--muted:rgba(224,242,254,0.5);--font-d:'Orbitron',monospace;--font-b:'Inter',sans-serif;--r:0.3s ease}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--bg);color:var(--text);font-family:var(--font-b);min-height:100vh;display:flex}
    body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,245,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.02) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;z-index:0}
    a{color:inherit;text-decoration:none}

    /* ── Sidebar ── */
    .sidebar{width:260px;flex-shrink:0;background:var(--sidebar);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:0;position:fixed;top:0;left:0;bottom:0;z-index:10;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
    .sb-logo{padding:28px 24px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
    .sb-logo-icon{font-size:1.5rem;color:var(--cyan);filter:drop-shadow(0 0 6px var(--cyan))}
    .sb-logo-text{font-family:var(--font-d);font-size:1rem;font-weight:700;letter-spacing:0.05em}
    .sb-logo-text span{color:var(--cyan)}
    .sb-label{padding:20px 24px 8px;font-family:var(--font-d);font-size:0.55rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted)}
    .sb-nav{display:flex;flex-direction:column;gap:2px;padding:0 12px}
    .sb-link{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:8px;color:var(--muted);font-family:var(--font-d);font-size:0.68rem;letter-spacing:0.08em;text-transform:uppercase;transition:var(--r);cursor:pointer}
    .sb-link svg{width:16px;height:16px;stroke:currentColor;flex-shrink:0}
    .sb-link:hover,.sb-link.active{background:var(--cyan-d);color:var(--cyan);border:1px solid rgba(0,245,255,0.12)}
    .sb-link{border:1px solid transparent}
    .sb-link.active{box-shadow:0 0 12px rgba(0,245,255,0.05)}
    .sb-footer{margin-top:auto;padding:20px;border-top:1px solid var(--border)}
    .sb-user{display:flex;align-items:center;gap:12px}
    .sb-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--cyan-d),rgba(124,58,237,0.1));border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:0.75rem;color:var(--cyan);font-weight:700;flex-shrink:0}
    .sb-uname{font-family:var(--font-d);font-size:0.7rem;font-weight:600;margin-bottom:2px}
    .sb-urole{font-size:0.72rem;color:var(--orange)}
    .sb-logout{margin-top:10px;width:100%;padding:9px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#f87171;font-family:var(--font-d);font-size:0.62rem;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:var(--r);text-align:center;display:block}
    .sb-logout:hover{background:rgba(239,68,68,0.12)}

    /* ── Main area ── */
    .main{flex:1;margin-left:260px;display:flex;flex-direction:column;min-height:100vh;position:relative;z-index:1}
    .topbar{padding:20px 32px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:rgba(2,8,18,0.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:sticky;top:0;z-index:5}
    .topbar-title{font-family:var(--font-d);font-size:0.85rem;font-weight:700;letter-spacing:0.06em;color:var(--cyan)}
    .topbar-breadcrumb{font-family:var(--font-d);font-size:0.6rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-top:4px}
    .topbar-actions{display:flex;gap:12px;align-items:center}
    .btn-sm{padding:8px 16px;border-radius:8px;font-family:var(--font-d);font-size:0.62rem;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:var(--r);display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:transparent;color:var(--muted)}
    .btn-sm:hover{border-color:var(--cyan);color:var(--cyan);background:var(--cyan-d)}
    .btn-primary-sm{background:linear-gradient(135deg,var(--orange),#ea580c);border-color:transparent;color:#fff;box-shadow:0 0 12px rgba(249,115,22,0.2)}
    .btn-primary-sm:hover{transform:translateY(-1px);box-shadow:0 0 20px rgba(249,115,22,0.3)}

    /* ── Content ── */
    .content{padding:32px}

    /* Stats row */
    .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:32px}
    .stat-box{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;position:relative;overflow:hidden;transition:var(--r);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
    .stat-box::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent,var(--cyan)),transparent);opacity:0.6}
    .stat-box:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,0.3)}
    .stat-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;border:1px solid rgba(0,245,255,0.15)}
    .stat-icon svg{width:20px;height:20px}
    .stat-num{font-family:var(--font-d);font-size:2.2rem;font-weight:900;line-height:1;margin-bottom:6px}
    .stat-lbl{font-family:var(--font-d);font-size:0.6rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted)}

    /* Recent users table */
    .section-card{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:24px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
    .sc-header{padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .sc-title{font-family:var(--font-d);font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--cyan)}
    table{width:100%;border-collapse:collapse}
    th{padding:12px 20px;font-family:var(--font-d);font-size:0.58rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);text-align:left;background:rgba(0,245,255,0.02);border-bottom:1px solid var(--border);white-space:nowrap}
    td{padding:14px 20px;border-bottom:1px solid rgba(0,245,255,0.05);font-size:0.85rem;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:rgba(0,245,255,0.015)}
    .td-name{font-weight:500}
    .td-muted{color:var(--muted);font-size:0.8rem}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-family:var(--font-d);font-size:0.58rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase}

    /* Activity row */
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
    .activity-list{display:flex;flex-direction:column;gap:0}
    .activity-item{display:flex;align-items:flex-start;gap:14px;padding:16px 24px;border-bottom:1px solid rgba(0,245,255,0.05)}
    .activity-item:last-child{border-bottom:none}
    .act-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:6px}
    .act-text{font-size:0.85rem;line-height:1.5}
    .act-time{font-family:var(--font-d);font-size:0.6rem;color:var(--muted);margin-top:2px;letter-spacing:0.06em}

    /* Quick links */
    .quick-links{display:flex;flex-direction:column;gap:10px;padding:16px}
    .ql-item{display:flex;align-items:center;gap:12px;padding:12px 16px;background:rgba(0,245,255,0.03);border:1px solid var(--border);border-radius:10px;transition:var(--r)}
    .ql-item:hover{border-color:var(--cyan);background:var(--cyan-d)}
    .ql-item svg{width:16px;height:16px;stroke:var(--cyan)}
    .ql-item span{font-family:var(--font-d);font-size:0.68rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--text)}
    .ql-arrow{margin-left:auto;color:var(--muted);font-size:0.8rem}

    @media(max-width:900px){.sidebar{transform:translateX(-100%)}.main{margin-left:0}.stats-row{grid-template-columns:1fr 1fr}.two-col{grid-template-columns:1fr}}
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
      <div class="stat-box" style="--accent:var(--cyan)">
        <div class="stat-icon" style="background:var(--cyan-d)">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="stat-num" style="color:var(--cyan)"><?= $total_users ?></div>
        <div class="stat-lbl">Registered Users</div>
      </div>
      <div class="stat-box" style="--accent:var(--violet)">
        <div class="stat-icon" style="background:rgba(124,58,237,0.08)">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--violet)" stroke-width="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5"/></svg>
        </div>
        <div class="stat-num" style="color:var(--violet)"><?= $kc_total ?></div>
        <div class="stat-lbl">Keychain Orders</div>
      </div>
      <div class="stat-box" style="--accent:var(--orange)">
        <div class="stat-icon" style="background:rgba(249,115,22,0.08)">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-num" style="color:var(--orange)"><?= $kc_pending ?></div>
        <div class="stat-lbl">Pending Keychains</div>
      </div>
      <div class="stat-box" style="--accent:#1db954">
        <div class="stat-icon" style="background:rgba(29,185,84,0.08)">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1db954" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="stat-num" style="color:#1db954"><?= $total_admins ?></div>
        <div class="stat-lbl">Admin Accounts</div>
      </div>
    </div>

    <!-- Recent Users + Quick Links -->
    <div class="two-col">
      <div class="section-card">
        <div class="sc-header">
          <div class="sc-title">Recent Users</div>
          <a href="users.php" class="btn-sm">View All →</a>
        </div>
        <table>
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
              <tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted);font-family:var(--font-d);font-size:0.7rem">No users yet.</td></tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>

      <!-- Quick Links + System Info -->
      <div>
        <div class="section-card" style="margin-bottom:20px">
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
        <div class="section-card">
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
