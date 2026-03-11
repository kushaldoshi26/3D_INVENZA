# 3DINVENZA - Production Platform v2.0

## 🔧 Prerequisites

1. **Node.js**: v18+
2. **MySQL**: Ensure it's running (e.g., via XAMPP)
3. **PrusaSlicer**: Install PrusaSlicer and set the path in `server/.env`
4. **Razorpay**: (Optional) For payments, add keys to `.env`

## 🚀 Setup Instructions

### 1. Database

- Open MySQL Admin
- Run the code in `schema.sql` to create the database and tables.

### 2. Backend

```bash
cd server
npm install
npm run dev
```

- Server runs on `http://localhost:5000`

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

- Client runs on `http://localhost:5173` (Vite default)

## 📂 Features

- **AI 3D Generation**: Abstraction ready for photo-to-3D models.
- **Server-Side Slicing**: Real-time filament and time calculation using PrusaSlicer CLI.
- **Interactive 3D Viewer**: Three.js integration for model previews.
- **Admin Dashboard**: Download G-code directly for printing.
- **Automated Pricing**: Based on grams calculated by the slicer.

## 🛠️ Folder Structure

- `server/src/services`: Contains the Slicer and AI API logic.
- `server/uploads`: Storage for original models and generated G-codes.
- `client/src/components/3d`: Three.js viewport components.
- `client/src/pages`: User and Admin views.

---
Built by Antigravity Senior Engineer Persona.
