// Example Shiprocket API integration for 3D INVENZA
// This shows how to integrate real shipping rates

import axios from 'axios';

// Shiprocket API configuration
const SHIPROCKET_CONFIG = {
  baseURL: 'https://apiv2.shiprocket.in/v1/external',
  email: process.env.SHIPROCKET_EMAIL,
  password: process.env.SHIPROCKET_PASSWORD,
  pickupPincode: '360005' // Rajkot, Gujarat
};

let authToken = null;
let tokenExpiry = null;

// Get authentication token
async function getAuthToken() {
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken;
  }

  try {
    const response = await axios.post(`${SHIPROCKET_CONFIG.baseURL}/auth/login`, {
      email: SHIPROCKET_CONFIG.email,
      password: SHIPROCKET_CONFIG.password
    });

    authToken = response.data.token;
    tokenExpiry = Date.now() + (10 * 60 * 60 * 1000); // 10 hours
    return authToken;
  } catch (error) {
    console.error('Shiprocket auth failed:', error.message);
    throw new Error('Failed to authenticate with Shiprocket');
  }
}

// Get shipping rates
export async function getShippingRates(destinationPincode, weightGrams, cod = false) {
  try {
    const token = await getAuthToken();
    
    const response = await axios.post(
      `${SHIPROCKET_CONFIG.baseURL}/courier/serviceability`,
      {
        pickup_postcode: SHIPROCKET_CONFIG.pickupPincode,
        delivery_postcode: destinationPincode,
        cod: cod ? 1 : 0,
        weight: Math.max(0.25, weightGrams / 1000), // minimum 250g
        length: 10,
        breadth: 10,
        height: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const companies = response.data.available_courier_companies;
    
    if (!companies || companies.length === 0) {
      throw new Error('No courier services available');
    }

    // Find cheapest and fastest options
    const cheapest = companies.reduce((min, curr) => 
      curr.rate < min.rate ? curr : min
    );
    
    const fastest = companies.reduce((min, curr) => {
      const currDays = parseInt(curr.etd.split('-')[0]);
      const minDays = parseInt(min.etd.split('-')[0]);
      return currDays < minDays ? curr : min;
    });

    return {
      standard: {
        name: cheapest.courier_name,
        charge: Math.round(cheapest.rate),
        eta: cheapest.etd
      },
      fast: {
        name: fastest.courier_name,
        charge: Math.round(fastest.rate),
        eta: fastest.etd
      },
      cod: {
        enabled: cod,
        extraCharge: cod ? 30 : 0
      }
    };

  } catch (error) {
    console.error('Shiprocket API error:', error.message);
    return null; // Will fallback to local calculation
  }
}

// Create shipment (for actual order fulfillment)
export async function createShipment(orderData) {
  try {
    const token = await getAuthToken();
    
    const shipmentData = {
      order_id: orderData.orderId,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: "Primary",
      billing_customer_name: orderData.customer.name,
      billing_last_name: "",
      billing_address: orderData.customer.address,
      billing_city: orderData.customer.city,
      billing_pincode: orderData.customer.pincode,
      billing_state: "Gujarat",
      billing_country: "India",
      billing_email: orderData.customer.email,
      billing_phone: orderData.customer.phone,
      shipping_is_billing: true,
      order_items: [{
        name: "3D Printed Model",
        sku: orderData.fileId,
        units: 1,
        selling_price: orderData.estimate.price,
        discount: 0,
        tax: 0,
        hsn: 39269099
      }],
      payment_method: orderData.paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: orderData.estimate.price,
      length: 10,
      breadth: 10,
      height: 10,
      weight: Math.max(0.25, orderData.estimate.weightGrams / 1000)
    };

    const response = await axios.post(
      `${SHIPROCKET_CONFIG.baseURL}/orders/create/adhoc`,
      shipmentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      shipmentId: response.data.shipment_id,
      orderId: response.data.order_id,
      awbCode: response.data.awb_code,
      courierName: response.data.courier_name
    };

  } catch (error) {
    console.error('Shipment creation failed:', error.message);
    throw new Error('Failed to create shipment');
  }
}

// Track shipment
export async function trackShipment(awbCode) {
  try {
    const token = await getAuthToken();
    
    const response = await axios.get(
      `${SHIPROCKET_CONFIG.baseURL}/courier/track/awb/${awbCode}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data.tracking_data;
  } catch (error) {
    console.error('Tracking failed:', error.message);
    return null;
  }
}

/* 
SETUP INSTRUCTIONS:

1. Create Shiprocket account at https://shiprocket.in
2. Go to Settings > API and generate credentials
3. Add to your .env file:
   SHIPROCKET_EMAIL=your-email@example.com
   SHIPROCKET_PASSWORD=your-password

4. Test the integration:
   node -e "
   import('./shipping-api-example.js').then(m => 
     m.getShippingRates('400001', 200).then(console.log)
   )
   "

5. For production, also set up:
   - Pickup locations in Shiprocket dashboard
   - Webhook URLs for tracking updates
   - Return/RTO handling
*/