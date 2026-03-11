// src/constants/pricing.js
export const PRICING_CONFIG = {
  MATERIAL_RATE: 10, // ₹10 per gram
  TIME_RATE: 50, // ₹50 per hour (electricity)
  LABOUR_COST: 50, // ₹50 flat
  MINIMUM_PRICE: 99, // ₹99 minimum
  PLA_DENSITY: 1.24, // g/cm³
  PRINT_SPEED: 8, // grams per hour
};

export const SHIPPING_CONFIG = {
  PICKUP_PINCODE: "360005",
  LOCAL_ZONES: ["360"],
  STATE_ZONES: ["380", "390", "370", "361", "362", "363", "364", "365", "383", "384", "385"],
  RATES: {
    LOCAL: { cost: 29, text: "Local shipping · 2–4 days" },
    STATE: { cost: 49, text: "Same state · 4–6 days" },
    NATIONAL: { cost: 69, text: "National delivery · 5–8 days" },
    REMOTE: { cost: 99, text: "Remote area · 7–10 days" }
  }
};

export const MATERIALS = {
  PLA: { name: "PLA", density: 1.24, multiplier: 1.0 },
  ABS: { name: "ABS", density: 1.04, multiplier: 1.15 },
  PETG: { name: "PETG", density: 1.27, multiplier: 1.2 },
  TPU: { name: "TPU", density: 1.2, multiplier: 1.3 }
};