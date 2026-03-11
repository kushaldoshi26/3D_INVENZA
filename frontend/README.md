# 3D INVENZA - Complete E-Commerce Platform

## 🚀 What's Included

### Frontend (React)
- ✅ Home page with hero section
- ✅ Upload page with real file upload
- ✅ Checkout page
- ✅ Order tracking
- ✅ Login/Signup
- ✅ User dashboard
- ✅ Admin panel

### Backend (Node.js + Express)
- ✅ File upload API
- ✅ Pricing calculator
- ✅ Order management
- ✅ Authentication (JWT)
- ✅ Admin endpoints

## 📦 Setup Instructions

### 1. Backend Setup

```bash
cd D:\ai_brain\backend
npm install
npm start
```

Backend runs on: http://localhost:4000

### 2. Frontend Setup

```bash
cd D:\ai_brain\3d-invenza-frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

## 🎯 How to Use

### Customer Flow:
1. Go to http://localhost:3000
2. Click "Upload Model"
3. Upload STL/OBJ/3MF file
4. Get instant quote
5. Click "Continue to Checkout"
6. Fill details and place order
7. Track order using Order ID

### Admin Flow:
1. Create admin user (see below)
2. Login at /login
3. Go to /admin
4. View all orders
5. Update order status
6. Change pricing config

## 🔐 Create Admin User

Add this to backend/server.js after line 40:

```javascript
// Create default admin
users.push({
  id: "admin-001",
  email: "admin@3dinvenza.com",
  password: await bcrypt.hash("admin123", 10),
  name: "Admin",
  role: "admin"
});
```

Then login with:
- Email: admin@3dinvenza.com
- Password: admin123

## 📝 What's Missing (Optional Upgrades)

### Phase 2:
- [ ] Real 3D model viewer (Three.js)
- [ ] G-code slicing preview
- [ ] Payment gateway (Razorpay)
- [ ] Email notifications
- [ ] Database (MongoDB/MySQL)

### Phase 3:
- [ ] Product catalog
- [ ] Shopping cart
- [ ] Reviews & ratings
- [ ] SEO optimization
- [ ] Mobile responsive

## 🎨 Customization

### Change Pricing Formula
Edit `backend/server.js` line 60:

```javascript
const pricingConfig = {
  materialRate: 18,  // ₹ per gram
  timeRate: 70,      // ₹ per hour
  labour: 50,        // ₹ fixed
  profit: 150        // ₹ fixed
};
```

### Change Colors
Edit `3d-invenza-frontend/src/styles/global.css`:

```css
:root {
  --accent: #3bf2ff;  /* Change this */
}
```

## 🚀 Deployment

### Frontend (Netlify/Vercel):
```bash
npm run build
# Upload build/ folder
```

### Backend (Heroku/Railway):
```bash
# Push to Git
# Connect to hosting platform
```

## 📞 Support

For questions, contact: hello@3dinvenza.com