# 3D INVENZA Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start server:
```bash
npm start
```

Server runs on: http://localhost:4000

## API Endpoints

### Auth
- POST `/api/auth/signup` - Register user
- POST `/api/auth/login` - Login user

### Upload & Quote
- POST `/api/upload-model` - Upload 3D model (multipart/form-data)

### Orders
- POST `/api/orders` - Create order
- GET `/api/orders/:orderId` - Get order by ID
- GET `/api/orders` - Get user orders (auth required)

### Admin (requires admin token)
- GET `/api/admin/orders` - All orders
- PATCH `/api/admin/orders/:orderId` - Update order
- GET `/api/admin/pricing` - Get pricing config
- PATCH `/api/admin/pricing` - Update pricing
- POST `/api/admin/products` - Add product

### Products
- GET `/api/products` - List products

## Default Admin
Create admin manually or add to users array in server.js