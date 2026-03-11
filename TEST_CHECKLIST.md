# 🧪 Test Your 3D INVENZA Site

## ✅ Quick Test Checklist:

### 1. Backend Health Check
- Open: http://localhost:4000
- Should see: `{"ok":true,"message":"3D INVENZA backend running"}`

### 2. Frontend Home Page
- Open: http://localhost:3000
- Should see:
  - ✅ Premium hero section
  - ✅ Animated slicer demo (moving layers + nozzle)
  - ✅ "Upload 3D Model" button
  - ✅ Feature cards

### 3. Upload Flow
1. Click "Upload 3D Model"
2. Select any STL/OBJ/3MF file
3. Should see:
   - ✅ File name
   - ✅ Estimated weight (g)
   - ✅ Print time (h)
   - ✅ Price (₹)
4. Click "Checkout"

### 4. Checkout Page
1. Fill in:
   - Name
   - Email
   - Phone
   - Address
2. Click "Continue to Payment"

### 5. Payment Page
Should see TWO options:

**Option 1: Razorpay**
- Shows order ID
- Shows amount
- "Pay with Razorpay" button
- (Will work after you add keys)

**Option 2: Direct UPI**
- Shows: `kushaldoshi26@oksbi`
- Shows QR code
- Customer can scan and pay directly

### 6. Order Tracking
1. Go to: http://localhost:3000/track
2. Enter order ID (e.g., INV-12345678)
3. Should show order status

### 7. User Signup/Login
1. Click "Sign up"
2. Create account
3. Login
4. Go to Dashboard
5. Should see "My Orders"

### 8. Admin Panel
1. Create admin user (manually in database.json):
   ```json
   {
     "email": "admin@3dinvenza.com",
     "role": "admin"
   }
   ```
2. Login as admin
3. Go to: http://localhost:3000/admin
4. Should see:
   - All orders
   - Pricing config
   - Update order status

---

## 🔴 Known Issues (Fixed):

- ✅ Payment endpoint missing → **FIXED**
- ✅ Database not persistent → **FIXED** (saves to database.json)
- ✅ Uploads folder error → **FIXED** (auto-creates)

---

## ⚠️ What Needs Manual Setup:

### Razorpay Keys (5 minutes):
1. Go to https://dashboard.razorpay.com
2. Sign up
3. Get test keys
4. Add to `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```

### Create Admin User:
1. Open `backend/database.json`
2. Find your user in "users" array
3. Change `"role": "user"` to `"role": "admin"`
4. Save file
5. Restart backend

---

## 🎯 Everything Works Except:

1. **Razorpay payment** - Needs your keys (5 min setup)
2. **Email notifications** - Not added yet
3. **3D model viewer** - Not added yet
4. **Real STL analysis** - Uses file size estimation

**But your core business flow works 100%:**
- Upload → Price → Checkout → Payment (UPI) → Order ✅

---

## 🚀 Ready to Go Live?

When you're ready to deploy to **3dinvenza.com**, just tell me:
- "deploy to production"
- "help me go live"
- "setup hosting"

I'll guide you step-by-step! 🔥
