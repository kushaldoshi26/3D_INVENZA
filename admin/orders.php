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
  <link rel="stylesheet" href="../css/premium-php.css" />
  <style>
    .main { flex: 1; margin-left: 260px; min-height: 100vh; position: relative; z-index: 1; }
    .topbar { padding: 20px 32px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: rgba(2,8,18,0.8); backdrop-filter: blur(20px); position: sticky; top:0; z-index: 5; }
    .sidebar { width: 260px; background: var(--sidebar); border-right: 1px solid var(--border); position: fixed; top: 0; left: 0; bottom: 0; z-index: 10; backdrop-filter: blur(20px); display: flex; flex-direction: column; }
    
    .content { padding: 32px; position: relative; z-index: 1; }
    .tb-sub { font-family: var(--font-display); font-size: 0.60rem; color: rgba(224, 242, 254, 0.5); letter-spacing: 0.10em; text-transform: uppercase; margin-top: 4px; }
    .tb-title { font-family: var(--font-display); font-size: 0.85rem; font-weight: 700; color: var(--cyan); letter-spacing: 0.06em; }
    
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 28px; }
    .stat-box { padding: 22px; position: relative; overflow: hidden; }
    .stat-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--ac, var(--cyan)), transparent); opacity: 0.6; }
    .stat-num { font-family: var(--font-display); font-size: 2.2rem; font-weight: 900; line-height: 1; margin-bottom: 6px; }
    .stat-lbl { font-family: var(--font-display); font-size: 0.60rem; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(224, 242, 254, 0.5); }
    
    .alert { padding: 12px 18px; border-radius: 8px; margin-bottom: 20px; font-family: var(--font-display); font-size: 0.68rem; letter-spacing: 0.06em; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: var(--green); }
    
    .filter-bar { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 240px; }
    .filter-select { background: rgba(0,245,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--cyan); font-family: var(--font-display); font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; outline: none; cursor: pointer; }
    .filter-select option { background: #0a1428; color: white; }

    .table-card { overflow: hidden; }
    .tc-head { padding: 16px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
    .tc-title { font-family: var(--font-display); font-size: 0.70rem; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase; color: var(--cyan); }
    .td-m { color: rgba(224, 242, 254, 0.5); font-size:0.8rem; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-family: var(--font-display); font-size: 0.57rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
    
    .status-sel { padding: 4px 8px; background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-family: var(--font-display); font-size: 0.57rem; cursor: pointer; outline: none; }
    .act-btn { padding: 4px 8px; border-radius: 6px; font-family: var(--font-display); font-size: 0.56rem; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; border: 1px solid; transition: .2s; }
    .act-del { border-color: rgba(239, 68, 68, 0.3); color: #f87171; }
    
    @media(max-width:900px) { .stats-row { grid-template-columns: 1fr 1fr; } }
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
      <a href="orders.php?export=csv" class="premium-btn" style="border-color:rgba(52,211,153,0.3);color:var(--green)">↓ Export CSV</a>
      <a href="index.php" class="premium-btn">← Dashboard</a>
    </div>
  </div>

  <div class="content">
    <?php if (isset($_GET['msg'])): ?>
      <div class="alert alert-ok">✓ Order <?= $_GET['msg'] === 'deleted' ? 'deleted' : 'updated'?> successfully.</div>
    <?php endif; ?>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-box premium-card" style="--ac:var(--cyan)">
        <div class="stat-num" style="color:var(--cyan)"><?= $total ?></div>
        <div class="stat-lbl">Total Orders</div>
      </div>
      <div class="stat-box premium-card" style="--ac:var(--orange)">
        <div class="stat-num" style="color:var(--orange)"><?= $pending ?></div>
        <div class="stat-lbl">Pending</div>
      </div>
      <div class="stat-box premium-card" style="--ac:var(--green)">
        <div class="stat-num" style="color:var(--green)">₹<?= number_format($revenue, 0) ?></div>
        <div class="stat-lbl">Revenue (Paid)</div>
      </div>
      <div class="stat-box premium-card" style="--ac:var(--violet)">
        <div class="stat-num" style="color:var(--violet)"><?= $total - $pending ?></div>
        <div class="stat-lbl">In Progress / Done</div>
      </div>
    </div>

    <!-- Filter -->
    <form method="GET" class="filter-bar">
      <input class="search-input premium-input" type="text" name="q" value="<?= htmlspecialchars($q) ?>" placeholder="Search order ref, model, user…"/>
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
      <button class="premium-btn" type="submit">Search</button>
      <?php if ($q||$sf||$pf): ?><a href="orders.php" class="premium-btn" style="border-color:rgba(239,68,68,.3);color:#f87171">Clear</a><?php endif; ?>
    </form>

    <!-- Table -->
    <div class="table-card premium-card">
      <div class="tc-head">
        <div class="tc-title">All Orders</div>
        <span style="font-family:var(--font-display);font-size:.60rem;color:rgba(224, 242, 254, 0.5)"><?= $orders ? $orders->num_rows : 0 ?> shown</span>
      </div>
      <div class="overflow-x">
        <table class="premium-table">
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
