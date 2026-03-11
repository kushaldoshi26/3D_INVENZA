<?php
// ─── 3D Invenza — Keychain Admin Dashboard ──────────────────
define('ADMIN_PASS', 'invenza2025');

session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_pass'])) {
    if ($_POST['admin_pass'] === ADMIN_PASS) {
        $_SESSION['admin'] = true;
    } else {
        $login_error = 'Incorrect password.';
    }
}
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

$logged_in = !empty($_SESSION['admin']);

// ── CSV Export ───────────────────────────────────────────────
if ($logged_in && isset($_GET['export']) && $_GET['export'] === 'csv') {
    include 'config/db.php';
    $all = $conn->query("SELECT * FROM students ORDER BY created_at DESC");
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=keychain_orders_' . date('Ymd_His') . '.csv');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['ID','Name','Enrollment','Gender','Phone','Email','City','Department','Year','Batch','Instagram','Title','Song Link','Status','Registered']);
    while ($r = $all->fetch_assoc()) {
        fputcsv($out, [$r['id'],$r['name'],$r['enrollment'],$r['gender'],$r['phone'],
            $r['email'],$r['city'],$r['department'],$r['year'],$r['batch'],
            $r['instagram'],$r['title'],$r['song_link'],$r['status'],$r['created_at']]);
    }
    fclose($out); $conn->close(); exit;
}

// ── Manual Add Student ───────────────────────────────────────
if ($logged_in && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_student'])) {
    include 'config/db.php';
    function esc($v) { return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8'); }
    $name = esc($_POST['name'] ?? ''); $enrollment = esc($_POST['enrollment'] ?? '');
    $phone = esc($_POST['phone'] ?? ''); $dept = esc($_POST['department'] ?? '');
    $year = esc($_POST['year'] ?? ''); $title = esc($_POST['title'] ?? '');
    $song = esc($_POST['song_link'] ?? ''); $status_new = in_array($_POST['status_new']??'',['pending','processing','printed','delivered']) ? $_POST['status_new'] : 'pending';
    if ($name && $enrollment && $phone) {
        $stmt = $conn->prepare("INSERT IGNORE INTO students (name,enrollment,phone,department,year,title,song_link,status) VALUES (?,?,?,?,?,?,?,?)");
        $stmt->bind_param("ssssssss", $name, $enrollment, $phone, $dept, $year, $title, $song, $status_new);
        $stmt->execute(); $stmt->close();
    }
    $conn->close();
    header('Location: admin.php?added=1'); exit;
}

// ── Bulk Status Update ───────────────────────────────────────
if ($logged_in && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['bulk_status'], $_POST['ids'])) {
    include 'config/db.php';
    $bs = in_array($_POST['bulk_status'], ['pending','processing','printed','delivered']) ? $_POST['bulk_status'] : 'pending';
    foreach ((array)$_POST['ids'] as $bid) {
        $conn->query("UPDATE students SET status='$bs' WHERE id=" . (int)$bid);
    }
    $conn->close();
    header('Location: admin.php?updated=1'); exit;
}

// ── Status update ────────────────────────────────────────────
if ($logged_in && isset($_GET['status'], $_GET['id'])) {
    include 'config/db.php';
    $id     = (int)$_GET['id'];
    $status = in_array($_GET['status'], ['pending','processing','printed','delivered'])
              ? $_GET['status'] : 'pending';
    $conn->query("UPDATE students SET status='$status' WHERE id=$id");
    header('Location: admin.php?updated=1');
    exit;
}

// ── Delete record ────────────────────────────────────────────
if ($logged_in && isset($_GET['delete'])) {
    include 'config/db.php';
    $id = (int)$_GET['delete'];
    $conn->query("DELETE FROM students WHERE id=$id");
    header('Location: admin.php?deleted=1');
    exit;
}

// ── Fetch students ───────────────────────────────────────────
if ($logged_in) {
    include 'config/db.php';
    $search = $_GET['q'] ?? '';
    $filter = $_GET['status_filter'] ?? '';
    $sql    = "SELECT * FROM students WHERE 1=1";
    if ($search) {
        $s = $conn->real_escape_string($search);
        $sql .= " AND (name LIKE '%$s%' OR enrollment LIKE '%$s%' OR department LIKE '%$s%')";
    }
    if ($filter) {
        $f = $conn->real_escape_string($filter);
        $sql .= " AND status='$f'";
    }
    $sql .= " ORDER BY created_at DESC";
    $result = $conn->query($sql);
    $total  = $conn->query("SELECT COUNT(*) AS c FROM students")->fetch_assoc()['c'];
    $pending_count = $conn->query("SELECT COUNT(*) AS c FROM students WHERE status='pending'")->fetch_assoc()['c'];
    $printed_count = $conn->query("SELECT COUNT(*) AS c FROM students WHERE status='printed'")->fetch_assoc()['c'];
}

// Status badge colors
$status_colors = [
    'pending'    => '#f97316',
    'processing' => '#00f5ff',
    'printed'    => '#7c3aed',
    'delivered'  => '#1db954',
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin — Keychain Orders | 3D Invenza</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/premium-php.css" />
  <style>
    /* ── Login ── */
    .login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; position: relative; z-index: 1; }
    .login-card { padding: 48px 40px; width: 100%; max-width: 420px; text-align: center; }
    .login-logo { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--cyan); margin-bottom: 8px; }
    .login-sub { font-size: 0.8rem; color: rgba(224, 242, 254, 0.5); margin-bottom: 32px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.1em; }
    .login-btn { width: 100%; }

    /* ── Dashboard ── */
    .admin-wrap { max-width: 1400px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }
    .admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
    .admin-title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--cyan); letter-spacing: 0.05em; }
    .admin-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    @media(max-width:640px) { .stats-row { grid-template-columns: 1fr 1fr; } }
    .stat-box { padding: 20px; text-align: center; position: relative; }
    .stat-box-num { font-family: var(--font-display); font-size: 2rem; font-weight: 900; line-height: 1; }
    .stat-box-label { font-size: 0.7rem; color: rgba(224, 242, 254, 0.5); margin-top: 6px; letter-spacing: 0.05em; text-transform: uppercase; }
    
    .filter-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
    .search-input { flex: 1; min-width: 220px; }
    .filter-select { background: rgba(0,245,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--cyan); font-family: var(--font-display); font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; outline: none; cursor: pointer; }
    .filter-select option { background: #0a1428; color: white; }

    .tc-head { padding: 16px 24px; border-bottom: 1px solid var(--border); font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--cyan); }
    .td-name { font-weight: 600; color: var(--text); }
    .td-enroll { font-family: var(--font-display); font-size: 0.7rem; color: var(--cyan); letter-spacing: 0.06em; }
    .td-muted { color: rgba(224, 242, 254, 0.55); font-size: 0.82rem; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-family: var(--font-display); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
    
    .status-select { padding: 5px 10px; background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-family: var(--font-display); font-size: 0.6rem; cursor: pointer; outline: none; }
    .alert { padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; font-family: var(--font-display); font-size: 0.72rem; letter-spacing: 0.06em; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: var(--green); }
    
    @media(max-width:900px) { .admin-header { flex-direction: column; align-items: flex-start; } }
  </style>
</head>
<body>

<?php if (!$logged_in): ?>
<!-- ── LOGIN SCREEN ───────────────────────────────── -->
  <div class="login-card premium-card">
    <div class="login-logo">3DINVENZA</div>
    <div class="login-sub">Admin Panel</div>
    <?php if (!empty($login_error)): ?>
      <p class="login-err">⚠ <?= htmlspecialchars($login_error) ?></p>
    <?php endif; ?>
    <form method="POST">
      <input class="premium-input" type="password" name="admin_pass" placeholder="Enter admin password" autofocus style="margin-bottom:16px" required />
      <button class="premium-btn premium-btn-primary login-btn" type="submit">ACCESS DASHBOARD →</button>
    </form>
  </div>
</div>

<?php else: ?>
<!-- ── ADMIN DASHBOARD ────────────────────────────── -->
<div class="admin-wrap">

  <!-- Header -->
  <div class="admin-header">
    <div>
      <div class="admin-title">⬡ Student Orders</div>
      <div style="color:rgba(224, 242, 254, 0.4);font-size:0.7rem;margin-top:4px;font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.1em">Keychain Management Dashboard</div>
    </div>
    <div class="admin-actions">
      <a href="admin.php?export=csv" class="premium-btn" style="border-color:rgba(52,211,153,0.3);color:var(--green)">↓ Export</a>
      <a href="status.php" class="premium-btn" target="_blank">🔍 Lookup</a>
      <a href="../admin/index.php" class="premium-btn">Main Admin</a>
      <a href="../index.html" class="premium-btn">← Website</a>
      <a href="admin.php?logout=1" class="premium-btn" style="border-color:rgba(239,68,68,0.3);color:#f87171">Logout</a>
    </div>
  </div>

  <?php if (isset($_GET['updated'])): ?><div class="alert">✓ Status updated.</div><?php endif; ?>
  <?php if (isset($_GET['deleted'])): ?><div class="alert">✓ Record deleted.</div><?php endif; ?>
  <?php if (isset($_GET['added'])): ?><div class="alert">✓ Student added successfully.</div><?php endif; ?>

  <!-- ── Manual Add Form ─────────────────────────────────────── -->
  <div class="premium-card" style="padding:24px;margin-bottom:24px">
    <div style="font-family:var(--font-display);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--cyan);margin-bottom:16px">➕ Add Student Manually</div>
    <form method="POST" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;align-items:end">
      <input name="name" placeholder="Full Name *" required class="premium-input" style="min-width:unset"/>
      <input name="enrollment" placeholder="Enrollment # *" required class="premium-input" style="min-width:unset"/>
      <input name="phone" placeholder="Phone *" required class="premium-input" style="min-width:unset"/>
      <input name="department" placeholder="Department" class="premium-input" style="min-width:unset"/>
      <input name="year" placeholder="Year" class="premium-input" style="min-width:unset"/>
      <input name="title" placeholder="Keychain Title" class="premium-input" style="min-width:unset"/>
      <input name="song_link" placeholder="Spotify Link" class="premium-input" style="min-width:unset"/>
      <select name="status_new" class="filter-select">
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="printed">Printed</option>
        <option value="delivered">Delivered</option>
      </select>
      <button type="submit" name="add_student" class="premium-btn" style="padding:10px 18px;border-color:var(--cyan-accent);color:var(--cyan);background:var(--cyan-dim)">Add Student →</button>
    </form>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-box premium-card">
      <div class="stat-box-num" style="color:var(--cyan)"><?= $total ?></div>
      <div class="stat-box-label">Registrations</div>
    </div>
    <div class="stat-box premium-card">
      <div class="stat-box-num" style="color:var(--orange)"><?= $pending_count ?></div>
      <div class="stat-box-label">Pending</div>
    </div>
    <div class="stat-box premium-card">
      <div class="stat-box-num" style="color:var(--violet)"><?= $printed_count ?></div>
      <div class="stat-box-label">Printed</div>
    </div>
    <div class="stat-box premium-card">
      <div class="stat-box-num" style="color:var(--green)"><?= $total - $pending_count ?></div>
      <div class="stat-box-label">Completed</div>
    </div>
  </div>

  <!-- Search / Filter -->
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
    <form method="POST" id="bulkForm" style="display:flex;gap:8px;align-items:center">
      <select name="bulk_status" class="filter-select">
        <option value="">Bulk: Update Selected…</option>
        <option value="pending">→ Pending</option>
        <option value="processing">→ Processing</option>
        <option value="printed">→ Printed</option>
        <option value="delivered">→ Delivered</option>
      </select>
      <button type="submit" class="premium-btn" onclick="return collectBulk()">Apply</button>
    </form>
  </div>
  <form method="GET" id="filterForm" class="filter-bar">
    <input class="search-input premium-input" type="text" name="q" value="<?= htmlspecialchars($search) ?>" placeholder="Search name, enrollment, dept…" />
    <select class="filter-select" name="status_filter" onchange="this.form.submit()">
      <option value="">All Statuses</option>
      <option value="pending"    <?= $filter==='pending'    ?'selected':'' ?>>Pending</option>
      <option value="processing" <?= $filter==='processing' ?'selected':'' ?>>Processing</option>
      <option value="printed"    <?= $filter==='printed'    ?'selected':'' ?>>Printed</option>
      <option value="delivered"  <?= $filter==='delivered'  ?'selected':'' ?>>Delivered</option>
    </select>
    <button class="premium-btn" type="submit">Search</button>
    <?php if ($search || $filter): ?>
      <a href="admin.php" class="premium-btn" style="border-color:rgba(239,68,68,0.3);color:#f87171">Clear</a>
    <?php endif; ?>
  </form>

  <!-- Table -->
  <div class="table-wrap premium-card">
    <div class="tc-head">📋 Registered Students (<?= $result ? $result->num_rows : 0 ?> shown)</div>
    <div class="overflow-x">
    <table class="premium-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Enrollment</th>
          <th>Dept / Year</th>
          <th>Phone</th>
          <th>Keychain Title</th>
          <th>Spotify Link</th>
          <th>Status</th>
          <th>STL File</th>
          <th>Registered</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if ($result && $result->num_rows > 0): ?>
          <?php while ($row = $result->fetch_assoc()): ?>
            <?php $sc = $status_colors[$row['status']] ?? '#999'; ?>
            <tr>
              <td class="td-muted"><?= $row['id'] ?></td>
              <td>
                <div class="td-name"><?= htmlspecialchars($row['name']) ?></div>
                <?php if ($row['instagram']): ?>
                  <div class="td-muted" style="font-size:0.75rem"><?= htmlspecialchars($row['instagram']) ?></div>
                <?php endif; ?>
              </td>
              <td><span class="td-enroll"><?= htmlspecialchars($row['enrollment']) ?></span></td>
              <td>
                <div class="td-muted"><?= htmlspecialchars($row['department']) ?></div>
                <div class="td-muted" style="font-size:0.75rem"><?= htmlspecialchars($row['year']) ?></div>
              </td>
              <td class="td-muted"><?= htmlspecialchars($row['phone']) ?></td>
              <td style="font-family:var(--font-d);font-size:0.72rem;color:#f97316"><?= htmlspecialchars($row['title']) ?></td>
              <td>
                <?php if ($row['song_link']): ?>
                  <a href="<?= htmlspecialchars($row['song_link']) ?>" target="_blank" class="song-link">
                    🎵 <?= htmlspecialchars(substr($row['song_link'], 0, 30)) ?>…
                  </a>
                <?php else: ?>
                  <span class="td-muted">—</span>
                <?php endif; ?>
              </td>
              <td>
                <span class="badge" style="background:<?= $sc ?>22;color:<?= $sc ?>;border:1px solid <?= $sc ?>44">
                  <?= strtoupper($row['status']) ?>
                </span>
              </td>
              <td>
                <?php if ($row['stl_path']): ?>
                  <a href="<?= htmlspecialchars($row['stl_path']) ?>" class="premium-btn" style="font-size:0.55rem;padding:4px 8px" download>↓ STL</a>
                <?php else: ?>
                  <span class="td-muted" style="font-size:0.75rem">Not generated</span>
                <?php endif; ?>
              </td>
              <td class="td-muted" style="font-size:0.75rem"><?= date('d M Y', strtotime($row['created_at'])) ?></td>
              <td>
                <div class="action-btns" style="display:flex;gap:6px">
                  <select class="status-select" onchange="location.href='admin.php?status='+this.value+'&id=<?= $row['id'] ?>'">
                    <option value="">Update…</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="printed">Printed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <a href="admin.php?delete=<?= $row['id'] ?>" class="premium-btn" style="border-color:rgba(239,68,68,0.3);color:#f87171;padding:4px 8px" onclick="return confirm('Delete this record?')">✕</a>
                </div>
              </td>
            </tr>
          <?php endwhile; ?>
        <?php else: ?>
          <tr>
            <td colspan="11">
              <div class="empty-state">
                <p>No registrations found.</p>
              </div>
            </td>
          </tr>
        <?php endif; ?>
      </tbody>
    </table>
    </div>
  </div>

  <p style="text-align:center;color:var(--muted);font-size:0.75rem;margin-top:24px">
    3D Invenza Admin Panel · <?= date('Y') ?>
  </p>

</div>
<?php endif; ?>
<script>
function collectBulk() {
  var form = document.getElementById('bulkForm');
  var checks = document.querySelectorAll('.row-check:checked');
  if (!checks.length) { alert('Select at least one row first.'); return false; }
  if (!form.querySelector('select[name="bulk_status"]').value) { alert('Choose a status to apply.'); return false; }
  // Remove any old hidden inputs
  document.querySelectorAll('.bulk-id-input').forEach(function(el){ el.remove(); });
  checks.forEach(function(cb) {
    var inp = document.createElement('input');
    inp.type = 'hidden'; inp.name = 'ids[]'; inp.value = cb.value;
    inp.className = 'bulk-id-input';
    form.appendChild(inp);
  });
  return true;
}
// Checkbox toggle all
var togAll = document.getElementById('toggleAll');
if (togAll) {
  togAll.addEventListener('change', function() {
    document.querySelectorAll('.row-check').forEach(function(cb){ cb.checked = togAll.checked; });
  });
}
</script>
</body>
</html>
