import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import db, { loadDatabase, saveDatabase } from "./database.js";
import { getShippingRates } from "./shiprocket-enhanced.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Load persistent database
loadDatabase();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

// Storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".stl", ".obj", ".3mf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only STL, OBJ, 3MF files allowed"));
    }
  }
});

// Use persistent database
const users = db.users;
const orders = db.orders;
const products = db.products;
const pricingConfig = db.pricingConfig;

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
};

// Volume-based pricing calculator
function calculatePrice({ volumeCm3, weightGrams, printHours, material = "PLA" }) {
  const materialRate = pricingConfig.materialRate || 18; // ₹18 per gram
  const timeRate = pricingConfig.timeRate || 50; // ₹50 per hour
  const labourProfit = pricingConfig.labourProfit || 150; // ₹150 flat
  
  const materialCost = Math.round(weightGrams * materialRate);
  const timeCost = Math.round(printHours * timeRate);
  let totalPrice = materialCost + timeCost + labourProfit;

  // Material multipliers
  if (material === "PETG") totalPrice *= 1.2;
  if (material === "TPU") totalPrice *= 1.3;
  if (material === "ABS") totalPrice *= 1.15;

  // Minimum price
  return Math.max(99, Math.round(totalPrice));
}

// ===== AUTH ROUTES =====
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuid(),
    email,
    password: hashedPassword,
    name,
    role: "user",
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveDatabase();
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "7d" }
  );

  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "7d" }
  );

  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// ===== UPLOAD & QUOTE =====
app.post("/api/upload-model", upload.single("model"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Fallback estimation (file size based) - frontend will override with real volume
  const sizeKb = req.file.size / 1024;
  const estimatedVolume = Math.max(1, sizeKb * 0.01); // rough estimate
  const density = 1.24; // PLA density g/cm³
  const speedCm3PerHour = 12; // print speed
  
  const weightGrams = estimatedVolume * density;
  const printHours = Math.max(0.1, estimatedVolume / speedCm3PerHour);
  
  const materialRate = 18;
  const timeRate = 50;
  const labourProfit = 150;
  
  const materialCost = Math.round(weightGrams * materialRate);
  const timeCost = Math.round(printHours * timeRate);
  const price = Math.max(99, materialCost + timeCost + labourProfit);

  res.json({
    fileName: req.file.originalname,
    fileId: req.file.filename,
    filePath: `/uploads/${req.file.filename}`,
    sizeKB: +sizeKb.toFixed(2),
    estimate: {
      volumeCm3: +estimatedVolume.toFixed(1),
      weightGrams: +weightGrams.toFixed(1),
      printHours: +printHours.toFixed(2),
      material: req.body.material || "PLA",
      materialCost,
      timeCost,
      labourProfit,
      price
    }
  });
});

// ===== ORDERS =====
app.post("/api/orders", (req, res) => {
  const { customer, estimate, fileId, items, shipping, paymentMethod, codExtra } = req.body;

  const orderId = "INV-" + uuid().slice(0, 8).toUpperCase();

  const order = {
    orderId,
    fileId,
    customer,
    estimate,
    shipping: shipping || null,
    items: items || [],
    paymentMethod: paymentMethod || "PREPAID",
    codExtra: codExtra || 0,
    status: paymentMethod === "COD" ? "COD_PENDING" : "PENDING",
    paymentStatus: paymentMethod === "COD" ? "COD" : "UNPAID",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.push(order);
  saveDatabase();
  res.json({ success: true, order });
});

app.get("/api/orders/:orderId", (req, res) => {
  const order = orders.find(o => o.orderId === req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

app.get("/api/orders", authMiddleware, (req, res) => {
  const userOrders = orders.filter(o => o.customer?.email === req.user.email);
  res.json(userOrders);
});

// ===== ADMIN ROUTES =====
app.get("/api/admin/orders", authMiddleware, adminMiddleware, (req, res) => {
  res.json(orders);
});

app.patch("/api/admin/orders/:orderId", authMiddleware, adminMiddleware, (req, res) => {
  const order = orders.find(o => o.orderId === req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  Object.assign(order, req.body, { updatedAt: new Date().toISOString() });
  saveDatabase();
  res.json(order);
});

app.get("/api/admin/pricing", authMiddleware, adminMiddleware, (req, res) => {
  res.json(pricingConfig);
});

app.patch("/api/admin/pricing", authMiddleware, adminMiddleware, (req, res) => {
  Object.assign(pricingConfig, req.body);
  saveDatabase();
  res.json(pricingConfig);
});

// Products
app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/admin/products", authMiddleware, adminMiddleware, (req, res) => {
  const product = {
    id: uuid(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  products.push(product);
  saveDatabase();
  res.json(product);
});

// Fallback shipping calculator (works without API)
function calculateFallbackShipping(fromPin, toPin, weightGrams, cod = false) {
  const weight = Math.max(250, weightGrams); // minimum 250g
  
  // Gujarat local zones (from 360005 Rajkot)
  const localZones = ['360', '361', '362', '363', '364', '365', '380', '382', '383', '384', '385'];
  const stateZones = ['390', '391', '392', '393', '394', '395', '396', '397', '398', '399'];
  
  let baseRate = 40;
  let eta = "4-6 days";
  
  if (localZones.some(prefix => toPin.startsWith(prefix))) {
    baseRate = 29;
    eta = "2-4 days";
  } else if (stateZones.some(prefix => toPin.startsWith(prefix))) {
    baseRate = 49;
    eta = "3-5 days";
  } else if (/^[1-9]\d{5}$/.test(toPin)) {
    // Major cities
    const majorCities = ['110', '400', '560', '600', '700', '500', '411', '302', '201', '121'];
    if (majorCities.some(prefix => toPin.startsWith(prefix))) {
      baseRate = 59;
      eta = "3-5 days";
    } else {
      baseRate = 69;
      eta = "5-8 days";
    }
  } else {
    baseRate = 99;
    eta = "7-10 days";
  }
  
  // Weight-based pricing
  const weightMultiplier = Math.ceil(weight / 500); // per 500g
  const standardRate = Math.round(baseRate * weightMultiplier);
  const fastRate = Math.round(standardRate * 1.4);
  
  return {
    standard: {
      name: "Standard Delivery",
      charge: standardRate,
      eta: eta
    },
    fast: {
      name: "Express Delivery", 
      charge: fastRate,
      eta: eta.replace(/\d+-/, (match) => Math.max(1, parseInt(match) - 2) + "-")
    },
    cod: {
      enabled: cod,
      extraCharge: cod ? 30 : 0
    }
  };
}

// ===== SHIPPING ROUTES =====
app.post("/api/shipping/rate", async (req, res) => {
  const { destinationPincode, weightGrams, cod } = req.body;

  if (!destinationPincode || !weightGrams) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Try Shiprocket API first (if credentials are configured)
  if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
    try {
      const rates = await getShippingRates(destinationPincode, weightGrams, cod);
      if (rates) {
        return res.json(rates);
      }
    } catch (error) {
      console.log("Shiprocket API failed, using fallback:", error.message);
    }
  }
  
  // Fallback to pincode-based calculation
  const pickupPin = process.env.SHIPROCKET_PICKUP_PIN || "360005";
  const fallbackRates = calculateFallbackShipping(pickupPin, destinationPincode, weightGrams, cod);
  res.json(fallbackRates);
});

// ===== PAYMENT ROUTES =====
app.post("/api/payment/create-order", async (req, res) => {
  const { amount, orderId } = req.body;

  // For now, return mock data for testing
  // In production, integrate with Razorpay:
  // const Razorpay = require('razorpay');
  // const razorpay = new Razorpay({
  //   key_id: process.env.RAZORPAY_KEY_ID,
  //   key_secret: process.env.RAZORPAY_KEY_SECRET
  // });
  // const order = await razorpay.orders.create({
  //   amount: amount * 100,
  //   currency: 'INR',
  //   receipt: orderId
  // });

  res.json({
    id: "order_" + uuid().slice(0, 14),
    amount: amount * 100,
    currency: "INR",
    key: process.env.RAZORPAY_KEY_ID || "rzp_test_demo",
    orderId: orderId
  });
});

// Health & shipping test
app.get("/", (req, res) => {
  res.json({ ok: true, message: "3D INVENZA backend running" });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    ok: true, 
    message: "3D INVENZA API ready",
    shiprocket: !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD),
    pickup: process.env.SHIPROCKET_PICKUP_PIN || "360005"
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`3D INVENZA backend running on port ${PORT}`);
});