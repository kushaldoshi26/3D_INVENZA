# 🏗️ 3D INVENZA - Clean Project Structure

## 📁 Frontend Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Navbar.js         # Navigation bar
│   │   └── Footer.js         # Footer component
│   └── 3d/                   # 3D-specific components
│       └── Real3DSlicer.jsx  # STL viewer with clipping
├── pages/                    # Route components
│   ├── Home.js
│   ├── Upload.js            # Main upload page
│   ├── Checkout.js
│   ├── Payment.js
│   ├── AdminPanel.js
│   └── ...
├── hooks/                   # Custom React hooks
│   ├── useFileUpload.js    # File upload logic
│   └── useShipping.js      # Shipping calculations
├── utils/                  # Pure utility functions
│   ├── pricing.js         # Pricing calculations
│   └── shipping.js        # Shipping logic
├── constants/             # App constants
│   └── pricing.js        # Pricing & shipping config
├── services/             # API layer
│   └── api.js           # Centralized API service
├── styles/              # Global styles
│   └── global.css      # Main stylesheet
└── App.js              # Main app component
```

## 🎯 Key Improvements

### ✅ **Separation of Concerns**
- **Components**: Only UI rendering
- **Hooks**: State management logic
- **Utils**: Pure business logic
- **Services**: API communication
- **Constants**: Configuration values

### ✅ **Consistent Pricing**
- Single source of truth in `constants/pricing.js`
- Unified calculation in `utils/pricing.js`
- ₹18/g material rate across all components

### ✅ **Clean Architecture**
- No duplicate components
- Proper folder organization
- Reusable hooks and utilities
- Centralized API service

### ✅ **Easy Maintenance**
- Change pricing in one place
- Add new materials easily
- Modify shipping zones centrally
- Clean import paths

## 🔧 Configuration

### Pricing (constants/pricing.js)
```javascript
MATERIAL_RATE: 18,    // ₹18 per gram
TIME_RATE: 50,        // ₹50 per hour
LABOUR_COST: 50,      // ₹50 flat
PROFIT_MARGIN: 150,   // ₹150 flat
MINIMUM_PRICE: 99     // ₹99 minimum
```

### Shipping Zones
```javascript
LOCAL_ZONES: ["360"],           // ₹29
STATE_ZONES: ["380", "390"...], // ₹49
NATIONAL: All 6-digit pins,     // ₹69
REMOTE: Invalid pins            // ₹99
```

## 🚀 Usage

### File Upload
```javascript
const { file, estimate, handleFileUpload } = useFileUpload();
```

### Shipping Calculator
```javascript
const { pincode, shipping, handlePincodeChange } = useShipping();
```

### Pricing Calculation
```javascript
import { calculatePricing } from '../utils/pricing';
const pricing = calculatePricing(volumeCm3, weightGrams, printHours);
```

This structure makes the codebase maintainable, scalable, and easy to understand!