<?php
// ─── 3D Invenza — Student Order Status Check ─────────────────
include 'config/db.php';

$student = null;
$error   = '';
$lookup  = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' || isset($_GET['enroll'])) {
    $lookup = htmlspecialchars(strip_tags(trim(
        $_POST['enrollment'] ?? $_GET['enroll'] ?? ''
    )), ENT_QUOTES, 'UTF-8');

    if (!empty($lookup)) {
        $stmt = $conn->prepare("SELECT id,name,enrollment,department,year,title,status,created_at FROM students WHERE enrollment = ?");
        $stmt->bind_param("s", $lookup);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows === 1) {
            $student = $res->fetch_assoc();
        } else {
            $error = 'No order found for enrollment number "' . htmlspecialchars($lookup) . '". Please check and try again.';
        }
        $stmt->close();
    } else {
        $error = 'Please enter your enrollment number.';
    }
}
$conn->close();

$statusInfo = [
    'pending'    => ['label'=>'Pending',    'color'=>'#f97316', 'icon'=>'⏳', 'desc'=>'Your order has been received and is waiting to be processed.'],
    'processing' => ['label'=>'Processing', 'color'=>'#00f5ff', 'icon'=>'⚙',  'desc'=>'Your keychain design is currently being prepared.'],
    'printed'    => ['label'=>'Printed',    'color'=>'#7c3aed', 'icon'=>'🖨', 'desc'=>'Your keychain has been successfully 3D printed!'],
    'delivered'  => ['label'=>'Delivered',  'color'=>'#1db954', 'icon'=>'✓',  'desc'=>'Your keychain has been delivered. Enjoy!'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Status — 3D Invenza Keychain</title>
  <meta name="description" content="Check your 3D Invenza keychain order status by entering your enrollment number."/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    :root{
      --bg:#020812;--cyan:#00f5ff;--cd:rgba(0,245,255,0.08);--violet:#7c3aed;
      --orange:#f97316;--border:rgba(0,245,255,0.12);
      --text:#e0f2fe;--muted:rgba(224,242,254,0.55);
      --card:rgba(8,18,38,0.90);
      --fd:'Orbitron',monospace;--fb:'Inter',sans-serif;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%}
    body{background:var(--bg);color:var(--text);font-family:var(--fb);line-height:1.6;
      display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
      min-height:100vh;padding:0 16px 48px}
    body::before{content:'';position:fixed;inset:0;
      background-image:linear-gradient(rgba(0,245,255,.025) 1px,transparent 1px),
        linear-gradient(90deg,rgba(0,245,255,.025) 1px,transparent 1px);
      background-size:60px 60px;pointer-events:none;z-index:0}

    /* Nav */
    nav{width:100%;max-width:680px;display:flex;align-items:center;justify-content:space-between;
        padding:20px 0;position:relative;z-index:1}
    .nav-logo{display:flex;align-items:center;gap:8px;font-family:var(--fd);font-size:.95rem;font-weight:700;color:var(--text)}
    .nav-logo span{color:var(--cyan)}
    .nav-back{font-family:var(--fd);font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;
              color:var(--muted);text-decoration:none;padding:7px 14px;border:1px solid var(--border);border-radius:8px;transition:.3s}
    .nav-back:hover{border-color:var(--cyan);color:var(--cyan)}

    /* Hero */
    .hero{text-align:center;padding:40px 0 32px;position:relative;z-index:1;width:100%;max-width:680px}
    .hero-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;
                border:1px solid rgba(0,245,255,.2);border-radius:20px;margin-bottom:18px;
                font-family:var(--fd);font-size:.60rem;letter-spacing:.14em;text-transform:uppercase;
                color:var(--cyan);background:var(--cd)}
    h1{font-family:var(--fd);font-size:clamp(1.4rem,4vw,2rem);font-weight:900;letter-spacing:.02em;
       line-height:1.2;margin-bottom:12px}
    h1 span{color:var(--cyan)}
    .hero-sub{color:var(--muted);font-size:.95rem;max-width:440px;margin:0 auto}

    /* Card */
    .card{width:100%;max-width:680px;background:var(--card);border:1px solid var(--border);
          border-radius:20px;padding:36px 32px;backdrop-filter:blur(20px);
          position:relative;z-index:1;margin-bottom:24px}

    /* Form */
    .form-group{display:flex;gap:10px;margin-top:24px}
    .enroll-input{flex:1;padding:14px 16px;background:rgba(0,245,255,.04);border:1px solid var(--border);
                  border-radius:10px;color:var(--text);font-family:var(--fb);font-size:1rem;outline:none;transition:.3s}
    .enroll-input:focus{border-color:var(--cyan);background:rgba(0,245,255,.07)}
    .enroll-input::placeholder{color:var(--muted)}
    .search-btn{padding:14px 28px;background:linear-gradient(135deg,var(--cyan),#0088ff);color:#000;
                font-family:var(--fd);font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                border:none;border-radius:10px;cursor:pointer;transition:.3s;white-space:nowrap}
    .search-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,245,255,.3)}

    /* Error */
    .error-box{margin-top:20px;padding:14px 18px;background:rgba(239,68,68,.08);
               border:1px solid rgba(239,68,68,.25);border-radius:10px;
               color:#f87171;font-family:var(--fd);font-size:.72rem;letter-spacing:.06em}

    /* Result card */
    .result-card{width:100%;max-width:680px;background:var(--card);border:1px solid var(--border);
                 border-radius:20px;backdrop-filter:blur(20px);position:relative;z-index:1;overflow:hidden}
    .result-header{padding:24px 32px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
    .result-name{font-family:var(--fd);font-size:1.05rem;font-weight:700}
    .result-enr{font-family:var(--fd);font-size:.68rem;color:var(--cyan);letter-spacing:.08em;margin-top:3px}
    .status-pill{padding:8px 18px;border-radius:30px;font-family:var(--fd);font-size:.72rem;font-weight:700;letter-spacing:.10em;text-transform:uppercase}

    .result-body{padding:28px 32px}

    /* Timeline */
    .timeline{display:flex;flex-direction:column;gap:0}
    .tl-step{display:flex;gap:16px;padding-bottom:22px;position:relative}
    .tl-step:last-child{padding-bottom:0}
    .tl-step:not(:last-child)::after{content:'';position:absolute;left:15px;top:32px;bottom:0;width:2px;background:linear-gradient(to bottom,var(--col,var(--cyan)),rgba(0,245,255,0))}
    .tl-dot{width:32px;height:32px;border-radius:50%;border:2px solid var(--col,var(--border));
            display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;
            background:rgba(0,0,0,.5);transition:.3s;z-index:1}
    .tl-dot.done{background:var(--col);filter:drop-shadow(0 0 8px var(--col))}
    .tl-content{padding-top:4px}
    .tl-label{font-family:var(--fd);font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
    .tl-desc{font-size:.85rem;color:var(--muted);margin-top:3px;line-height:1.5}

    /* Info grid */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px;padding-top:24px;border-top:1px solid var(--border)}
    .info-item{}
    .info-key{font-family:var(--fd);font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
    .info-val{font-size:.90rem;font-weight:500}
    .info-val.cyan{color:var(--cyan)}
    .info-val.orange{color:var(--orange)}

    /* Footer */
    footer{text-align:center;font-family:var(--fd);font-size:.60rem;letter-spacing:.10em;text-transform:uppercase;
           color:var(--muted);padding-top:24px;position:relative;z-index:1}
    footer a{color:var(--cyan);text-decoration:none}
    @media(max-width:600px){.card,.result-card{padding:24px 18px}.form-group{flex-direction:column}.info-grid{grid-template-columns:1fr}}
  </style>
</head>
<body>

<nav>
  <div class="nav-logo">⬡ 3D<span>INVENZA</span></div>
  <a href="index.html" class="nav-back">← Order Form</a>
</nav>

<div class="hero">
  <div class="hero-badge">🔍 Order Tracker</div>
  <h1>Check Your <span>Keychain</span> Status</h1>
  <p class="hero-sub">Enter your enrollment number to instantly see where your order is.</p>
</div>

<!-- Search Card -->
<div class="card">
  <form method="POST" id="searchForm">
    <label style="font-family:var(--fd);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">
      Enrollment Number
    </label>
    <div class="form-group">
      <input class="enroll-input" type="text" name="enrollment" id="enrollInput"
             value="<?= htmlspecialchars($lookup) ?>"
             placeholder="e.g. 229200307001" autocomplete="off" autofocus/>
      <button class="search-btn" type="submit">Track →</button>
    </div>
  </form>

  <?php if ($error): ?>
    <div class="error-box">⚠ <?= $error ?></div>
  <?php endif; ?>
</div>

<?php if ($student):
  $si   = $statusInfo[$student['status']] ?? $statusInfo['pending'];
  $col  = $si['color'];
  $order = array_keys($statusInfo);
  $curIdx = array_search($student['status'], $order);
?>
<!-- Result -->
<div class="result-card">
  <div class="result-header">
    <div>
      <div class="result-name"><?= htmlspecialchars($student['name']) ?></div>
      <div class="result-enr"># <?= htmlspecialchars($student['enrollment']) ?></div>
    </div>
    <div class="status-pill" style="background:<?= $col ?>22;color:<?= $col ?>;border:1px solid <?= $col ?>55">
      <?= $si['icon'] ?> <?= $si['label'] ?>
    </div>
  </div>

  <div class="result-body">
    <!-- Timeline -->
    <div class="timeline">
      <?php foreach ($statusInfo as $key => $info):
        $idx  = array_search($key, $order);
        $done = ($idx <= $curIdx);
        $cur  = ($idx === $curIdx);
      ?>
      <div class="tl-step" style="--col:<?= $info['color'] ?>">
        <div class="tl-dot <?= $done ? 'done' : '' ?>" style="--col:<?= $info['color'] ?>">
          <?= $done ? $info['icon'] : '○' ?>
        </div>
        <div class="tl-content">
          <div class="tl-label" style="color:<?= $done ? $info['color'] : 'var(--muted)' ?>"><?= $info['label'] ?></div>
          <?php if ($cur): ?>
            <div class="tl-desc"><?= $info['desc'] ?></div>
          <?php endif; ?>
        </div>
      </div>
      <?php endforeach; ?>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-item">
        <div class="info-key">Keychain Title</div>
        <div class="info-val orange"><?= htmlspecialchars($student['title'] ?? '—') ?></div>
      </div>
      <div class="info-item">
        <div class="info-key">Department</div>
        <div class="info-val"><?= htmlspecialchars($student['department'] ?? '—') ?></div>
      </div>
      <div class="info-item">
        <div class="info-key">Year / Batch</div>
        <div class="info-val"><?= htmlspecialchars($student['year'] ?? '—') ?></div>
      </div>
      <div class="info-item">
        <div class="info-key">Registered On</div>
        <div class="info-val"><?= date('d M Y', strtotime($student['created_at'])) ?></div>
      </div>
    </div>
  </div>
</div>
<?php endif; ?>

<footer>
  3D Invenza &copy; <?= date('Y') ?> &mdash;
  <a href="index.html">Order a Keychain</a> &middot;
  <a href="../index.html">Visit Website</a>
</footer>

</body>
</html>
