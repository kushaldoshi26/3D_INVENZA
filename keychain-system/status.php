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
  <link rel="stylesheet" href="../css/premium-php.css" />
  <style>
    :root{
      --bg:#020812;
      --card:rgba(8,18,38,0.90);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%}
    body{background:var(--bg);color:var(--text);font-family:var(--font-body);line-height:1.6;
      display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
      min-height:100vh;padding:0 16px 48px}
    body::before{content:'';position:fixed;inset:0;
      background-image:linear-gradient(rgba(0,245,255,.025) 1px,transparent 1px),
        linear-gradient(90deg,rgba(0,245,255,.025) 1px,transparent 1px);
      background-size:60px 60px;pointer-events:none;z-index:0}

    /* Nav */
    nav{width:100%;max-width:680px;display:flex;align-items:center;justify-content:space-between;
        padding:24px 0;position:relative;z-index:100}
    .nav-logo{font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--cyan);letter-spacing:0.05em}
    .nav-logo span{color:var(--text)}
    .nav-back{font-family:var(--font-display);font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;
              color:rgba(224, 242, 254, 0.5);text-decoration:none;padding:7px 14px;border:1px solid var(--border);border-radius:8px;transition:.3s}
    .nav-back:hover{border-color:var(--cyan);color:var(--cyan)}

    /* Hero */
    .hero{text-align:center;padding:40px 0 32px;position:relative;z-index:1;width:100%;max-width:680px}
    .hero-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;
                border:1px solid rgba(0,245,255,.2);border-radius:20px;margin-bottom:18px;
                font-family:var(--font-display);font-size:.60rem;letter-spacing:.14em;text-transform:uppercase;
                color:var(--cyan);background:var(--cyan-dim)}
    h1{font-family:var(--font-display);font-size:clamp(1.6rem, 5vw, 2.2rem);font-weight:900;letter-spacing:-0.01em;
       line-height:1.1;margin-bottom:16px}
    h1 span{color:var(--cyan)}
    .hero-sub{color:rgba(224, 242, 254, 0.6);font-size:1rem;max-width:440px;margin:0 auto}

    /* Card */
    .card{width:100%;max-width:680px;padding:36px 32px;position:relative;z-index:1;margin-bottom:24px}

    /* Form */
    .form-group{display:flex;gap:12px;margin-top:24px}
    .enroll-input{flex:1;min-width:0;}
    .search-btn{padding:14px 28px;white-space:nowrap}

    /* Error */
    .error-box{margin-top:20px;padding:14px 18px;background:rgba(239,68,68,.08);
               border:1px solid rgba(239,68,68,.25);border-radius:10px;
               color:#f87171;font-family:var(--font-display);font-size:.72rem;letter-spacing:.06em}

    /* Result card */
    .result-card{width:100%;max-width:680px;position:relative;z-index:1;overflow:hidden}
    .result-header{padding:24px 32px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
    .result-name{font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--text)}
    .result-enr{font-family:var(--font-display);font-size:.68rem;color:var(--cyan);letter-spacing:.08em;margin-top:3px}
    .status-pill{padding:8px 18px;border-radius:30px;font-family:var(--font-display);font-size:.72rem;font-weight:700;letter-spacing:.10em;text-transform:uppercase}

    .result-body{padding:28px 32px}

    /* Timeline */
    .timeline{display:flex;flex-direction:column;gap:0}
    .tl-step{display:flex;gap:18px;padding-bottom:28px;position:relative}
    .tl-step:last-child{padding-bottom:0}
    .tl-step:not(:last-child)::after{content:'';position:absolute;left:15px;top:32px;bottom:0;width:2px;background:linear-gradient(to bottom,var(--col),rgba(0,245,255,0))}
    .tl-dot{width:32px;height:32px;border-radius:50%;border:2px solid var(--border);
            display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;
            background:rgba(0,0,0,.5);transition:.3s;z-index:1}
    .tl-dot.done{background:var(--col);filter:drop-shadow(0 0 10px var(--col));border-color:rgba(255,255,255,0.2)}
    .tl-content{padding-top:4px}
    .tl-label{font-family:var(--font-display);font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
    .tl-desc{font-size:.88rem;color:rgba(224, 242, 254, 0.6);margin-top:4px;line-height:1.5}

    /* Info grid */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;padding-top:32px;border-top:1px solid var(--border)}
    .info-key{font-family:var(--font-display);font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(224, 242, 254, 0.4);margin-bottom:6px}
    .info-val{font-size:.92rem;font-weight:500;color:var(--text)}
    .info-val.cyan{color:var(--cyan)}
    .info-val.orange{color:var(--orange)}

    /* Footer */
    footer{text-align:center;font-family:var(--font-display);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;
           color:rgba(224, 242, 254, 0.4);padding:40px 0;position:relative;z-index:1}
    footer a{color:var(--cyan);text-decoration:none;margin:0 8px}
    @media(max-width:600px){.card,.result-card{padding:24px 18px}.form-group{flex-direction:column}.info-grid{grid-template-columns:1fr}}
  </style>
</head>
<body>

<nav>
  <div class="nav-logo">3D<span>INVENZA</span></div>
  <a href="index.html" class="nav-back">← Order Form</a>
</nav>

<div class="hero">
  <div class="hero-badge">🔍 Order Tracker</div>
  <h1>Check Your <span>Keychain</span> Status</h1>
  <p class="hero-sub">Enter your enrollment number to instantly see where your order is.</p>
</div>

<!-- Search Card -->
<div class="card premium-card">
  <form method="POST" id="searchForm">
    <label style="font-family:var(--font-display);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(224, 242, 254, 0.4)">
      Enrollment Number
    </label>
    <div class="form-group">
      <input class="premium-input enroll-input" type="text" name="enrollment" id="enrollInput"
             value="<?= htmlspecialchars($lookup) ?>"
             placeholder="e.g. 229200307001" autocomplete="off" autofocus/>
      <button class="premium-btn premium-btn-primary search-btn" type="submit">Track →</button>
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
<div class="result-card premium-card">
  <div class="result-header">
    <div>
      <div class="result-name"><?= htmlspecialchars($student['name']) ?></div>
      <div class="result-enr">ENROLLMENT # <?= htmlspecialchars($student['enrollment']) ?></div>
    </div>
    <div class="status-pill" style="background:<?= $col ?>15;color:<?= $col ?>;border:1px solid <?= $col ?>44">
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
          <div class="tl-label" style="color:<?= $done ? $info['color'] : 'rgba(224, 242, 254, 0.4)' ?>"><?= $info['label'] ?></div>
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
        <div class="info-val orange" style="color:var(--orange)"><?= htmlspecialchars($student['title'] ?? '—') ?></div>
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
  3D Invenza &copy; <?= date('Y') ?> &nbsp;&bull;&nbsp;
  <a href="index.html">Claim Free Keychain</a> &nbsp;&bull;&nbsp;
  <a href="../index.html">Official Website</a>
</footer>

</body>
</html>
