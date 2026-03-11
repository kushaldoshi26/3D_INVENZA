import React, { useState } from "react";
import { shipping } from "../api";

const ShippingTest = () => {
  const [pincode, setPincode] = useState("");
  const [weight, setWeight] = useState(200);
  const [cod, setCod] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testShipping = async () => {
    if (!pincode || pincode.length !== 6) {
      alert("Enter valid 6-digit pincode");
      return;
    }

    setLoading(true);
    try {
      const { data } = await shipping.getRate({
        destinationPincode: pincode,
        weightGrams: weight,
        cod: cod
      });
      setResult(data);
    } catch (error) {
      alert("Error: " + error.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-kicker">SHIPPING TEST</div>
          <h1 className="section-title">Test Shipping Calculator</h1>
          <p className="section-description">
            Test shipping rates from Rajkot (360005) to any pincode in India
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 30 }}>
        <div className="card">
          <h3>Test Parameters</h3>
          <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
            <div>
              <label>Delivery Pincode</label>
              <input 
                type="text" 
                placeholder="e.g. 400001 (Mumbai)"
                maxLength="6"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>
            <div>
              <label>Weight (grams)</label>
              <input 
                type="number" 
                min="50"
                max="5000"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={cod}
                  onChange={(e) => setCod(e.target.checked)}
                />
                Cash on Delivery (COD)
              </label>
            </div>
            <button 
              className="btn-primary" 
              onClick={testShipping}
              disabled={loading}
            >
              {loading ? "Calculating..." : "Get Shipping Rate"}
            </button>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "rgba(59,242,255,0.05)", borderRadius: 8, fontSize: 13 }}>
            <strong>Test Examples:</strong>
            <div style={{ marginTop: 8, color: "#a4afc6" }}>
              • 360001 (Rajkot Local) → ₹29<br/>
              • 380001 (Ahmedabad) → ₹49<br/>
              • 400001 (Mumbai) → ₹59<br/>
              • 110001 (Delhi) → ₹59<br/>
              • 560001 (Bangalore) → ₹59<br/>
              • 700001 (Kolkata) → ₹59<br/>
              • 123456 (Remote) → ₹99
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Shipping Results</h3>
          {result ? (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{result.standard.name}</div>
                      <div style={{ fontSize: 12, color: "#a4afc6", marginTop: 4 }}>
                        {result.standard.eta}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#3bf2ff" }}>
                      ₹{result.standard.charge}
                    </div>
                  </div>
                </div>

                <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{result.fast.name}</div>
                      <div style={{ fontSize: 12, color: "#a4afc6", marginTop: 4 }}>
                        {result.fast.eta}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#ff6b35" }}>
                      ₹{result.fast.charge}
                    </div>
                  </div>
                </div>

                {result.cod.enabled && (
                  <div style={{ padding: 12, background: "rgba(255,165,0,0.1)", borderRadius: 8, border: "1px solid rgba(255,165,0,0.3)" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>COD Charges: ₹{result.cod.extraCharge}</div>
                    <div style={{ fontSize: 12, color: "#a4afc6", marginTop: 4 }}>
                      Additional charges for Cash on Delivery
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20, padding: 16, background: "rgba(59,242,255,0.1)", borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Calculation Details:</div>
                <div style={{ fontSize: 12, color: "#a4afc6" }}>
                  From: 360005 (Rajkot, Gujarat)<br/>
                  To: {pincode}<br/>
                  Weight: {weight}g<br/>
                  Payment: {cod ? "Cash on Delivery" : "Prepaid"}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 20, textAlign: "center", color: "#a4afc6" }}>
              Enter pincode and click "Get Shipping Rate" to see results
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingTest;