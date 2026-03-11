import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

let cachedToken = null;
let tokenExpiry = null;

export async function getShiprocketToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await axios.post(
      `${process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in"}/v1/external/auth/login`,
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD
      }
    );

    cachedToken = response.data.token;
    tokenExpiry = Date.now() + (9 * 60 * 60 * 1000); // 9 hours
    return cachedToken;
  } catch (error) {
    console.error("Shiprocket auth failed:", error.message);
    throw new Error("Failed to authenticate with Shiprocket");
  }
}

export async function getShippingRates(destinationPincode, weightGrams, cod = false) {
  const token = await getShiprocketToken();
  const weightKg = Math.max(0.25, weightGrams / 1000);

  try {
    const response = await axios.get(
      `${process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in"}/v1/external/courier/serviceability`,
      {
        params: {
          pickup_postcode: process.env.SHIPROCKET_PICKUP_PIN || "360005",
          delivery_postcode: destinationPincode,
          weight: weightKg,
          cod: cod ? 1 : 0
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const couriers = response.data.data?.available_courier_companies || [];
    
    if (couriers.length === 0) {
      return null;
    }

    const standard = couriers.reduce((min, c) => 
      c.freight_charge < min.freight_charge ? c : min
    );

    const fast = couriers.reduce((min, c) => 
      parseInt(c.etd.split("-")[0]) < parseInt(min.etd.split("-")[0]) ? c : min
    );

    return {
      standard: {
        name: standard.courier_company_id,
        charge: Math.round(standard.freight_charge),
        eta: standard.etd
      },
      fast: {
        name: fast.courier_company_id,
        charge: Math.round(fast.freight_charge),
        eta: fast.etd
      },
      cod: {
        enabled: cod,
        extraCharge: cod ? 30 : 0
      }
    };
  } catch (error) {
    console.error("Shiprocket rate fetch failed:", error.message);
    return null;
  }
}
