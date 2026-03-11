# 3D Invenza — XAMPP Setup Guide

## Step 1 — Install XAMPP

Download from: <https://www.apachefriends.org/>  
Install with default settings. After install, open **XAMPP Control Panel** and start:

- ✅ **Apache** (web server)
- ✅ **MySQL** (database)

---

## Step 2 — Copy Project Files

Copy the entire `3d invenza` folder into:

```
C:\xampp\htdocs\3d-invenza\
```

So the main page is at:

```
C:\xampp\htdocs\3d-invenza\index.html
```

---

## Step 3 — Create the Databases

1. Open your browser → go to: **<http://localhost/phpmyadmin>**
2. Click **SQL** tab at the top
3. Paste the entire contents of **`setup_all.sql`** (from the project root)
4. Click **Go**

This creates:

- `invenza_db` — users, orders, hero models
- `spotify_keychain` — student keychain orders

---

## Step 4 — Access the Website

| Page | URL |
|------|-----|
| **Home** | <http://localhost/3d-invenza/> |
| **Login** | <http://localhost/3d-invenza/auth/login.php> |
| **Register** | <http://localhost/3d-invenza/auth/register.html> |
| **Upload** | <http://localhost/3d-invenza/upload.html> |
| **Dashboard** | <http://localhost/3d-invenza/dashboard.html> |
| **Keychain Form** | <http://localhost/3d-invenza/keychain-system/index.html> |
| **Order Status** | <http://localhost/3d-invenza/keychain-system/status.php> |

---

## Step 5 — Admin Access

| Admin Page | URL |
|-----------|-----|
| **Main Dashboard** | <http://localhost/3d-invenza/admin/index.php> |
| **Users** | <http://localhost/3d-invenza/admin/users.php> |
| **Orders** | <http://localhost/3d-invenza/admin/orders.php> |
| **3D Models** | <http://localhost/3d-invenza/admin/models.php> |
| **Keychain Orders** | <http://localhost/3d-invenza/keychain-system/admin.php> |

### Default Admin Login

```
Email:    admin@3dinvenza.com
Password: Admin@2025
```

### Keychain Admin Password

```
Password: invenza2025
```

_(Set in `keychain-system/admin.php` line 2 — `ADMIN_PASS`)_

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| PHP files not running | Make sure Apache is running in XAMPP |
| DB connection failed | Make sure MySQL is running; run `setup_all.sql` |
| Login not working | Run `auth/setup.sql` manually in phpMyAdmin |
| Uploads failing | Right-click `uploads/` folder → Properties → allow write |
| Port conflict | Change Apache port in XAMPP config (default: 80) |

---

## File Structure

```
3d-invenza/
├── index.html              Main website
├── dashboard.html          User dashboard
├── upload.html             File upload + pricing
├── features.html / products.html / contact.html
├── setup_all.sql           ← Run this in phpMyAdmin
│
├── auth/
│   ├── login.html          Login page (HTML form)
│   ├── login.php           Login handler
│   ├── register.html       Register page
│   ├── register.php        Registration handler
│   ├── logout.php          Logout
│   ├── setup.sql           Auth-only DB setup
│   └── config/db.php       Database config
│
├── admin/
│   ├── index.php           Admin dashboard
│   ├── users.php           User management
│   ├── orders.php          Print orders management
│   ├── models.php          3D model upload/activate
│   ├── admin.html          Static preview (no PHP needed)
│   └── config.php          Admin session check
│
├── keychain-system/
│   ├── index.html          Student registration form
│   ├── submit.php          Form handler
│   ├── status.php          Public order status tracker
│   ├── admin.php           Keychain admin panel
│   ├── setup.sql           Keychain DB setup
│   └── config/db.php       Keychain DB config
│
├── css/ js/               Styles and scripts
└── backend/               Node.js API (optional, port 4000)
```
