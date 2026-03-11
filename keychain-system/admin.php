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
  <style>
    :root {
      --bg:#020812; --card:rgba(10,20,40,0.9); --cyan:#00f5ff;
      --cyan-d:rgba(0,245,255,0.08); --violet:#7c3aed;
      --orange:#f97316; --border:rgba(0,245,255,0.12);
      --text:#e0f2fe; --muted:rgba(224,242,254,0.55);
      --font-d:'Orbitron',monospace; --font-b:'Inter',sans-serif;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:15px;line-height:1.6;min-height:100vh}
    body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,245,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.025) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;z-index:0}
    /* LOGIN */
    .login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;position:relative;z-index:1}
    .login-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:48px 40px;width:100%;max-width:420px;text-align:center;backdrop-filter:blur(20px)}
    .login-logo{font-family:var(--font-d);font-size:1.2rem;font-weight:700;color:var(--cyan);margin-bottom:8px}
    .login-sub{font-size:0.8rem;color:var(--muted);margin-bottom:32px;font-family:var(--font-d);text-transform:uppercase;letter-spacing:0.1em}
    .login-input{width:100%;padding:14px 16px;background:rgba(0,245,255,0.03);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-b);font-size:1rem;outline:none;margin-bottom:16px;transition:0.3s}
    .login-input:focus{border-color:var(--cyan);background:rgba(0,245,255,0.07)}
    .login-btn{width:100%;padding:14px;background:linear-gradient(135deg,var(--orange),#ea580c);color:#fff;font-family:var(--font-d);font-size:0.8rem;font-weight:700;letter-spacing:0.1em;border:none;border-radius:8px;cursor:pointer;transition:0.3s}
    .login-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(249,115,22,0.3)}
    .login-err{color:#f87171;font-size:0.85rem;margin-bottom:12px}
    /* ADMIN */
    .admin-wrap{max-width:1400px;margin:0 auto;padding:32px 24px;position:relative;z-index:1}
    .admin-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px}
    .admin-title{font-family:var(--font-d);font-size:1.1rem;font-weight:700;color:var(--cyan);letter-spacing:0.05em}
    .admin-actions{display:flex;gap:12px;flex-wrap:wrap}
    .btn-sm{padding:8px 16px;border-radius:8px;font-family:var(--font-d);font-size:0.65rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:0.2s;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
    .btn-outline{background:transparent;border:1px solid var(--border);color:var(--muted)}
    .btn-outline:hover{border-color:var(--cyan);color:var(--cyan)}
    .btn-danger{background:transparent;border:1px solid rgba(239,68,68,0.3);color:#f87171}
    .btn-danger:hover{background:rgba(239,68,68,0.1)}
    /* STATS ROW */
    .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
    @media(max-width:640px){.stats-row{grid-template-columns:1fr 1fr}}
    .stat-box{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center;backdrop-filter:blur(20px)}
    .stat-box-num{font-family:var(--font-d);font-size:2rem;font-weight:900;line-height:1}
    .stat-box-label{font-size:0.7rem;color:var(--muted);margin-top:6px;letter-spacing:0.05em}
    /* FILTER BAR */
    .filter-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
    .search-input{flex:1;min-width:220px;padding:10px 16px;background:rgba(0,245,255,0.03);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-b);font-size:0.9rem;outline:none}
    .search-input:focus{border-color:var(--cyan)}
    .filter-select{padding:10px 14px;background:rgba(0,245,255,0.03);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-d);font-size:0.7rem;outline:none;cursor:pointer}
    .filter-select option{background:#0a1428}
    /* TABLE */
    .table-wrap{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;backdrop-filter:blur(20px)}
    .table-header{padding:16px 24px;border-bottom:1px solid var(--border);font-family:var(--font-d);font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--cyan)}
    table{width:100%;border-collapse:collapse}
    th{padding:12px 16px;font-family:var(--font-d);font-size:0.6rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);text-align:left;border-bottom:1px solid var(--border);white-space:nowrap;background:rgba(0,245,255,0.02)}
    td{padding:14px 16px;border-bottom:1px solid rgba(0,245,255,0.06);font-size:0.85rem;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:rgba(0,245,255,0.02)}
    .td-name{font-weight:600;color:var(--text)}
    .td-enroll{font-family:var(--font-d);font-size:0.7rem;color:var(--cyan);letter-spacing:0.06em}
    .td-muted{color:var(--muted);font-size:0.82rem}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-family:var(--font-d);font-size:0.6rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase}
    .song-link{color:var(--cyan);font-size:0.75rem;text-decoration:none;max-width:140px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle}
    .song-link:hover{text-decoration:underline}
    .action-btns{display:flex;gap:6px;flex-wrap:nowrap}
    .status-select{padding:5px 10px;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font-d);font-size:0.6rem;cursor:pointer;outline:none}
    .empty-state{padding:60px;text-align:center;color:var(--muted)}
    .empty-state p{font-family:var(--font-d);letter-spacing:0.08em;font-size:0.8rem}
    /* Alert */
    .alert{padding:12px 20px;border-radius:8px;margin-bottom:20px;font-family:var(--font-d);font-size:0.72rem;letter-spacing:0.06em}
    .alert-success{background:rgba(29,185,84,0.1);border:1px solid rgba(29,185,84,0.3);color:#1db954}
    .overflow-x{overflow-x:auto}
    @media(max-width:900px){.admin-header{flex-direction:column;align-items:flex-start}}
  </style>
</head>
<body>

<?php if (!$logged_in): ?>
<!-- ── LOGIN SCREEN ───────────────────────────────── -->
<div class="login-wrap">
  <div class="login-card">
    <div class="login-logo">3DINVENZA</div>
    <div class="login-sub">Admin Panel</div>
    <?php if (!empty($login_error)): ?>
      <p class="login-err">⚠ <?= htmlspecialchars($login_error) ?></p>
    <?php endif; ?>
    <form method="POST">
      <input class="login-input" type="password" name="admin_pass" placeholder="Enter admin password" autofocus required />
      <button class="login-btn" type="submit">ACCESS DASHBOARD →</button>
    </form>
  </div>
</div>

<?php else: ?>
<!-- ── ADMIN DASHBOARD ────────────────────────────── -->
<div class="admin-wrap">

  <!-- Header -->
  <div class="admin-header">
    <div>
      <div class="admin-title">⬡ 3D Invenza — Student Orders</div>
      <div style="color:var(--muted);font-size:0.8rem;margin-top:4px">Keychain Management Dashboard</div>
    </div>
    <div class="admin-actions">
      <a href="admin.php?export=csv" class="btn-sm btn-outline" style="border-color:rgba(29,185,84,.3);color:#1db954">↓ Export CSV</a>
      <a href="status.php" class="btn-sm btn-outline" target="_blank">🔍 Status Lookup</a>
      <a href="../admin/index.php" class="btn-sm btn-outline">Main Admin</a>
      <a href="../index.html" class="btn-sm btn-outline">← Website</a>
      <a href="admin.php?logout=1" class="btn-sm btn-danger">Logout</a>
    </div>
  </div>

  <?php if (isset($_GET['updated'])): ?><div class="alert alert-success">✓ Status updated.</div><?php endif; ?>
  <?php if (isset($_GET['deleted'])): ?><div class="alert alert-success">✓ Record deleted.</div><?php endif; ?>
  <?php if (isset($_GET['added'])): ?><div class="alert alert-success">✓ Student added successfully.</div><?php endif; ?>

  <!-- ── Manual Add Form ─────────────────────────────────────── -->
  <div style="background:rgba(8,18,38,.88);border:1px solid rgba(0,245,255,.12);border-radius:14px;padding:22px 24px;margin-bottom:24px;backdrop-filter:blur(20px)">
    <div style="font-family:var(--font-d);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--cyan);margin-bottom:14px">➕ Add Student Manually</div>
    <form method="POST" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;align-items:end">
      <input name="name" placeholder="Full Name *" required class="search-input" style="min-width:unset"/>
      <input name="enrollment" placeholder="Enrollment # *" required class="search-input" style="min-width:unset"/>
      <input name="phone" placeholder="Phone *" required class="search-input" style="min-width:unset"/>
      <input name="department" placeholder="Department" class="search-input" style="min-width:unset"/>
      <input name="year" placeholder="Year" class="search-input" style="min-width:unset"/>
      <input name="title" placeholder="Keychain Title" class="search-input" style="min-width:unset"/>
      <input name="song_link" placeholder="Spotify Link" class="search-input" style="min-width:unset"/>
      <select name="status_new" class="filter-select">
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="printed">Printed</option>
        <option value="delivered">Delivered</option>
      </select>
      <button type="submit" name="add_student" class="btn-sm btn-outline" style="padding:10px 18px;border-color:rgba(0,245,255,.3);color:var(--cyan);background:rgba(0,245,255,.05)">Add Student →</button>
    </form>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-box">
      <div class="stat-box-num" style="color:var(--cyan)"><?= $total ?></div>
      <div class="stat-box-label">Total Registrations</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-num" style="color:var(--orange)"><?= $pending_count ?></div>
      <div class="stat-box-label">Pending</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-num" style="color:var(--violet)"><?= $printed_count ?></div>
      <div class="stat-box-label">Printed</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-num" style="color:#1db954"><?= $total - $pending_count ?></div>
      <div class="stat-box-label">In Progress / Done</div>
    </div>
  </div>

  <!-- Search / Filter -->
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
    <form method="POST" id="bulkForm" style="display:flex;gap:8px;align-items:center">
      <select name="bulk_status" class="filter-select">
        <option value="">Bulk: Update Selected…</option>
        <option value="pending">→ Pending</option>
        <option value="processing">→ Processing</option>
        <option value="printed">→ Printed</option>
        <option value="delivered">→ Delivered</option>
      </select>
      <button type="submit" class="btn-sm btn-outline" onclick="return collectBulk()">Apply to Selected</button>
    </form>
  </div>
  <form method="GET" id="filterForm" class="filter-bar">
    <input class="search-input" type="text" name="q" value="<?= htmlspecialchars($search) ?>" placeholder="Search name, enrollment, dept…" />
    <select class="filter-select" name="status_filter" onchange="this.form.submit()">
      <option value="">All Statuses</option>
      <option value="pending"    <?= $filter==='pending'    ?'selected':'' ?>>Pending</option>
      <option value="processing" <?= $filter==='processing' ?'selected':'' ?>>Processing</option>
      <option value="printed"    <?= $filter==='printed'    ?'selected':'' ?>>Printed</option>
      <option value="delivered"  <?= $filter==='delivered'  ?'selected':'' ?>>Delivered</option>
    </select>
    <button class="btn-sm btn-outline" type="submit">Search</button>
    <?php if ($search || $filter): ?>
      <a href="admin.php" class="btn-sm btn-danger">Clear</a>
    <?php endif; ?>
  </form>

  <!-- Table -->
  <div class="table-wrap">
    <div class="table-header">📋 Registered Students (<?= $result ? $result->num_rows : 0 ?> shown)</div>
    <div class="overflow-x">
    <table>
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
                  <a href="<?= htmlspecialchars($row['stl_path']) ?>" class="btn-sm btn-outline" style="font-size:0.55rem" download>↓ STL</a>
                <?php else: ?>
                  <span class="td-muted" style="font-size:0.75rem">Not generated</span>
                <?php endif; ?>
              </td>
              <td class="td-muted" style="font-size:0.75rem"><?= date('d M Y', strtotime($row['created_at'])) ?></td>
              <td>
                <div class="action-btns">
                  <select class="status-select" onchange="location.href='admin.php?status='+this.value+'&id=<?= $row['id'] ?>'">
                    <option value="">Update…</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="printed">Printed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <a href="admin.php?delete=<?= $row['id'] ?>" class="btn-sm btn-danger" onclick="return confirm('Delete this record?')">✕</a>
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
