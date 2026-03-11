import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  // Mock product data (in production, fetch from backend)
  const product = {
    id,
    name: "Custom Phone Stand",
    description: "Ergonomic phone stand with integrated cable management. Perfect viewing angle for video calls and content consumption.",
    price: 299,
    material: "PLA+",
    color: "Black",
    dimensions: "120 x 80 x 100 mm",
    weight: "45g",
    image: "https://via.placeholder.com/500x500/1a1a2e/3bf2ff?text=Phone+Stand"
  };

  const handleAddToCart = () => {
    alert(`Added ${quantity}x ${product.name} to cart!\n\nIn production, this will add to cart and redirect to checkout.`);
  };

  return (
    <div className="section">
      <button onClick={() => navigate("/products")} className="btn-ghost" style={{ marginBottom: 20 }}>
        ← Back to Products
      </button>

      <div style={styles.grid}>
        <div className="card" style={styles.imageCard}>
          <img src={product.image} alt={product.name} style={styles.image} />
        </div>

        <div className="card">
          <h1 style={styles.title}>{product.name}</h1>
          <p style={styles.description}>{product.description}</p>

          <div style={styles.specs}>
            <div style={styles.specRow}>
              <span style={styles.specLabel}>Material:</span>
              <span className="chip">{product.material}</span>
            </div>
            <div style={styles.specRow}>
              <span style={styles.specLabel}>Color:</span>
              <span className="chip">{product.color}</span>
            </div>
            <div style={styles.specRow}>
              <span style={styles.specLabel}>Dimensions:</span>
              <span>{product.dimensions}</span>
            </div>
            <div style={styles.specRow}>
              <span style={styles.specLabel}>Weight:</span>
              <span>{product.weight}</span>
            </div>
          </div>

          <div style={styles.priceSection}>
            <span style={styles.price}>₹ {product.price}</span>
            <span style={styles.priceLabel}>per unit</span>
          </div>

          <div style={styles.quantitySection}>
            <label style={styles.label}>Quantity:</label>
            <div style={styles.quantityControl}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityBtn}
              >
                -
              </button>
              <span style={styles.quantityValue}>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={styles.quantityBtn}
              >
                +
              </button>
            </div>
          </div>

          <div style={styles.totalSection}>
            <span style={styles.totalLabel}>Total:</span>
            <span style={styles.totalPrice}>₹ {product.price * quantity}</span>
          </div>

          <button className="btn-primary" onClick={handleAddToCart} style={{ width: "100%", marginTop: 20 }}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px"
  },
  imageCard: {
    padding: 0,
    overflow: "hidden"
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  title: {
    fontSize: "28px",
    marginBottom: "12px"
  },
  description: {
    color: "#a4afc6",
    marginBottom: "24px",
    lineHeight: 1.6
  },
  specs: {
    marginBottom: "24px"
  },
  specRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  },
  specLabel: {
    color: "#a4afc6",
    fontSize: "14px"
  },
  priceSection: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid rgba(255,255,255,0.08)"
  },
  price: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#3bf2ff"
  },
  priceLabel: {
    fontSize: "14px",
    color: "#a4afc6"
  },
  quantitySection: {
    marginTop: "20px"
  },
  label: {
    display: "block",
    marginBottom: "10px",
    fontSize: "14px",
    color: "#a4afc6"
  },
  quantityControl: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  quantityBtn: {
    width: "40px",
    height: "40px",
    border: "1px solid rgba(59, 242, 255, 0.3)",
    background: "rgba(59, 242, 255, 0.1)",
    color: "#3bf2ff",
    fontSize: "20px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  quantityValue: {
    fontSize: "20px",
    fontWeight: "600",
    minWidth: "40px",
    textAlign: "center"
  },
  totalSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "16px",
    background: "rgba(59, 242, 255, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(59, 242, 255, 0.2)"
  },
  totalLabel: {
    fontSize: "16px",
    color: "#a4afc6"
  },
  totalPrice: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#3bf2ff"
  }
};

export default ProductDetail;
