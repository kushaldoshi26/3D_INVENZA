import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class ShiprocketAPI {
  constructor() {
    this.baseURL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in';
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.pickupPin = process.env.SHIPROCKET_PICKUP_PIN || '360005';
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await axios.post(`${this.baseURL}/v1/external/auth/login`, {
        email: this.email,
        password: this.password
      });

      this.token = response.data.token;
      this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours
      
      return this.token;
    } catch (error) {
      console.error('Shiprocket auth failed:', error.response?.data || error.message);
      throw new Error('Shiprocket authentication failed');
    }
  }

  async getServiceability(destinationPin, weightGrams, cod = false) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.get(`${this.baseURL}/v1/external/courier/serviceability/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          pickup_postcode: this.pickupPin,
          delivery_postcode: destinationPin,
          weight: Math.max(0.5, weightGrams / 1000), // Convert to kg, min 0.5kg
          cod: cod ? 1 : 0
        }
      });

      return response.data;
    } catch (error) {
      console.error('Shiprocket serviceability check failed:', error.response?.data || error.message);
      return null;
    }
  }

  async getRates(destinationPin, weightGrams, cod = false) {
    try {
      const serviceability = await this.getServiceability(destinationPin, weightGrams, cod);
      
      if (!serviceability || !serviceability.data || !serviceability.data.available_courier_companies) {
        return null;
      }

      const couriers = serviceability.data.available_courier_companies;
      
      // Find best rates
      const standardCouriers = couriers.filter(c => 
        c.courier_name && 
        c.rate && 
        c.estimated_delivery_days &&
        !c.courier_name.toLowerCase().includes('express') &&
        !c.courier_name.toLowerCase().includes('premium')
      );

      const expressCouriers = couriers.filter(c => 
        c.courier_name && 
        c.rate && 
        c.estimated_delivery_days &&
        (c.courier_name.toLowerCase().includes('express') || 
         c.courier_name.toLowerCase().includes('premium') ||
         c.estimated_delivery_days <= 2)
      );

      // Get best standard option
      const bestStandard = standardCouriers.length > 0 
        ? standardCouriers.reduce((best, current) => 
            current.rate < best.rate ? current : best
          )
        : couriers.reduce((best, current) => 
            current.rate < best.rate ? current : best
          );

      // Get best express option
      const bestExpress = expressCouriers.length > 0
        ? expressCouriers.reduce((best, current) => 
            current.rate < best.rate ? current : best
          )
        : couriers.reduce((best, current) => 
            current.estimated_delivery_days < best.estimated_delivery_days ? current : best
          );

      const codCharge = cod ? 30 : 0;

      return {
        standard: {
          name: `${bestStandard.courier_name} Standard`,
          charge: Math.round(bestStandard.rate) + codCharge,
          eta: `${bestStandard.estimated_delivery_days} days`,
          courier: bestStandard.courier_name,
          courierCompanyId: bestStandard.courier_company_id
        },
        fast: {
          name: `${bestExpress.courier_name} Express`,
          charge: Math.round(bestExpress.rate) + codCharge,
          eta: `${bestExpress.estimated_delivery_days} days`,
          courier: bestExpress.courier_name,
          courierCompanyId: bestExpress.courier_company_id
        },
        cod: {
          enabled: cod,
          extraCharge: codCharge
        },
        allOptions: couriers.map(c => ({
          name: c.courier_name,
          rate: Math.round(c.rate) + codCharge,
          eta: `${c.estimated_delivery_days} days`,
          courierCompanyId: c.courier_company_id
        }))
      };

    } catch (error) {
      console.error('Shiprocket rates failed:', error.message);
      return null;
    }
  }

  async createOrder(orderData) {
    try {
      const token = await this.authenticate();
      
      const shiprocketOrder = {
        order_id: orderData.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: "Primary",
        billing_customer_name: orderData.customer.name,
        billing_last_name: "",
        billing_address: orderData.customer.address,
        billing_city: orderData.customer.city,
        billing_pincode: orderData.customer.pincode,
        billing_state: this.getStateFromPincode(orderData.customer.pincode),
        billing_country: "India",
        billing_email: orderData.customer.email,
        billing_phone: orderData.customer.phone,
        shipping_is_billing: true,
        order_items: [{
          name: `3D Print - ${orderData.fileName || 'Custom Model'}`,
          sku: orderData.fileId,
          units: 1,
          selling_price: orderData.estimate.price,
          discount: 0,
          tax: 0,
          hsn: 39269099
        }],
        payment_method: orderData.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        sub_total: orderData.estimate.price,
        length: 15,
        breadth: 15,
        height: 10,
        weight: Math.max(0.5, orderData.estimate.weightGrams / 1000)
      };

      const response = await axios.post(`${this.baseURL}/v1/external/orders/create/adhoc`, 
        shiprocketOrder,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error) {
      console.error('Shiprocket order creation failed:', error.response?.data || error.message);
      throw error;
    }
  }

  getStateFromPincode(pincode) {
    const stateMap = {
      '1': 'Delhi', '2': 'Haryana', '3': 'Punjab', '4': 'Chandigarh',
      '11': 'Delhi', '12': 'Haryana', '13': 'Punjab', '14': 'Haryana',
      '15': 'Punjab', '16': 'Chandigarh', '17': 'Himachal Pradesh',
      '18': 'Himachal Pradesh', '19': 'Jammu and Kashmir',
      '24': 'Uttar Pradesh', '25': 'Uttar Pradesh', '26': 'Uttar Pradesh',
      '27': 'Uttar Pradesh', '28': 'Uttar Pradesh',
      '30': 'Rajasthan', '31': 'Rajasthan', '32': 'Rajasthan',
      '33': 'Rajasthan', '34': 'Rajasthan',
      '36': 'Gujarat', '37': 'Gujarat', '38': 'Gujarat', '39': 'Gujarat',
      '40': 'Maharashtra', '41': 'Maharashtra', '42': 'Maharashtra',
      '43': 'Maharashtra', '44': 'Maharashtra',
      '50': 'Telangana', '51': 'Andhra Pradesh', '52': 'Andhra Pradesh',
      '53': 'Andhra Pradesh', '56': 'Karnataka', '57': 'Karnataka',
      '58': 'Karnataka', '59': 'Karnataka',
      '60': 'Tamil Nadu', '61': 'Tamil Nadu', '62': 'Tamil Nadu',
      '63': 'Tamil Nadu', '64': 'Tamil Nadu',
      '67': 'Kerala', '68': 'Kerala', '69': 'Kerala',
      '70': 'West Bengal', '71': 'West Bengal', '72': 'West Bengal',
      '73': 'West Bengal', '74': 'West Bengal',
      '75': 'Odisha', '76': 'Odisha', '77': 'Odisha',
      '80': 'Bihar', '81': 'Bihar', '82': 'Bihar', '83': 'Bihar', '84': 'Bihar',
      '90': 'Assam', '91': 'Assam', '92': 'Assam', '93': 'Assam', '94': 'Assam'
    };
    
    const prefix = pincode.substring(0, 2);
    return stateMap[prefix] || 'Gujarat'; // Default to Gujarat
  }
}

// Export singleton instance
const shiprocketAPI = new ShiprocketAPI();

export const getShippingRates = async (destinationPin, weightGrams, cod = false) => {
  return await shiprocketAPI.getRates(destinationPin, weightGrams, cod);
};

export const createShiprocketOrder = async (orderData) => {
  return await shiprocketAPI.createOrder(orderData);
};

export default shiprocketAPI;