// src/hooks/useFileUpload.js
import { useState } from 'react';
import { estimateFromFile } from '../utils/pricing';

export const useFileUpload = () => {
  const [file, setFile] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (selectedFile) => {
    if (!selectedFile) return;
    
    setLoading(true);
    setFile(selectedFile);
    
    // Calculate estimate
    const pricing = estimateFromFile(selectedFile);
    setEstimate({
      fileName: selectedFile.name,
      sizeKB: +(selectedFile.size / 1024).toFixed(2),
      estimate: pricing
    });
    
    setLoading(false);
  };

  const updateEstimate = (newEstimate) => {
    setEstimate(prev => ({
      ...prev,
      estimate: newEstimate
    }));
  };

  const reset = () => {
    setFile(null);
    setEstimate(null);
    setLoading(false);
  };

  return {
    file,
    estimate,
    loading,
    handleFileUpload,
    updateEstimate,
    reset
  };
};