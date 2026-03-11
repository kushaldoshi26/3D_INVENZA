import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, MapPin, CreditCard, Clock, CheckCircle2, Terminal } from "lucide-react";
import { orders } from "../api";

const OrderTrack = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("id") || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!orderId) return;
    setLoading(true);

    try {
      const { data } = await orders.getById(orderId);
      setOrder(data);
    } catch (error) {
      alert("SIGNAL_LOST: Order ID not found in the fabrication network.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (searchParams.get("id")) {
      handleSearch();
    }
  }, [searchParams, handleSearch]);

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="noise"></div>
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

      <div className="container-custom pt-40 pb-32 relative z-10">
        <header className="text-center mb-16 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="badge-pill mx-auto mb-6"
          >
            GLOBAL_NETWORK_SYNC // ACTIVE
          </motion.div>
          <h1 className="section-title mb-6">Track_Fabrication</h1>
          <p className="text-muted text-lg font-light">
            Monitor the real-time status of your physical assets through the global fiber network.
          </p>
        </header>

        <div className="max-w-xl mx-auto mb-16">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSearch}
            className="relative group"
          >
            <div className="absolute inset-0 bg-accent/20 blur-2xl opacity-0 group-focus-within:opacity-20 transition-opacity"></div>
            <div className="relative flex items-center p-2 bg-white/[0.03] border border-white/10 rounded-[28px] group-focus-within:border-accent/30 transition-all shadow-heavy backdrop-blur-3xl">
              <div className="pl-6 text-white/20 group-focus-within:text-accent transition-colors">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="ENTER_ORDER_TOKEN (e.g. INV-827364)"
                className="bg-transparent border-none focus:ring-0 py-4 px-4 text-white placeholder:text-white/10 font-tech tracking-widest text-xs flex-grow"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary !py-3 !px-8 !rounded-[20px] ml-2 text-[10px]"
              >
                {loading ? "SEARCHING..." : "INITIALIZE_SCAN"}
              </button>
            </div>
          </motion.form>
        </div>

        <AnimatePresence>
          {order && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className="card glass-heavy border border-white/10 rounded-[40px] overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12 border-b border-white/5 pb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-glow">
                      <Package size={28} />
                    </div>
                    <div>
                      <h3 className="font-tech text-white text-lg tracking-[0.2em] mb-1">NODE_{order.orderId}</h3>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent animate-ping"></div>
                        <span className="text-[10px] font-tech text-accent tracking-[0.3em] uppercase">SYSTEM_STATE: {order.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 py-3 px-6 bg-white/[0.03] rounded-2xl border border-white/5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-tech text-white/30 tracking-[0.3em] uppercase text-right">Fulfillment_Protocol</span>
                      <span className="text-white font-tech text-[10px] tracking-widest text-right">STANDARD_PRIORITY</span>
                    </div>
                    <div className="w-[1px] h-8 bg-white/10"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-tech text-white/30 tracking-[0.4em] uppercase text-right">ETA_SYNC</span>
                      <span className="text-white font-tech text-[10px] tracking-widest text-right">EST_48H</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                  {[
                    { icon: CheckCircle2, label: "Payment_Auth", value: order.paymentStatus, active: order.paymentStatus === 'paid' },
                    { icon: MapPin, label: "Destination", value: order.customer.address?.pincode || "GLOBAL_NODE", active: true },
                    { icon: CreditCard, label: "Valuation", value: `₹ ${order.estimate.price}`, active: true },
                    { icon: Clock, label: "Genesis_Time", value: new Date(order.createdAt).toLocaleDateString(), active: true },
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-accent/20 transition-all">
                      <item.icon size={18} className={`mb-4 ${item.active ? 'text-accent' : 'text-white/20'}`} />
                      <span className="block text-[8px] font-tech text-white/30 tracking-[0.4em] uppercase mb-2">{item.label}</span>
                      <span className="block text-xs text-white font-tech tracking-widest uppercase">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-8 bg-accent/5 rounded-[32px] border border-accent/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-dot opacity-[0.03] group-hover:opacity-[0.05]"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6 opacity-40">
                      <Terminal size={14} className="text-accent" />
                      <span className="font-tech text-[9px] tracking-[0.5em] uppercase">SYSTEM_LOG_FEED</span>
                    </div>
                    <div className="space-y-4 font-tech text-[10px] tracking-widest">
                      <div className="flex justify-between items-center text-white/60">
                        <span>[T-0] INITIALIZE_FABRICATION_REQUEST</span>
                        <span className="text-white/20">SUCCESS</span>
                      </div>
                      <div className="flex justify-between items-center text-white/60">
                        <span>[T+4] NETWORK_SYNC_PROTOCOL</span>
                        <span className="text-white/20">ACTIVE</span>
                      </div>
                      <div className="flex justify-between items-center text-accent">
                        <span>[T+12] QUEUED_FOR_GEOMETRY_SYNTHESIS</span>
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-accent rounded-full animate-bounce"></span>
                          <span className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none -z-10"></div>
    </div>
  );
};

export default OrderTrack;