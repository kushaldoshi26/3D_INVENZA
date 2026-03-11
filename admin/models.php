<?php
include '../admin/config.php';
include '../auth/config/db.php';

// Create uploads dir if not exists
$uploadDir = __DIR__ . '/../uploads/models/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$msg = ''; $err = '';

// Delete model
if (isset($_GET['del']) && (int)$_GET['del'] > 0) {
    $id = (int)$_GET['del'];
    $row = $conn->query("SELECT filename FROM hero_models WHERE id=$id")->fetch_assoc();
    if ($row) {
        $fp = $uploadDir . $row['filename'];
        if (file_exists($fp)) unlink($fp);
        $conn->query("DELETE FROM hero_models WHERE id=$id");
    }
    header('Location: models.php?ok=deleted'); exit;
}

// Set active model
if (isset($_GET['activate']) && (int)$_GET['activate'] > 0) {
    $id = (int)$_GET['activate'];
    $conn->query("UPDATE hero_models SET active=0");
    $conn->query("UPDATE hero_models SET active=1 WHERE id=$id");
    header('Location: models.php?ok=activated'); exit;
}

// Upload handler
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['model'])) {
    $name   = trim(htmlspecialchars($_POST['model_name'] ?? 'Untitled'));
    $file   = $_FILES['model'];
    $ext    = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['stl', 'obj', 'glb', 'gltf', '3mf'];

    if (!in_array($ext, $allowed)) {
        $err = 'Unsupported format. Allowed: STL, OBJ, GLB, GLTF, 3MF.';
    } elseif ($file['size'] > 50 * 1024 * 1024) {
        $err = 'File too large. Max 50 MB.';
    } else {
        $fname = uniqid('model_', true) . '.' . $ext;
        if (move_uploaded_file($file['tmp_name'], $uploadDir . $fname)) {
            // Ensure table exists
            $conn->query("CREATE TABLE IF NOT EXISTS hero_models (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                filename VARCHAR(255) NOT NULL,
                ext VARCHAR(10),
                size INT,
                active TINYINT(1) DEFAULT 0,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");
            $size = $file['size'];
            $stmt = $conn->prepare("INSERT INTO hero_models (name,filename,ext,size) VALUES(?,?,?,?)");
            $stmt->bind_param("sssi", $name, $fname, $ext, $size);
            $stmt->execute(); $stmt->close();
            $msg = "Model \"$name\" uploaded successfully.";
        } else { $err = 'Upload failed. Check folder permissions.'; }
    }
}

// Fetch models list
$conn->query("CREATE TABLE IF NOT EXISTS hero_models (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, filename VARCHAR(255) NOT NULL, ext VARCHAR(10), size INT, active TINYINT(1) DEFAULT 0, uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
$models = $conn->query("SELECT * FROM hero_models ORDER BY uploaded_at DESC");
$conn->close();

function fmtSize($b) { if ($b > 1048576) return round($b/1048576,1).' MB'; return round($b/1024).' KB'; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D Models — Admin | 3D Invenza</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root{--bg:#020812;--card:rgba(8,18,38,0.88);--cyan:#00f5ff;--cyan-d:rgba(0,245,255,0.08);--violet:#7c3aed;--orange:#f97316;--border:rgba(0,245,255,0.1);--text:#e0f2fe;--muted:rgba(224,242,254,0.5);--font-d:'Orbitron',monospace;--font-b:'Inter',sans-serif}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--bg);color:var(--text);font-family:var(--font-b);min-height:100vh;display:flex}
    body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,245,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.02) 1px,transparent 1px);background-size:60px 60px;pointer-events:none}
    a{color:inherit;text-decoration:none}
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
    .sb-user{display:flex;align-items:center;gap:12px}
    .sb-avatar{width:36px;height:36px;border-radius:50%;background:var(--cyan-d);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:0.75rem;color:var(--cyan);font-weight:700}
    .sb-uname{font-family:var(--font-d);font-size:0.7rem;font-weight:600}
    .sb-urole{font-size:0.72rem;color:var(--orange)}
    .sb-logout{margin-top:10px;width:100%;padding:9px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#f87171;font-family:var(--font-d);font-size:0.62rem;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;text-align:center;display:block;transition:0.3s}
    .main{flex:1;margin-left:260px;z-index:1;position:relative}
    .topbar{padding:20px 32px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:rgba(2,8,18,0.8);backdrop-filter:blur(20px);position:sticky;top:0;z-index:5}
    .topbar-title{font-family:var(--font-d);font-size:0.85rem;font-weight:700;color:var(--cyan);letter-spacing:0.06em}
    .topbar-bc{font-family:var(--font-d);font-size:0.6rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-top:4px}
    .content{padding:32px}
    .btn-sm{padding:8px 16px;border-radius:8px;font-family:var(--font-d);font-size:0.62rem;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:0.3s;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:transparent;color:var(--muted)}
    .btn-sm:hover{border-color:var(--cyan);color:var(--cyan);background:var(--cyan-d)}

    /* Two-col layout */
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
    .panel{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;backdrop-filter:blur(20px)}
    .p-head{padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .p-title{font-family:var(--font-d);font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--cyan)}

    /* Alert msgs */
    .alert{padding:12px 18px;border-radius:8px;margin-bottom:20px;font-family:var(--font-d);font-size:0.66rem;letter-spacing:0.06em}
    .ok{background:rgba(29,185,84,0.1);border:1px solid rgba(29,185,84,0.3);color:#1db954}
    .err{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);color:#f87171}

    /* Upload form */
    .upload-form{padding:22px}
    .field-label{font-family:var(--font-d);font-size:0.6rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);display:block;margin-bottom:6px}
    .text-input{width:100%;padding:11px 14px;background:rgba(0,245,255,0.03);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-b);font-size:0.9rem;outline:none;margin-bottom:16px;transition:0.3s}
    .text-input:focus{border-color:var(--cyan);background:var(--cyan-d)}
    .drop-zone{border:2px dashed rgba(0,245,255,0.2);border-radius:12px;padding:36px 20px;text-align:center;cursor:pointer;transition:0.3s;margin-bottom:16px;position:relative}
    .drop-zone:hover,.drop-zone.drag{border-color:var(--cyan);background:var(--cyan-d)}
    .drop-zone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
    .drop-icon{font-size:2rem;margin-bottom:10px}
    .drop-main{font-family:var(--font-d);font-size:0.72rem;color:var(--cyan);letter-spacing:0.08em;margin-bottom:4px}
    .drop-sub{font-size:0.78rem;color:var(--muted)}
    .file-chosen{font-family:var(--font-d);font-size:0.65rem;color:#1db954;margin-top:6px}
    .btn-upload{width:100%;padding:13px;background:linear-gradient(135deg,var(--cyan),#0088ff);color:#000;font-family:var(--font-d);font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;border:none;border-radius:8px;cursor:pointer;box-shadow:0 0 20px rgba(0,245,255,0.2);transition:0.3s}
    .btn-upload:hover{transform:translateY(-2px);box-shadow:0 0 30px rgba(0,245,255,0.35)}

    /* Models table */
    table{width:100%;border-collapse:collapse}
    th{padding:11px 18px;font-family:var(--font-d);font-size:0.56rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);text-align:left;background:rgba(0,245,255,0.02);border-bottom:1px solid var(--border)}
    td{padding:13px 18px;border-bottom:1px solid rgba(0,245,255,0.05);font-size:0.83rem;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background:rgba(0,245,255,0.015)}
    .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-family:var(--font-d);font-size:0.56rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase}
    .ext-badge{background:var(--cyan-d);border:1px solid rgba(0,245,255,0.25);color:var(--cyan)}
    .active-badge{background:rgba(29,185,84,0.12);border:1px solid rgba(29,185,84,0.3);color:#1db954}
    .act-btn{padding:5px 10px;border-radius:6px;font-family:var(--font-d);font-size:0.56rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border:1px solid;text-decoration:none;display:inline-block;transition:0.2s;margin-right:4px}
    .act-activate{border-color:rgba(29,185,84,0.3);color:#1db954}
    .act-del{border-color:rgba(239,68,68,0.3);color:#f87171}
    .empty{padding:40px;text-align:center;color:var(--muted);font-family:var(--font-d);font-size:0.68rem;letter-spacing:0.08em}
    .td-muted{color:var(--muted);font-size:0.78rem}
    @media(max-width:900px){.two-col{grid-template-columns:1fr}}
  </style>
</head>
<body>
<aside class="sidebar">
  <div class="sb-logo"><span class="sb-logo-icon">⬡</span><span class="sb-logo-text">3D<span>INVENZA</span></span></div>
  <div class="sb-label">Main</div>
  <nav class="sb-nav">
    <a href="index.php" class="sb-link"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Dashboard</a>
    <a href="users.php" class="sb-link"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Users</a>
    <a href="models.php" class="sb-link active"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>3D Models</a>
    <a href="../keychain-system/admin.php" class="sb-link"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778"/></svg>Keychains</a>
  </nav>
  <div class="sb-label">Settings</div>
  <nav class="sb-nav">
    <a href="../index.html" class="sb-link"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>View Website</a>
  </nav>
  <div class="sb-footer">
    <div class="sb-user">
      <div class="sb-avatar"><?= strtoupper(substr($_SESSION['user_name'],0,1)) ?></div>
      <div><div class="sb-uname"><?= htmlspecialchars($_SESSION['user_name']) ?></div><div class="sb-urole">Administrator</div></div>
    </div>
    <a href="../auth/logout.php" class="sb-logout">Sign Out →</a>
  </div>
</aside>

<main class="main">
  <div class="topbar">
    <div><div class="topbar-title">3D Model Manager</div><div class="topbar-bc">Admin · Hero Display Models</div></div>
    <a href="index.php" class="btn-sm">← Dashboard</a>
  </div>
  <div class="content">

    <?php if ($msg): ?><div class="alert ok">✓ <?= $msg ?></div><?php endif; ?>
    <?php if ($err): ?><div class="alert err">⚠ <?= $err ?></div><?php endif; ?>
    <?php if (isset($_GET['ok'])): ?><div class="alert ok">✓ Model <?= htmlspecialchars($_GET['ok']) ?>.</div><?php endif; ?>

    <div class="two-col">
      <!-- Upload panel -->
      <div class="panel premium-card">
        <div class="p-head"><div class="p-title">Upload New Model</div></div>
        <form class="upload-form" method="POST" enctype="multipart/form-data">
          <label class="field-label" for="mname">Model Display Name</label>
          <input class="text-input premium-input" type="text" id="mname" name="model_name" placeholder="e.g. Iron Man Mark V" required />
          <label class="field-label">Model File</label>
          <div class="drop-zone" id="dropZone">
            <input type="file" name="model" id="modelFile" accept=".stl,.obj,.glb,.gltf,.3mf" required />
            <div class="drop-icon">📦</div>
            <div class="drop-main">Drag & drop or click to upload</div>
            <div class="drop-sub">STL · OBJ · GLB · GLTF · 3MF · Max 50 MB</div>
            <div class="file-chosen" id="fileChosen"></div>
          </div>
          <button class="btn-upload premium-btn premium-btn-primary" type="submit">Upload Model →</button>
        </form>
      </div>

      <!-- Info panel -->
      <div class="panel premium-card">
        <div class="p-head"><div class="p-title">How It Works</div></div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:18px">
          <?php $steps = [['01','Upload a 3D model file (STL, OBJ, or GLB).','var(--cyan)'],['02','Click "Set Active" to display it in the hero.','var(--violet)'],['03','The hero automatically loads your model on next page visit.','var(--orange)'],]; foreach($steps as [$n,$t,$c]): ?>
          <div style="display:flex;align-items:flex-start;gap:14px">
            <div style="width:32px;height:32px;border-radius:50%;background:<?=$c?>22;border:1px solid <?=$c?>44;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:0.65rem;color:<?=$c?>;flex-shrink:0"><?=$n?></div>
            <div style="font-size:0.85rem;color:rgba(224, 242, 254, 0.5);padding-top:6px;line-height:1.5"><?=$t?></div>
          </div>
          <?php endforeach; ?>
          <div style="margin-top:10px;padding:14px;background:var(--cyan-dim);border:1px solid rgba(0,245,255,0.15);border-radius:10px">
            <div style="font-family:var(--font-display);font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--cyan);margin-bottom:4px">Preset Models</div>
            <div style="font-size:0.82rem;color:rgba(224, 242, 254, 0.5)">Iron Man · Arc Reactor · JARVIS AI · 3D Printer · Hex Core — always available even without uploads.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Models list -->
    <div class="panel premium-card">
      <div class="p-head">
        <div class="p-title">Uploaded Models</div>
        <span style="font-family:var(--font-display);font-size:0.6rem;color:rgba(224, 242, 254, 0.5)"><?= $models->num_rows ?? 0 ?> files</span>
      </div>
      <?php if ($models && $models->num_rows > 0): ?>
      <div class="overflow-x">
        <table class="premium-table">
          <thead><tr><th>#</th><th>Name</th><th>File</th><th>Format</th><th>Size</th><th>Status</th><th>Uploaded</th><th>Actions</th></tr></thead>
          <tbody>
            <?php while($m = $models->fetch_assoc()): ?>
            <tr>
              <td class="td-muted"><?= $m['id'] ?></td>
              <td style="font-weight:500"><?= htmlspecialchars($m['name']) ?></td>
              <td class="td-muted"><?= htmlspecialchars($m['filename']) ?></td>
              <td><span class="badge ext-badge"><?= strtoupper($m['ext']) ?></span></td>
              <td class="td-muted"><?= fmtSize($m['size']) ?></td>
              <td><?php if($m['active']): ?><span class="badge active-badge">Active</span><?php else: ?><span class="td-muted" style="font-family:var(--font-display);font-size:0.6rem">—</span><?php endif; ?></td>
              <td class="td-muted"><?= date('d M Y', strtotime($m['uploaded_at'])) ?></td>
              <td>
                <?php if (!$m['active']): ?>
                <a href="models.php?activate=<?=$m['id']?>" class="act-btn act-activate" onclick="return confirm('Set as hero model?')">Set Active</a>
                <?php endif; ?>
                <a href="models.php?del=<?=$m['id']?>" class="act-btn act-del" onclick="return confirm('Delete this model file?')">Delete</a>
              </td>
            </tr>
            <?php endwhile; ?>
          </tbody>
        </table>
      </div>
      <?php else: ?><div style="padding:40px;text-align:center;color:rgba(224, 242, 254, 0.5);font-family:var(--font-display);font-size:0.68rem;letter-spacing:0.08em">No models uploaded yet. Upload your first 3D model above.</div><?php endif; ?>
    </div>
  </div>
</main>

<script>
  var dz = document.getElementById('dropZone');
  var fi = document.getElementById('modelFile');
  fi.addEventListener('change', function() {
    if (fi.files[0]) document.getElementById('fileChosen').textContent = '✓ ' + fi.files[0].name;
  });
  dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', function() { dz.classList.remove('drag'); });
  dz.addEventListener('drop', function(e) { e.preventDefault(); dz.classList.remove('drag'); fi.files = e.dataTransfer.files; if(fi.files[0]) document.getElementById('fileChosen').textContent = '✓ ' + fi.files[0].name; });
</script>
</body>
</html>
