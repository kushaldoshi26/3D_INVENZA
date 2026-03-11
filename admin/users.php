<?php
include '../admin/config.php';
include '../auth/config/db.php';

// Delete user
if (isset($_GET['delete']) && (int)$_GET['delete'] > 0) {
    $did = (int)$_GET['delete'];
    if ($did !== (int)$_SESSION['user_id']) {
        $conn->query("DELETE FROM users WHERE id=$did AND role != 'admin'");
    }
    header('Location: users.php?msg=deleted'); exit;
}
// Toggle status
if (isset($_GET['toggle']) && (int)$_GET['toggle'] > 0) {
    $tid = (int)$_GET['toggle'];
    $cur = $conn->query("SELECT status FROM users WHERE id=$tid")->fetch_assoc()['status'] ?? 'active';
    $new = $cur === 'active' ? 'suspended' : 'active';
    $conn->query("UPDATE users SET status='$new' WHERE id=$tid AND id != " . (int)$_SESSION['user_id']);
    header('Location: users.php?msg=updated'); exit;
}
// Promote/demote role
if (isset($_GET['role'], $_GET['id'])) {
    $rid = (int)$_GET['id'];
    $nr  = in_array($_GET['role'], ['admin','user']) ? $_GET['role'] : 'user';
    if ($rid !== (int)$_SESSION['user_id']) {
        $conn->query("UPDATE users SET role='$nr' WHERE id=$rid");
    }
    header('Location: users.php?msg=updated'); exit;
}

// Search / filter
$q    = trim($_GET['q']    ?? '');
$role = $_GET['role_f'] ?? '';
$sql  = "SELECT * FROM users WHERE 1=1";
if ($q)    { $qs = $conn->real_escape_string($q); $sql .= " AND (name LIKE '%$qs%' OR email LIKE '%$qs%')"; }
if ($role) { $rs = $conn->real_escape_string($role); $sql .= " AND role='$rs'"; }
$sql .= " ORDER BY created_at DESC";
$users = $conn->query($sql);
$total = $conn->query("SELECT COUNT(*) AS c FROM users")->fetch_assoc()['c'];
$conn->close();

$sc = ['active'=>'#1db954','suspended'=>'#ef4444'];
$rc = ['admin'=>'#f97316','user'=>'#00f5ff'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Users — Admin | 3D Invenza</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root{--bg:#020812;--card:rgba(8,18,38,0.85);--cyan:#00f5ff;--cyan-d:rgba(0,245,255,0.08);--violet:#7c3aed;--orange:#f97316;--border:rgba(0,245,255,0.1);--text:#e0f2fe;--muted:rgba(224,242,254,0.5);--font-d:'Orbitron',monospace;--font-b:'Inter',sans-serif}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--bg);color:var(--text);font-family:var(--font-b);min-height:100vh;display:flex}
    body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,245,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.02) 1px,transparent 1px);background-size:60px 60px;pointer-events:none}
    a{color:inherit;text-decoration:none}
    /* Sidebar identical to index.php */
    .sidebar{width:260px;flex-shrink:0;background:rgba(5,12,28,0.95);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:10;backdrop-filter:blur(20px)}
    .sb-logo{padding:28px 24px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
    .sb-logo-icon{font-size:1.5rem;color:var(--cyan);filter:drop-shadow(0 0 6px var(--cyan))}
    .sb-logo-text{font-family:var(--font-d);font-size:1rem;font-weight:700;letter-spacing:0.05em}
    .sb-logo-text span{color:var(--cyan)}
    .sb-label{padding:20px 24px 8px;font-family:var(--font-d);font-size:0.55rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted)}
    .sb-nav{display:flex;flex-direction:column;gap:2px;padding:0 12px}
    .sb-link{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:8px;color:var(--muted);font-family:var(--font-d);font-size:0.68rem;letter-spacing:0.08em;text-transform:uppercase;transition:0.3s;border:1px solid transparent}
    .sb-link svg{width:16px;height:16px;stroke:currentColor;flex-shrink:0}
    .sb-link:hover,.sb-link.active{background:var(--cyan-d);color:var(--cyan);border-color:rgba(0,245,255,0.12)}
    .sb-footer{margin-top:auto;padding:20px;border-top:1px solid var(--border)}
    .sb-avatar{width:36px;height:36px;border-radius:50%;background:var(--cyan-d);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:0.75rem;color:var(--cyan);font-weight:700;flex-shrink:0}
    .sb-user{display:flex;align-items:center;gap:12px}
    .sb-uname{font-family:var(--font-d);font-size:0.7rem;font-weight:600}
    .sb-urole{font-size:0.72rem;color:var(--orange)}
    .sb-logout{margin-top:10px;width:100%;padding:9px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#f87171;font-family:var(--font-d);font-size:0.62rem;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:0.3s;text-align:center;display:block}
    /* Main */
    .main{flex:1;margin-left:260px;position:relative;z-index:1}
    .topbar{padding:20px 32px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:rgba(2,8,18,0.8);backdrop-filter:blur(20px);position:sticky;top:0;z-index:5}
    .topbar-title{font-family:var(--font-d);font-size:0.85rem;font-weight:700;letter-spacing:0.06em;color:var(--cyan)}
    .topbar-bc{font-family:var(--font-d);font-size:0.6rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-top:4px}
    .content{padding:32px}
    .btn-sm{padding:8px 16px;border-radius:8px;font-family:var(--font-d);font-size:0.62rem;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:0.3s;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:transparent;color:var(--muted)}
    .btn-sm:hover{border-color:var(--cyan);color:var(--cyan);background:var(--cyan-d)}
    /* Alert */
    .alert{padding:12px 20px;border-radius:8px;margin-bottom:20px;font-family:var(--font-d);font-size:0.68rem;letter-spacing:0.06em}
    .alert-ok{background:rgba(29,185,84,0.1);border:1px solid rgba(29,185,84,0.3);color:#1db954}
    /* Filter bar */
    .filter-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
    .search-input{flex:1;min-width:220px;padding:10px 16px;background:rgba(0,245,255,0.03);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-b);font-size:0.9rem;outline:none;transition:0.3s}
    .search-input:focus{border-color:var(--cyan)}
    .filter-select{padding:10px 14px;background:rgba(0,245,255,0.03);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-d);font-size:0.65rem;outline:none;cursor:pointer}
    .filter-select option{background:#0a1428}
    /* Table */
    .table-card{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;backdrop-filter:blur(20px)}
    .tc-header{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .tc-title{font-family:var(--font-d);font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--cyan)}
    table{width:100%;border-collapse:collapse}
    th{padding:12px 20px;font-family:var(--font-d);font-size:0.58rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);text-align:left;background:rgba(0,245,255,0.02);border-bottom:1px solid var(--border);white-space:nowrap}
    td{padding:13px 20px;border-bottom:1px solid rgba(0,245,255,0.05);font-size:0.85rem;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:rgba(0,245,255,0.015)}
    .td-muted{color:var(--muted);font-size:0.78rem}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-family:var(--font-d);font-size:0.58rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase}
    .action-group{display:flex;gap:6px;flex-wrap:nowrap}
    .act-btn{padding:5px 10px;border-radius:6px;font-family:var(--font-d);font-size:0.58rem;letter-spacing:0.06em;text-transform:uppercase;border:1px solid;cursor:pointer;transition:0.2s;text-decoration:none;display:inline-block}
    .act-suspend{border-color:rgba(249,115,22,0.3);color:var(--orange)}
    .act-activate{border-color:rgba(29,185,84,0.3);color:#1db954}
    .act-admin{border-color:rgba(0,245,255,0.25);color:var(--cyan)}
    .act-user{border-color:rgba(124,58,237,0.3);color:var(--violet)}
    .act-del{border-color:rgba(239,68,68,0.3);color:#f87171}
    .act-btn:hover{opacity:0.85}
    .empty-state{padding:48px;text-align:center;color:var(--muted);font-family:var(--font-d);font-size:0.7rem;letter-spacing:0.08em}
    .overflow-x{overflow-x:auto}
  </style>
</head>
<body>
<aside class="sidebar">
  <div class="sb-logo"><span class="sb-logo-icon">⬡</span><span class="sb-logo-text">3D<span>INVENZA</span></span></div>
  <div class="sb-label">Main</div>
  <nav class="sb-nav">
    <a href="index.php" class="sb-link"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Dashboard</a>
    <a href="users.php" class="sb-link active"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>Users</a>
    <a href="../keychain-system/admin.php" class="sb-link"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778"/></svg>Keychains</a>
  </nav>
  <div class="sb-label">Settings</div>
  <nav class="sb-nav">
    <a href="../index.html" class="sb-link"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>View Website</a>
  </nav>
  <div class="sb-footer">
    <div class="sb-user">
      <div class="sb-avatar"><?= strtoupper(substr($_SESSION['user_name'],0,1)) ?></div>
      <div><div class="sb-uname"><?= current_admin_name() ?></div><div class="sb-urole">Administrator</div></div>
    </div>
    <a href="../auth/logout.php" class="sb-logout">Sign Out →</a>
  </div>
</aside>

<main class="main">
  <div class="topbar">
    <div><div class="topbar-title">User Management</div><div class="topbar-bc">Admin · Users · <?= $total ?> total</div></div>
    <a href="index.php" class="btn-sm">← Dashboard</a>
  </div>
  <div class="content">
    <?php if (isset($_GET['msg'])): ?>
      <div class="alert alert-ok">✓ <?= $_GET['msg'] === 'deleted' ? 'User deleted.' : 'User updated.' ?></div>
    <?php endif; ?>

    <form method="GET" class="filter-bar">
      <input class="search-input" type="text" name="q" value="<?= htmlspecialchars($q) ?>" placeholder="Search name or email…" />
      <select class="filter-select" name="role_f" onchange="this.form.submit()">
        <option value="">All Roles</option>
        <option value="user" <?= $role==='user'?'selected':'' ?>>Users</option>
        <option value="admin" <?= $role==='admin'?'selected':'' ?>>Admins</option>
      </select>
      <button class="btn-sm" type="submit">Search</button>
      <?php if ($q||$role): ?><a href="users.php" class="btn-sm" style="border-color:rgba(239,68,68,0.3);color:#f87171">Clear</a><?php endif; ?>
    </form>

    <div class="table-card">
      <div class="tc-header">
        <div class="tc-title">All Users</div>
        <span style="font-family:var(--font-d);font-size:0.6rem;color:var(--muted)"><?= $users->num_rows ?? 0 ?> shown</span>
      </div>
      <div class="overflow-x">
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            <?php if ($users && $users->num_rows > 0): ?>
              <?php while($u = $users->fetch_assoc()): $s=$sc[$u['status']]??'#999'; $rr=$rc[$u['role']]??'#999'; $isSelf=((int)$u['id']===(int)$_SESSION['user_id']); ?>
                <tr>
                  <td class="td-muted"><?= $u['id'] ?></td>
                  <td><?= htmlspecialchars($u['name']) ?><?= $isSelf?' <span style="font-family:var(--font-d);font-size:0.55rem;color:var(--cyan)">(you)</span>':'' ?></td>
                  <td class="td-muted"><?= htmlspecialchars($u['email']) ?></td>
                  <td class="td-muted"><?= htmlspecialchars($u['phone']??'—') ?></td>
                  <td><span class="badge" style="background:<?=$rr?>22;color:<?=$rr?>;border:1px solid <?=$rr?>44"><?= strtoupper($u['role']) ?></span></td>
                  <td><span class="badge" style="background:<?=$s?>22;color:<?=$s?>;border:1px solid <?=$s?>44"><?= strtoupper($u['status']) ?></span></td>
                  <td class="td-muted"><?= date('d M Y', strtotime($u['created_at'])) ?></td>
                  <td>
                    <?php if (!$isSelf): ?>
                    <div class="action-group">
                      <a href="users.php?toggle=<?=$u['id']?>" class="act-btn <?=$u['status']==='active'?'act-suspend':'act-activate'?>" onclick="return confirm('Change status of <?= addslashes($u['name']) ?>?')">
                        <?=$u['status']==='active'?'Suspend':'Activate'?>
                      </a>
                      <a href="users.php?role=<?=$u['role']==='admin'?'user':'admin'?>&id=<?=$u['id']?>" class="act-btn <?=$u['role']==='admin'?'act-user':'act-admin'?>" onclick="return confirm('Change role?')">
                        <?=$u['role']==='admin'?'→User':'→Admin'?>
                      </a>
                      <a href="users.php?delete=<?=$u['id']?>" class="act-btn act-del" onclick="return confirm('Delete user <?= addslashes($u['name']) ?>? This cannot be undone.')">Del</a>
                    </div>
                    <?php else: ?>
                    <span class="td-muted" style="font-family:var(--font-d);font-size:0.6rem">— your account</span>
                    <?php endif; ?>
                  </td>
                </tr>
              <?php endwhile; ?>
            <?php else: ?>
              <tr><td colspan="8"><div class="empty-state">No users found.</div></td></tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</main>
</body>
</html>
