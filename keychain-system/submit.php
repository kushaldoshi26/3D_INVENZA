<?php
// ─── 3D Invenza — Student Registration Handler ──────────────
// Receives form POST data, sanitizes, and stores in DB.
// On success: redirects to thank you page.

include 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

// ── Sanitize inputs ──────────────────────────────────────────
function clean($val) {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

$name       = clean($_POST['name']       ?? '');
$enrollment = clean($_POST['enrollment'] ?? '');
$gender     = clean($_POST['gender']     ?? '');
$phone      = clean($_POST['phone']      ?? '');
$email      = clean($_POST['email']      ?? '');
$city       = clean($_POST['city']       ?? '');
$department = clean($_POST['department'] ?? '');
$year       = clean($_POST['year']       ?? '');
$batch      = clean($_POST['batch']      ?? '');
$instagram  = clean($_POST['instagram']  ?? '');
$song_link  = clean($_POST['song_link']  ?? '');
$title      = clean($_POST['title']      ?? '');

// ── Validate required fields ─────────────────────────────────
$errors = [];
if (empty($name))       $errors[] = 'Name is required.';
if (empty($enrollment)) $errors[] = 'Enrollment number is required.';
if (empty($phone))      $errors[] = 'Phone number is required.';
if (empty($song_link))  $errors[] = 'Spotify song link is required.';
if (empty($title))      $errors[] = 'Keychain title is required.';

if (!empty($errors)) {
    $msg = urlencode(implode(' ', $errors));
    header("Location: index.html?error=$msg");
    exit;
}

// ── Check duplicate enrollment ───────────────────────────────
$check = $conn->prepare("SELECT id FROM students WHERE enrollment = ?");
$check->bind_param("s", $enrollment);
$check->execute();
$check->store_result();
if ($check->num_rows > 0) {
    header("Location: index.html?error=" . urlencode('This enrollment number has already been registered.'));
    exit;
}
$check->close();

// ── Insert student record ────────────────────────────────────
$stmt = $conn->prepare(
    "INSERT INTO students
     (name, enrollment, gender, phone, email, city, department, year, batch, instagram, song_link, title)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

$stmt->bind_param(
    "ssssssssssss",
    $name, $enrollment, $gender, $phone, $email,
    $city, $department, $year, $batch, $instagram,
    $song_link, $title
);

if ($stmt->execute()) {
    $new_id = $conn->insert_id;
    $stmt->close();
    $conn->close();
    // Redirect with success
    header("Location: index.html?success=1&id=$new_id");
    exit;
} else {
    $stmt->close();
    $conn->close();
    header("Location: index.html?error=" . urlencode('Registration failed. Please try again.'));
    exit;
}
?>
