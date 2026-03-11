// src/utils/pricing.js
import { PRICING_CONFIG, MATERIALS } from '../constants/pricing';

export const calculatePricing = (volumeCm3, weightGrams, printHours, material = 'PLA') => {
  const materialMultiplier = MATERIALS[material]?.multiplier || 1.0;
  
  const materialCost = Math.round(weightGrams * PRICING_CONFIG.MATERIAL_RATE);
  const timeCost = Math.round(printHours * PRICING_CONFIG.TIME_RATE);
  const baseCost = materialCost + timeCost + PRICING_CONFIG.LABOUR_COST;
  
  // Apply 45% markup
  const totalPrice = Math.round(baseCost * 1.45 * materialMultiplier);
  const finalPrice = Math.max(PRICING_CONFIG.MINIMUM_PRICE, totalPrice);

  return {
    volumeCm3: +volumeCm3.toFixed(1),
    weightGrams: +weightGrams.toFixed(1),
    printHours: +printHours.toFixed(2),
    material,
    materialCost,
    timeCost,
    labour: PRICING_CONFIG.LABOUR_COST,
    price: finalPrice
  };
};

export const estimateFromFile = (file) => {
  const sizeKB = file.size / 1024;
  const weightGrams = Math.max(3, Math.round(sizeKB * 0.4));
  const printHours = Math.max(0.5, weightGrams / PRICING_CONFIG.PRINT_SPEED);
  const volumeCm3 = weightGrams / PRICING_CONFIG.PLA_DENSITY;
  
  return calculatePricing(volumeCm3, weightGrams, printHours);
};