// src/utils/shipping.js
import { SHIPPING_CONFIG } from '../constants/pricing';

export const calculateShipping = async (pincode, weight = 200) => {
  if (!pincode || pincode.length !== 6) {
    return { cost: 0, text: "Enter valid pincode" };
  }

  // Try API first
  try {
    const response = await fetch('/api/shipping/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickup_postcode: SHIPPING_CONFIG.PICKUP_PINCODE,
        delivery_postcode: pincode,
        weight: weight / 1000,
        cod: 0
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return { cost: data.cost, text: `${data.courier} · ${data.delivery}` };
    }
  } catch (error) {
    console.log('API unavailable, using fallback');
  }
  
  // Fallback calculation
  const { LOCAL_ZONES, STATE_ZONES, RATES } = SHIPPING_CONFIG;
  
  if (LOCAL_ZONES.some(prefix => pincode.startsWith(prefix))) {
    return RATES.LOCAL;
  }
  if (STATE_ZONES.some(prefix => pincode.startsWith(prefix))) {
    return RATES.STATE;
  }
  if (/^\d{6}$/.test(pincode)) {
    return RATES.NATIONAL;
  }
  return RATES.REMOTE;
};