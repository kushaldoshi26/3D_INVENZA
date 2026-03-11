import React, { useState, useEffect } from "react";

export default function ModelValidator({ file, onValidation }) {
  const [validation, setValidation] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!file) return;
    
    setAnalyzing(true);
    
    // Simulate intelligent validation
    setTimeout(() => {
      const fileSize = file.size;
      const fileName = file.name.toLowerCase();
      
      const issues = [];
      const warnings = [];
      const suggestions = [];
      
      // File size validation
      if (fileSize > 50 * 1024 * 1024) { // 50MB
        issues.push("File too large (>50MB). Consider reducing mesh density.");
      }
      
      // File type validation
      if (!fileName.endsWith('.stl') && !fileName.endsWith('.obj') && !fileName.endsWith('.3mf')) {
        issues.push("Unsupported file format. Use STL, OBJ, or 3MF.");
      }
      
      // Intelligent suggestions based on file characteristics
      if (fileSize < 100 * 1024) { // <100KB
        warnings.push("Very small file - may lack detail for quality printing.");
        suggestions.push("Consider increasing mesh resolution for better surface finish.");
      }
      
      if (fileName.includes('miniature') || fileName.includes('figure')) {
        suggestions.push("For miniatures: Recommend 0.1mm layer height and supports.");
      }
      
      if (fileName.includes('functional') || fileName.includes('mechanical')) {
        suggestions.push("For functional parts: Consider PETG material for durability.");
      }
      
      // Auto-recommendations
      const autoSettings = {
        material: fileName.includes('outdoor') ? 'PETG' : 'PLA+',
        infill: fileName.includes('functional') ? '30%' : '15%',
        layerHeight: fileName.includes('miniature') ? '0.1mm' : '0.2mm',
        supports: fileName.includes('overhang') || fileName.includes('bridge') ? 'Auto' : 'None'
      };
      
      const result = {
        status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'good',
        issues,
        warnings,
        suggestions,
        autoSettings,
        printable: issues.length === 0
      };
      
      setValidation(result);
      setAnalyzing(false);
      
      if (onValidation) {
        onValidation(result);
      }
    }, 1500);
  }, [file]);

  if (!file) return null;

  return (
    <div className="card" style={{ marginTop: 16, border: validation?.status === 'error' ? '1px solid #ff6b35' : '1px solid rgba(59,242,255,0.3)' }}>
      <h3 style={{ color: '#3bf2ff', marginBottom: 16 }}>🤖 AI Model Analysis</h3>
      
      {analyzing && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
          <div>Analyzing model for printability...</div>
        </div>
      )}
      
      {validation && (
        <div>
          {/* Status */}
          <div style={{ 
            padding: 12, 
            borderRadius: 8, 
            background: validation.status === 'good' ? 'rgba(0,255,0,0.1)' : 
                       validation.status === 'warning' ? 'rgba(255,165,0,0.1)' : 'rgba(255,0,0,0.1)',
            marginBottom: 16
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {validation.status === 'good' && '✅ Model looks good for printing!'}
              {validation.status === 'warning' && '⚠️ Model has minor issues'}
              {validation.status === 'error' && '❌ Model has critical issues'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {validation.printable ? 'Ready for production' : 'Needs fixes before printing'}
            </div>
          </div>

          {/* Issues */}
          {validation.issues.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: '#ff6b35', marginBottom: 8 }}>Critical Issues:</div>
              {validation.issues.map((issue, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>❌ {issue}</div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: '#ffa500', marginBottom: 8 }}>Warnings:</div>
              {validation.warnings.map((warning, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>⚠️ {warning}</div>
              ))}
            </div>
          )}

          {/* AI Suggestions */}
          {validation.suggestions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: '#3bf2ff', marginBottom: 8 }}>AI Suggestions:</div>
              {validation.suggestions.map((suggestion, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>💡 {suggestion}</div>
              ))}
            </div>
          )}

          {/* Auto Settings */}
          <div style={{ 
            padding: 12, 
            background: 'rgba(59,242,255,0.1)', 
            borderRadius: 8,
            border: '1px solid rgba(59,242,255,0.3)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>🎯 Recommended Settings:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>Material: <strong>{validation.autoSettings.material}</strong></div>
              <div>Infill: <strong>{validation.autoSettings.infill}</strong></div>
              <div>Layer Height: <strong>{validation.autoSettings.layerHeight}</strong></div>
              <div>Supports: <strong>{validation.autoSettings.supports}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}