import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const orderData = location.state;

  const handlePayment = async () => {
    if (!orderData) return;
    setLoading(true);

    try {
      // 1. Create Order
      const { data } = await axios.post("http://localhost:8000/api/orders/", orderData);

      if (orderData.paymentMethod === "COD") {
        alert(`Order placed! Order ID: ${data.order.orderId}\n\nYou will pay ₹${orderData.total} on delivery.`);
        navigate(`/track?id=${data.order.orderId}`);
      } else {
        // PROTOPYPE MODE: Bypass Razorpay
        // Directly confirm payment

        // Simulating processing delay
        await new Promise(r => setTimeout(r, 1500));

        await axios.post(`http://localhost:8000/api/orders/${data.order.orderId}/pay`);

        alert(`Payment Successful! (Prototype Mode)\nOrder ID: ${data.order.orderId}`);
        navigate(`/track?id=${data.order.orderId}`);
      }
    } catch (error) {
      alert("Payment failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="section">
        <div className="card">
          <h1>Payment</h1>
          <p style={{ color: "#a4afc6", marginTop: 8 }}>No order data found. Please start from Upload.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-kicker">PAYMENT</div>
          <h1 className="section-title">{orderData.paymentMethod === "COD" ? "Confirm Order" : "Test Payment"}</h1>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Order Summary</h3>
          <div style={styles.row}>
            <span>Print cost:</span>
            <span>₹ {orderData.estimate.price}</span>
          </div>
          <div style={styles.row}>
            <span>Shipping ({orderData.shipping.speed}):</span>
            <span>₹ {orderData.shipping.cost}</span>
          </div>
          <div style={{ fontSize: 12, color: "#a4afc6", marginTop: 4, marginBottom: 12 }}>
            {orderData.shipping.courier} · {orderData.shipping.eta}
          </div>
          {orderData.codExtra > 0 && (
            <div style={styles.row}>
              <span>COD charges:</span>
              <span>₹ {orderData.codExtra}</span>
            </div>
          )}
          <div style={{ ...styles.row, marginTop: 16, paddingTop: 16, borderTop: "2px solid rgba(59,242,255,0.3)", fontSize: 18, fontWeight: 600 }}>
            <span>Total:</span>
            <span style={{ color: "#3bf2ff", fontSize: 22 }}>₹ {orderData.total}</span>
          </div>

          {orderData.paymentMethod === "COD" ? (
            <>
              <div style={{ marginTop: 20, padding: 16, background: "rgba(59,242,255,0.1)", borderRadius: 12, border: "1px solid rgba(59,242,255,0.3)" }}>
                <p style={{ fontSize: 14, marginBottom: 8 }}>💵 Cash on Delivery</p>
                <p style={{ fontSize: 13, color: "#a4afc6" }}>You will pay ₹{orderData.total} to the courier on delivery.</p>
              </div>
              <button className="btn-primary" onClick={handlePayment} disabled={loading} style={{ width: "100%", marginTop: 20 }}>
                {loading ? "Processing..." : "Confirm Order"}
              </button>
            </>
          ) : (
            <>
              <div style={{ marginTop: 20, padding: 16, background: "rgba(59,242,255,0.1)", borderRadius: 12, border: "1px solid rgba(59,242,255,0.3)" }}>
                <p style={{ fontSize: 14, marginBottom: 8 }}>💳 Online Payment (Test Mode)</p>
                <p style={{ fontSize: 13, color: "#a4afc6" }}>Click below to simulate a successful payment.</p>
              </div>
              <button className="btn-primary" onClick={handlePayment} disabled={loading} style={{ width: "100%", marginTop: 20 }}>
                {loading ? "Processing..." : "Simulate Payment (₹" + orderData.total + ")"}
              </button>
              <p style={{ fontSize: 12, color: "#a4afc6", marginTop: 12, textAlign: "center" }}>Test Mode Enabled (No actual payment)</p>
            </>
          )}
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Delivery Address</h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#a4afc6" }}>
            {orderData.customer.name}<br />
            {orderData.customer.address}<br />
            {orderData.customer.city}, {orderData.customer.pincode}<br />
            {orderData.customer.phone}
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontSize: 14
  }
};

export default Payment;