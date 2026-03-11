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
  <link rel="stylesheet" href="../css/premium-php.css" />
  <style>
    .main { flex: 1; margin-left: 260px; min-height: 100vh; }
    .topbar { padding: 20px 32px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: rgba(2,8,18,0.8); backdrop-filter: blur(20px); position: sticky; top:0; z-index: 5; }
    .sidebar { width: 260px; background: var(--sidebar); border-right: 1px solid var(--border); position: fixed; top: 0; left: 0; bottom: 0; z-index: 10; backdrop-filter: blur(20px); display: flex; flex-direction: column; }
    
    .content { padding: 32px; position: relative; z-index: 1; }
    .alert { padding: 12px 20px; border-radius: 8px; margin-bottom: 24px; font-family: var(--font-display); font-size: 0.68rem; letter-spacing: 0.06em; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: var(--green); }
    
    .filter-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 260px; }
    .filter-select { background: rgba(0,245,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--cyan); font-family: var(--font-display); font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; outline: none; cursor: pointer; }
    .filter-select option { background: #0a1428; color: white; }

    .overflow-x { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .td-muted { color: rgba(224, 242, 254, 0.5); font-size: 0.8rem; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-family: var(--font-display); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
    
    .act-btn { padding: 5px 10px; border-radius: 6px; font-family: var(--font-display); font-size: 0.58rem; letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .act-suspend { border-color: rgba(251,146,60,0.3); color: var(--orange); }
    .act-activate { border-color: rgba(52,211,153,0.3); color: var(--green); }
    .act-admin { border-color: rgba(0,245,255,0.25); color: var(--cyan); }
    .act-user { border-color: rgba(139,92,246,0.3); color: var(--violet); }
    .act-del { border-color: rgba(239,68,68,0.3); color: #f87171; }
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
    <a href="index.php" class="premium-btn">← Dashboard</a>
  </div>
  <div class="content">
    <?php if (isset($_GET['msg'])): ?>
      <div class="alert alert-ok">✓ <?= $_GET['msg'] === 'deleted' ? 'User deleted.' : 'User updated.' ?></div>
    <?php endif; ?>

    <form method="GET" class="filter-bar">
      <input class="search-input premium-input" type="text" name="q" value="<?= htmlspecialchars($q) ?>" placeholder="Search name or email…" />
      <select class="filter-select" name="role_f" onchange="this.form.submit()">
        <option value="">All Roles</option>
        <option value="user" <?= $role==='user'?'selected':'' ?>>Users</option>
        <option value="admin" <?= $role==='admin'?'selected':'' ?>>Admins</option>
      </select>
      <button class="premium-btn" type="submit">Search</button>
      <?php if ($q||$role): ?><a href="users.php" class="premium-btn" style="border-color:rgba(239,68,68,0.3);color:#f87171">Clear</a><?php endif; ?>
    </form>

    <div class="table-card premium-card">
      <div class="tc-header">
        <div class="tc-title">All Users</div>
        <span style="font-family:var(--font-display);font-size:0.6rem;color:rgba(224, 242, 254, 0.5)"><?= $users->num_rows ?? 0 ?> shown</span>
      </div>
      <div class="overflow-x">
        <table class="premium-table">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            <?php if ($users && $users->num_rows > 0): ?>
              <?php while($u = $users->fetch_assoc()): $s=$sc[$u['status']]??'#999'; $rr=$rc[$u['role']]??'#999'; $isSelf=((int)$u['id']===(int)$_SESSION['user_id']); ?>
                <tr>
                  <td class="td-muted"><?= $u['id'] ?></td>
                  <td><?= htmlspecialchars($u['name']) ?><?= $isSelf?' <span style="font-family:var(--font-display);font-size:0.55rem;color:var(--cyan)">(you)</span>':'' ?></td>
                  <td class="td-muted"><?= htmlspecialchars($u['email']) ?></td>
                  <td class="td-muted"><?= htmlspecialchars($u['phone']??'—') ?></td>
                  <td><span class="badge" style="background:<?=$rr?>22;color:<?=$rr?>;border:1px solid <?=$rr?>44"><?= strtoupper($u['role']) ?></span></td>
                  <td><span class="badge" style="background:<?=$s?>22;color:<?=$s?>;border:1px solid <?=$s?>44"><?= strtoupper($u['status']) ?></span></td>
                  <td class="td-muted"><?= date('d M Y', strtotime($u['created_at'])) ?></td>
                  <td>
                    <?php if (!$isSelf): ?>
                    <div class="action-group" style="display:flex;gap:6px">
                      <a href="users.php?toggle=<?=$u['id']?>" class="act-btn <?=$u['status']==='active'?'act-suspend':'act-activate'?>" onclick="return confirm('Change status of <?= addslashes($u['name']) ?>?')">
                        <?=$u['status']==='active'?'Suspend':'Activate'?>
                      </a>
                      <a href="users.php?role=<?=$u['role']==='admin'?'user':'admin'?>&id=<?=$u['id']?>" class="act-btn <?=$u['role']==='admin'?'act-user':'act-admin'?>" onclick="return confirm('Change role?')">
                        <?=$u['role']==='admin'?'→User':'→Admin'?>
                      </a>
                      <a href="users.php?delete=<?=$u['id']?>" class="act-btn act-del" onclick="return confirm('Delete user <?= addslashes($u['name']) ?>? This cannot be undone.')">Del</a>
                    </div>
                    <?php else: ?>
                    <span class="td-muted" style="font-family:var(--font-display);font-size:0.6rem">— your account</span>
                    <?php endif; ?>
                  </td>
                </tr>
              <?php endwhile; ?>
            <?php else: ?>
              <tr><td colspan="8" style="text-align:center;padding:48px;color:rgba(224, 242, 254, 0.5);font-family:var(--font-display);font-size:0.7rem;letter-spacing:0.08em">No users found.</td></tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</main>
</body>
</html>
