<?php
// ─── 3D Invenza — Orders Management ─────────────────────────
include '../admin/config.php';
include '../auth/config/db.php';

// Ensure orders table exists
$conn->query("CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  order_ref VARCHAR(30) NOT NULL UNIQUE,
  model_name VARCHAR(200) DEFAULT NULL,
  model_filename VARCHAR(255) DEFAULT NULL,
  material VARCHAR(50) DEFAULT 'PLA+',
  color VARCHAR(30) DEFAULT 'White',
  infill TINYINT DEFAULT 20,
  layer_height DECIMAL(3,2) DEFAULT 0.20,
  weight_g DECIMAL(8,2) DEFAULT 0,
  price_inr DECIMAL(10,2) DEFAULT 0,
  shipping_inr DECIMAL(10,2) DEFAULT 0,
  total_inr DECIMAL(10,2) DEFAULT 0,
  pincode VARCHAR(10) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  payment_method VARCHAR(30) DEFAULT 'UPI',
  payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
  status ENUM('pending','processing','printing','printed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
)");

// ── CSV Export ───────────────────────────────────────────────
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    $all = $conn->query("SELECT o.*, u.name AS user_name, u.email AS user_email
                         FROM orders o LEFT JOIN users u ON o.user_id = u.id
                         ORDER BY o.created_at DESC");
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=orders_' . date('Ymd_His') . '.csv');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['ID','OrderRef','User','Email','Model','Material','Color','Infill%',
                   'Weight(g)','Price(₹)','Shipping(₹)','Total(₹)','Pincode',
                   'Payment','PayStatus','Status','Date']);
    while ($r = $all->fetch_assoc()) {
        fputcsv($out, [
            $r['id'], $r['order_ref'], $r['user_name']??'Guest', $r['user_email']??'—',
            $r['model_name'], $r['material'], $r['color'], $r['infill'],
            $r['weight_g'], $r['price_inr'], $r['shipping_inr'], $r['total_inr'],
            $r['pincode'], $r['payment_method'], $r['payment_status'],
            $r['status'], $r['created_at']
        ]);
    }
    fclose($out); $conn->close(); exit;
}

// ── Update order status ──────────────────────────────────────
if (isset($_GET['status'], $_GET['id'])) {
    $oid    = (int)$_GET['id'];
    $valid  = ['pending','processing','printing','printed','shipped','delivered','cancelled'];
    $status = in_array($_GET['status'], $valid) ? $_GET['status'] : 'pending';
    $conn->query("UPDATE orders SET status='$status' WHERE id=$oid");
    header('Location: orders.php?msg=updated'); exit;
}

// ── Delete order ─────────────────────────────────────────────
if (isset($_GET['delete'])) {
    $conn->query("DELETE FROM orders WHERE id=" . (int)$_GET['delete']);
    header('Location: orders.php?msg=deleted'); exit;
}

// ── Filter & fetch ───────────────────────────────────────────
$q      = trim($_GET['q']      ?? '');
$sf     = $_GET['status_f']    ?? '';
$pf     = $_GET['pay_f']       ?? '';
$sql    = "SELECT o.*, u.name AS uname, u.email AS uemail
           FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1";
if ($q)  { $qs = $conn->real_escape_string($q);  $sql .= " AND (o.order_ref LIKE '%$qs%' OR o.model_name LIKE '%$qs%' OR u.name LIKE '%$qs%')"; }
if ($sf) { $fs = $conn->real_escape_string($sf); $sql .= " AND o.status='$fs'"; }
if ($pf) { $fp = $conn->real_escape_string($pf); $sql .= " AND o.payment_status='$fp'"; }
$sql   .= " ORDER BY o.created_at DESC";
$orders = $conn->query($sql);

$total   = $conn->query("SELECT COUNT(*) AS c FROM orders")->fetch_assoc()['c'];
$revenue = $conn->query("SELECT SUM(total_inr) AS r FROM orders WHERE payment_status='paid'")->fetch_assoc()['r'] ?? 0;
$pending = $conn->query("SELECT COUNT(*) AS c FROM orders WHERE status='pending'")->fetch_assoc()['c'];
$conn->close();

$sColors = [
    'pending'=>'#f97316','processing'=>'#00f5ff','printing'=>'#7c3aed',
    'printed'=>'#a855f7','shipped'=>'#0ea5e9','delivered'=>'#1db954','cancelled'=>'#ef4444'
];
$pColors = ['pending'=>'#f97316','paid'=>'#1db954','failed'=>'#ef4444'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Orders — Admin | 3D Invenza</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    :root{--bg:#020812;--card:rgba(8,18,38,0.88);--cyan:#00f5ff;--cd:rgba(0,245,255,0.08);--violet:#7c3aed;--orange:#f97316;--border:rgba(0,245,255,0.10);--text:#e0f2fe;--muted:rgba(224,242,254,0.50);--fd:'Orbitron',monospace;--fb:'Inter',sans-serif}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--bg);color:var(--text);font-family:var(--fb);min-height:100vh;display:flex}
    body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,245,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,.02) 1px,transparent 1px);background-size:60px 60px;pointer-events:none}
    a{color:inherit;text-decoration:none}
    /* Sidebar */
    .sidebar{width:260px;flex-shrink:0;background:rgba(5,12,28,.95);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:10;backdrop-filter:blur(20px)}
    .sb-logo{padding:28px 24px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
    .sb-logo-icon{font-size:1.5rem;color:var(--cyan);filter:drop-shadow(0 0 6px var(--cyan))}
    .sb-logo-text{font-family:var(--fd);font-size:1rem;font-weight:700;letter-spacing:.05em}
    .sb-logo-text span{color:var(--cyan)}
    .sb-label{padding:20px 24px 8px;font-family:var(--fd);font-size:.55rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
    .sb-nav{display:flex;flex-direction:column;gap:2px;padding:0 12px}
    .sb-link{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:8px;color:var(--muted);font-family:var(--fd);font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;transition:.3s;border:1px solid transparent}
    .sb-link svg{width:16px;height:16px;stroke:currentColor;flex-shrink:0}
    .sb-link:hover,.sb-link.active{background:var(--cd);color:var(--cyan);border-color:rgba(0,245,255,.12)}
    .sb-footer{margin-top:auto;padding:20px;border-top:1px solid var(--border)}
    .sb-avatar{width:36px;height:36px;border-radius:50%;background:var(--cd);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:.75rem;color:var(--cyan);font-weight:700}
    .sb-user{display:flex;align-items:center;gap:12px}
    .sb-uname{font-family:var(--fd);font-size:.70rem;font-weight:600}
    .sb-urole{font-size:.72rem;color:var(--orange)}
    .sb-logout{margin-top:10px;width:100%;padding:9px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:8px;color:#f87171;font-family:var(--fd);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:.3s;text-align:center;display:block}
    /* Main */
    .main{flex:1;margin-left:260px;z-index:1;position:relative}
    .topbar{padding:20px 32px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:rgba(2,8,18,.8);backdrop-filter:blur(20px);position:sticky;top:0;z-index:5}
    .tb-title{font-family:var(--fd);font-size:.85rem;font-weight:700;color:var(--cyan);letter-spacing:.06em}
    .tb-sub{font-family:var(--fd);font-size:.60rem;color:var(--muted);letter-spacing:.10em;text-transform:uppercase;margin-top:4px}
    .tb-actions{display:flex;gap:10px;align-items:center}
    .content{padding:32px}
    /* Buttons */
    .btn-sm{padding:8px 16px;border-radius:8px;font-family:var(--fd);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:.3s;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:transparent;color:var(--muted)}
    .btn-sm:hover{border-color:var(--cyan);color:var(--cyan);background:var(--cd)}
    .btn-green{border-color:rgba(29,185,84,.3);color:#1db954}
    .btn-green:hover{border-color:#1db954;background:rgba(29,185,84,.07)}
    /* Stats */
    .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:28px}
    .stat-box{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;backdrop-filter:blur(20px);transition:.3s}
    .stat-box::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--ac,var(--cyan)),transparent);opacity:.6}
    .stat-box:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,.3)}
    .stat-num{font-family:var(--fd);font-size:2.2rem;font-weight:900;line-height:1;margin-bottom:6px}
    .stat-lbl{font-family:var(--fd);font-size:.60rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
    /* Alert */
    .alert{padding:12px 18px;border-radius:8px;margin-bottom:20px;font-family:var(--fd);font-size:.68rem;letter-spacing:.06em}
    .alert-ok{background:rgba(29,185,84,.1);border:1px solid rgba(29,185,84,.3);color:#1db954}
    /* Filter */
    .filter-bar{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
    .search-input{flex:1;min-width:200px;padding:10px 14px;background:rgba(0,245,255,.03);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--fb);font-size:.9rem;outline:none;transition:.3s}
    .search-input:focus{border-color:var(--cyan)}
    .filter-select{padding:10px 12px;background:rgba(0,245,255,.03);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--fd);font-size:.65rem;outline:none;cursor:pointer}
    .filter-select option{background:#0a1428}
    /* Table */
    .table-card{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;backdrop-filter:blur(20px)}
    .tc-head{padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .tc-title{font-family:var(--fd);font-size:.70rem;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:var(--cyan)}
    table{width:100%;border-collapse:collapse}
    th{padding:11px 16px;font-family:var(--fd);font-size:.57rem;text-transform:uppercase;letter-spacing:.10em;color:var(--muted);text-align:left;background:rgba(0,245,255,.02);border-bottom:1px solid var(--border);white-space:nowrap}
    td{padding:13px 16px;border-bottom:1px solid rgba(0,245,255,.05);font-size:.84rem;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:rgba(0,245,255,.015)}
    .td-m{color:var(--muted);font-size:.78rem}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-family:var(--fd);font-size:.57rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
    .act-btn{padding:4px 8px;border-radius:6px;font-family:var(--fd);font-size:.56rem;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;border:1px solid;transition:.2s;text-decoration:none;display:inline-block;margin-right:4px}
    .act-del{border-color:rgba(239,68,68,.3);color:#f87171}
    .act-del:hover{background:rgba(239,68,68,.1)}
    .status-sel{padding:4px 8px;background:rgba(0,0,0,.4);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--fd);font-size:.57rem;cursor:pointer;outline:none}
    .empty-state{padding:48px;text-align:center;color:var(--muted);font-family:var(--fd);font-size:.70rem;letter-spacing:.08em}
    @media(max-width:900px){.stats-row{grid-template-columns:1fr 1fr}}
  </style>
</head>
<body>

<aside class="sidebar">
  <div class="sb-logo">
    <span class="sb-logo-icon">⬡</span>
    <span class="sb-logo-text">3D<span>INVENZA</span></span>
  </div>
  <div class="sb-label">Main</div>
  <nav class="sb-nav">
    <a href="index.php" class="sb-link">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      Dashboard
    </a>
    <a href="users.php" class="sb-link">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      Users
    </a>
    <a href="orders.php" class="sb-link active">
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
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
      View Website
    </a>
  </nav>
  <div class="sb-footer">
    <div class="sb-user">
      <div class="sb-avatar"><?= strtoupper(substr($_SESSION['user_name'],0,1)) ?></div>
      <div>
        <div class="sb-uname"><?= htmlspecialchars($_SESSION['user_name']) ?></div>
        <div class="sb-urole">Administrator</div>
      </div>
    </div>
    <a href="../auth/logout.php" class="sb-logout">Sign Out →</a>
  </div>
</aside>

<main class="main">
  <div class="topbar">
    <div>
      <div class="tb-title">Print Orders</div>
      <div class="tb-sub">Admin · Orders · <?= $total ?> total</div>
    </div>
    <div class="tb-actions">
      <a href="orders.php?export=csv" class="btn-sm btn-green">↓ Export CSV</a>
      <a href="index.php" class="btn-sm">← Dashboard</a>
    </div>
  </div>

  <div class="content">
    <?php if (isset($_GET['msg'])): ?>
      <div class="alert alert-ok">✓ Order <?= $_GET['msg'] === 'deleted' ? 'deleted' : 'updated'?> successfully.</div>
    <?php endif; ?>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-box" style="--ac:var(--cyan)">
        <div class="stat-num" style="color:var(--cyan)"><?= $total ?></div>
        <div class="stat-lbl">Total Orders</div>
      </div>
      <div class="stat-box" style="--ac:var(--orange)">
        <div class="stat-num" style="color:var(--orange)"><?= $pending ?></div>
        <div class="stat-lbl">Pending</div>
      </div>
      <div class="stat-box" style="--ac:#1db954">
        <div class="stat-num" style="color:#1db954">₹<?= number_format($revenue, 0) ?></div>
        <div class="stat-lbl">Revenue (Paid)</div>
      </div>
      <div class="stat-box" style="--ac:var(--violet)">
        <div class="stat-num" style="color:var(--violet)"><?= $total - $pending ?></div>
        <div class="stat-lbl">In Progress / Done</div>
      </div>
    </div>

    <!-- Filter -->
    <form method="GET" class="filter-bar">
      <input class="search-input" type="text" name="q" value="<?= htmlspecialchars($q) ?>" placeholder="Search order ref, model, user…"/>
      <select class="filter-select" name="status_f" onchange="this.form.submit()">
        <option value="">All Statuses</option>
        <?php foreach(['pending','processing','printing','printed','shipped','delivered','cancelled'] as $s): ?>
          <option value="<?= $s ?>" <?= $sf===$s?'selected':'' ?>><?= ucfirst($s) ?></option>
        <?php endforeach; ?>
      </select>
      <select class="filter-select" name="pay_f" onchange="this.form.submit()">
        <option value="">All Payments</option>
        <option value="pending"  <?= $pf==='pending'?'selected':'' ?>>Pending</option>
        <option value="paid"     <?= $pf==='paid'?'selected':'' ?>>Paid</option>
        <option value="failed"   <?= $pf==='failed'?'selected':'' ?>>Failed</option>
      </select>
      <button class="btn-sm" type="submit">Search</button>
      <?php if ($q||$sf||$pf): ?><a href="orders.php" class="btn-sm" style="border-color:rgba(239,68,68,.3);color:#f87171">Clear</a><?php endif; ?>
    </form>

    <!-- Table -->
    <div class="table-card">
      <div class="tc-head">
        <div class="tc-title">All Orders</div>
        <span style="font-family:var(--fd);font-size:.60rem;color:var(--muted)"><?= $orders ? $orders->num_rows : 0 ?> shown</span>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Order Ref</th><th>Customer</th><th>Model</th>
              <th>Material</th><th>Weight</th><th>Total (₹)</th>
              <th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <?php if ($orders && $orders->num_rows > 0):
              while ($o = $orders->fetch_assoc()):
                $sc = $sColors[$o['status']] ?? '#999';
                $pc = $pColors[$o['payment_status']] ?? '#999';
            ?>
            <tr>
              <td class="td-m"><?= $o['id'] ?></td>
              <td style="font-family:var(--fd);font-size:.70rem;color:var(--cyan)"><?= htmlspecialchars($o['order_ref']) ?></td>
              <td>
                <div style="font-weight:500"><?= htmlspecialchars($o['uname'] ?? 'Guest') ?></div>
                <div class="td-m"><?= htmlspecialchars($o['uemail'] ?? '—') ?></div>
              </td>
              <td>
                <div style="font-size:.84rem"><?= htmlspecialchars($o['model_name'] ?? '—') ?></div>
                <div class="td-m"><?= htmlspecialchars($o['color']) ?></div>
              </td>
              <td class="td-m"><?= htmlspecialchars($o['material']) ?> · <?= $o['infill'] ?>% · <?= $o['layer_height'] ?>mm</td>
              <td class="td-m"><?= $o['weight_g'] ?>g</td>
              <td style="font-family:var(--fd);font-size:.78rem;color:#1db954">₹<?= number_format($o['total_inr'],2) ?></td>
              <td><span class="badge" style="background:<?= $pc ?>22;color:<?= $pc ?>;border:1px solid <?= $pc ?>44"><?= strtoupper($o['payment_status']) ?></span></td>
              <td>
                <span class="badge" style="background:<?= $sc ?>22;color:<?= $sc ?>;border:1px solid <?= $sc ?>44">
                  <?= strtoupper($o['status']) ?>
                </span>
              </td>
              <td class="td-m"><?= date('d M Y', strtotime($o['created_at'])) ?></td>
              <td>
                <select class="status-sel" onchange="location.href='orders.php?status='+this.value+'&id=<?= $o['id'] ?>'">
                  <option value="">Update…</option>
                  <?php foreach(['pending','processing','printing','printed','shipped','delivered','cancelled'] as $s): ?>
                    <option value="<?= $s ?>"><?= ucfirst($s) ?></option>
                  <?php endforeach; ?>
                </select>
                <a href="orders.php?delete=<?= $o['id'] ?>" class="act-btn act-del" onclick="return confirm('Delete order <?= addslashes($o['order_ref']) ?>?')">✕</a>
              </td>
            </tr>
            <?php endwhile; else: ?>
            <tr><td colspan="11"><div class="empty-state">No orders found. Orders placed via the upload/checkout flow will appear here.</div></td></tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</main>
</body>
</html>
