import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, CreditCard, Truck, User, Mail, Phone, MapPin, ChevronRight, Info } from "lucide-react";
import { orders, shipping } from "../api";

const Checkout = () => {
  const [estimate, setEstimate] = useState(null);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "", city: "", pincode: "" });
  const [paymentMethod, setPaymentMethod] = useState("PREPAID");
  const [shippingOptions, setShippingOptions] = useState(null);
  const [selectedSpeed, setSelectedSpeed] = useState("standard");
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem("checkoutData");
    if (data) {
      const parsedData = JSON.parse(data);
      setEstimate(parsedData);
      if (parsedData.shipping) {
        setShippingOptions({
          standard: {
            name: "Standard Delivery",
            charge: parsedData.shipping.cost,
            eta: parsedData.shipping.text.split(' · ')[1] || "5-8 days"
          },
          fast: {
            name: "Express Delivery",
            charge: Math.round(parsedData.shipping.cost * 1.4),
            eta: "2-4 days"
          },
          cod: {
            enabled: true,
            extraCharge: 30
          }
        });
      }
    } else {
      navigate("/upload");
    }
  }, [navigate]);

  useEffect(() => {
    if (customer.pincode.length === 6 && estimate && !shippingOptions) {
      fetchShipping();
    }
  }, [customer.pincode, paymentMethod, estimate, shippingOptions]);

  const fetchShipping = async () => {
    setLoadingShipping(true);
    try {
      const { data } = await shipping.getRate({
        destinationPincode: customer.pincode,
        weightGrams: estimate.estimate.weightGrams,
        cod: paymentMethod === "COD"
      });
      setShippingOptions(data);
    } catch (error) {
      console.log("Using fallback shipping calculation");
      const fallbackShipping = calculateFallbackShipping(customer.pincode, estimate.estimate.weightGrams, paymentMethod === "COD");
      setShippingOptions(fallbackShipping);
    } finally {
      setLoadingShipping(false);
    }
  };

  const calculateFallbackShipping = (pincode, weightGrams, cod) => {
    const weight = Math.max(250, weightGrams);
    const localZones = ['360', '361', '362', '363', '364', '365'];
    const stateZones = ['380', '382', '383', '384', '385', '390', '391', '392', '393', '394', '395'];

    let baseRate = 69;
    let eta = "5-8 days";

    if (localZones.some(prefix => pincode.startsWith(prefix))) {
      baseRate = 29;
      eta = "2-4 days";
    } else if (stateZones.some(prefix => pincode.startsWith(prefix))) {
      baseRate = 49;
      eta = "3-5 days";
    }

    const weightMultiplier = Math.ceil(weight / 500);
    const standardRate = Math.round(baseRate * weightMultiplier);
    const fastRate = Math.round(standardRate * 1.4);

    return {
      standard: { name: "Standard Delivery", charge: standardRate, eta: eta },
      fast: { name: "Express Delivery", charge: fastRate, eta: "2-3 days" },
      cod: { enabled: cod, extraCharge: cod ? 30 : 0 }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shippingOptions) return;
    setLoading(true);

    try {
      const shippingCost = selectedSpeed === "standard" ? shippingOptions.standard.charge : shippingOptions.fast.charge;
      const codExtra = paymentMethod === "COD" ? shippingOptions.cod.extraCharge : 0;
      const total = estimate.estimate.price + shippingCost + codExtra;

      navigate("/payment", {
        state: {
          customer,
          estimate: estimate.estimate,
          fileId: estimate.fileId,
          paymentMethod,
          shipping: {
            speed: selectedSpeed,
            cost: shippingCost,
            courier: selectedSpeed === "standard" ? shippingOptions.standard.name : shippingOptions.fast.name,
            eta: selectedSpeed === "standard" ? shippingOptions.standard.eta : shippingOptions.fast.eta
          },
          codExtra,
          total
        }
      });
      localStorage.removeItem("checkoutData");
    } catch (error) {
      alert("Order failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!estimate) return <div className="section min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
  </div>;

  const basePrice = estimate.estimate.price;
  const shippingCost = shippingOptions ? (selectedSpeed === "standard" ? shippingOptions.standard.charge : shippingOptions.fast.charge) : 0;
  const codExtra = paymentMethod === "COD" && shippingOptions ? shippingOptions.cod.extraCharge : 0;
  const total = basePrice + shippingCost + codExtra;

  return (
    <div className="section pt-40 px-8">
      <div className="mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="badge-pill mb-6">
          TRANSACTION_PORTAL // STEP_02
        </motion.div>
        <h1 className="section-title">Finalize_Order</h1>
        <p className="text-muted text-lg max-w-2xl font-light">
          Verify your configuration and provide delivery coordinates to secure your production slot.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10 items-start relative z-10">
        <div className="lg:col-span-8 flex flex-col gap-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card glass-heavy border border-white/5">
            <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
              <User size={18} className="text-accent" />
              <h3 className="font-tech text-sm text-white tracking-widest uppercase">Identity_&_Coordinates</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-tech text-muted tracking-widest uppercase ml-2">Full_Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" />
                  <input required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="pl-12" placeholder="DR. ELON MUSK" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-tech text-muted tracking-widest uppercase ml-2">Email_Service</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" />
                  <input type="email" required value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="pl-12" placeholder="ARCHITECT@TERRA.FORM" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-tech text-muted tracking-widest uppercase ml-2">Signal_Contact</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" />
                  <input required value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="pl-12" placeholder="+91 XXX XXX XXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-tech text-muted tracking-widest uppercase ml-2">Hub_Pincode</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" />
                  <input required maxLength="6" value={customer.pincode} onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })} className="pl-12" placeholder="360005" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-tech text-muted tracking-widest uppercase ml-2">Delivery_Base_Address</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-5 text-accent/40" />
                  <textarea required rows="3" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className="pl-12 pt-4" placeholder="SECTOR-7, MARS COLONY 1, HUB-A" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card glass-heavy border border-white/5">
            <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
              <CreditCard size={18} className="text-accent" />
              <h3 className="font-tech text-sm text-white tracking-widest uppercase">Payment_Protocol</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <label onClick={() => setPaymentMethod("PREPAID")} className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center gap-6 ${paymentMethod === 'PREPAID' ? 'bg-accent/10 border-accent/40' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'PREPAID' ? 'border-accent' : 'border-white/20'}`}>
                  {paymentMethod === 'PREPAID' && <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>}
                </div>
                <div>
                  <div className="font-tech text-[10px] text-white tracking-widest uppercase mb-1">Prepaid_Secure</div>
                  <div className="text-[9px] text-muted tracking-widest uppercase">UPI / CARD / NET_BANKING</div>
                </div>
              </label>

              <label onClick={() => setPaymentMethod("COD")} className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center gap-6 ${paymentMethod === 'COD' ? 'bg-accent/10 border-accent/40' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-accent' : 'border-white/20'}`}>
                  {paymentMethod === 'COD' && <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>}
                </div>
                <div>
                  <div className="font-tech text-[10px] text-white tracking-widest uppercase mb-1">On_Delivery</div>
                  <div className="text-[9px] text-muted tracking-widest uppercase">+₹30 VERIFICATION_FEE</div>
                </div>
              </label>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-10">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card glass-heavy border border-white/5">
            <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
              <Info size={18} className="text-accent" />
              <h3 className="font-tech text-sm text-white tracking-widest uppercase">Order_Manifest</h3>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-tech text-muted tracking-widest uppercase">Artifact_Name</span>
                <span className="text-xs font-tech text-white truncate">{estimate.fileName.toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="block text-[8px] font-tech text-muted tracking-widest uppercase mb-1">Mass</span>
                  <span className="block text-xs font-tech text-accent">{estimate.estimate.weightGrams}G</span>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="block text-[8px] font-tech text-muted tracking-widest uppercase mb-1">Uptime</span>
                  <span className="block text-xs font-tech text-accent">{estimate.estimate.printHours}H</span>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-tech text-muted tracking-widest uppercase">Unit_Fabrication</span>
                  <span className="text-sm font-tech text-white">₹ {basePrice.toLocaleString()}</span>
                </div>

                {shippingOptions && (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                    <label onClick={() => setSelectedSpeed("standard")} className="flex items-center gap-4 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedSpeed === 'standard' ? 'border-accent' : 'border-white/20'}`}>
                        {selectedSpeed === 'standard' && <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="text-[10px] font-tech text-white tracking-widest uppercase">Standard_Node</div>
                        <div className="text-[8px] text-muted tracking-[0.2em]">{shippingOptions.standard.eta.toUpperCase()}</div>
                      </div>
                      <span className="text-xs font-tech text-white">₹{shippingOptions.standard.charge}</span>
                    </label>
                    <label onClick={() => setSelectedSpeed("fast")} className="flex items-center gap-4 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedSpeed === 'fast' ? 'border-accent' : 'border-white/20'}`}>
                        {selectedSpeed === 'fast' && <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>}
                      </div>
                      <div className="flex-grow">
                        <div className="text-[10px] font-tech text-white tracking-widest uppercase">Priority_Link</div>
                        <div className="text-[8px] text-muted tracking-[0.2em]">{shippingOptions.fast.eta.toUpperCase()}</div>
                      </div>
                      <span className="text-xs font-tech text-white">₹{shippingOptions.fast.charge}</span>
                    </label>
                  </div>
                )}

                {codExtra > 0 && (
                  <div className="flex justify-between items-center text-accent-secondary">
                    <span className="text-[10px] font-tech tracking-widest uppercase">COD_Verification</span>
                    <span className="text-sm font-tech">₹ {codExtra}</span>
                  </div>
                )}

                <div className="pt-8 mt-4 border-t border-accent/20 flex justify-between items-center">
                  <span className="font-tech text-sm font-bold text-white tracking-widest uppercase">Grand_Total</span>
                  <span className="text-2xl font-tech text-accent glow-text tracking-tighter">
                    ₹ {total.toLocaleString()}
                  </span>
                </div>

                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-4 mt-10 group" disabled={loading || !shippingOptions}>
                  {loading ? "INITIALIZING..." : "SECURE_CREDENTIALS"}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-4 px-6 text-muted">
            <Shield size={16} className="text-accent/40" />
            <span className="text-[9px] font-tech tracking-[0.2em] uppercase leading-relaxed">
              End-to-end encrypted transaction via secure banking nodes.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;