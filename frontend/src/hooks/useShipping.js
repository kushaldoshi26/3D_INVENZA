// src/hooks/useShipping.js
import { useState } from 'react';
import { calculateShipping } from '../utils/shipping';

export const useShipping = () => {
  const [pincode, setPincode] = useState('');
  const [shipping, setShipping] = useState({ cost: 0, text: 'Enter pincode' });
  const [loading, setLoading] = useState(false);

  const handlePincodeChange = async (pin, weight = 200) => {
    setPincode(pin);
    
    if (pin.length === 6) {
      setLoading(true);
      setShipping({ cost: 0, text: 'Calculating...' });
      
      const result = await calculateShipping(pin, weight);
      setShipping(result);
      setLoading(false);
    } else {
      setShipping({ cost: 0, text: 'Enter pincode' });
    }
  };

  const reset = () => {
    setPincode('');
    setShipping({ cost: 0, text: 'Enter pincode' });
    setLoading(false);
  };

  return {
    pincode,
    shipping,
    loading,
    handlePincodeChange,
    reset
  };
};