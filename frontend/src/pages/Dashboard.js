import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Box, Clock, ChevronRight, LayoutDashboard, Settings, LogOut, Terminal, Cpu } from "lucide-react";
import { orders } from "../api";

const Dashboard = () => {
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await orders.getMy();
        setMyOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="noise"></div>
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

      <div className="container-custom pt-40 pb-32 relative z-10">
        <header className="mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="badge-pill mb-8">
            SYSTEM_ACCESS_NODE // COMMAND_CENTER
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="max-w-3xl">
              <h1 className="section-title mb-6">Operations_Console</h1>
              <p className="text-muted text-lg font-light leading-relaxed">
                Welcome back, Agent <span className="text-white font-tech font-bold tracking-widest">{user.name?.toUpperCase() || "UNKNOWN"}</span>.
                Monitoring active production nodes and historical fabrication data across the global fiber network.
              </p>
            </div>

            <div className="flex items-center gap-6 p-6 bg-white/[0.03] rounded-[32px] border border-white/5 backdrop-blur-xl">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-tech text-xl font-bold shadow-glow">
                {user.name?.[0].toUpperCase() || "A"}
              </div>
              <div className="flex flex-col pr-8">
                <span className="text-[10px] font-tech text-white/40 tracking-[0.4em] uppercase mb-1">Authorization_Level</span>
                <span className="text-sm font-tech text-white tracking-widest">LVL_04_ARCHITECT</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-tech text-sm text-white tracking-[0.3em] uppercase opacity-40 flex items-center gap-4">
                <Terminal size={18} className="text-accent" /> Fabrication_History
              </h2>
              <div className="flex items-center gap-3 py-2 px-5 bg-accent/5 rounded-full border border-accent/10">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></div>
                <span className="text-[9px] font-tech text-accent tracking-[0.2em] uppercase font-bold">LIVE_NETWORK_FEED</span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card h-28 bg-white/[0.02] border border-white/5 rounded-[32px] animate-pulse"></div>
                ))}
              </div>
            ) : myOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card glass-heavy border-dashed border-2 border-white/5 flex flex-col items-center justify-center py-24 rounded-[40px] bg-transparent"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/10 mb-8 border border-white/5">
                  <Box size={40} />
                </div>
                <p className="text-muted font-tech text-[10px] tracking-[0.4em] uppercase">No_Active_Fabrications_Detected</p>
                <button
                  onClick={() => window.location.href = '/upload'}
                  className="mt-8 text-accent font-tech text-[11px] tracking-widest uppercase hover:text-white transition-colors"
                >
                  INITIALIZE_FIRST_NODE
                </button>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                {myOrders.map((order) => (
                  <motion.div
                    key={order.orderId}
                    variants={itemVariants}
                    className="card group hover:border-accent/30 transition-all duration-500 rounded-[32px] overflow-hidden relative p-8"
                  >
                    <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none">
                      <Cpu size={120} className="text-accent" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/20 group-hover:text-accent group-hover:border-accent/30 group-hover:bg-accent/5 transition-all duration-700 shadow-inner">
                          <Box size={28} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-tech text-accent tracking-[0.3em] uppercase mb-1">NODE_{order.orderId.slice(-8).toUpperCase()}</span>
                          <h4 className="text-sm font-tech text-white uppercase truncate max-w-[240px] tracking-widest">{order.estimate.fileName || "UNTITLED_GEOMETRY"}</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-16 flex-grow max-w-2xl px-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-tech text-white/30 tracking-[0.3em] uppercase mb-3">State_Hook</span>
                          <span className={`text-[9px] font-tech px-4 py-1.5 rounded-full w-fit tracking-widest uppercase font-bold ${order.status === 'COMPLETED'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-accent/10 text-accent border border-accent/20'
                            }`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-tech text-white/30 tracking-[0.3em] uppercase mb-3">Valuation</span>
                          <span className="text-sm font-tech text-white tracking-widest">₹{order.estimate.price.toLocaleString()}</span>
                        </div>
                        <div className="hidden md:flex flex-col">
                          <span className="text-[9px] font-tech text-white/30 tracking-[0.3em] uppercase mb-3 text-right">Sync_Date</span>
                          <span className="text-[10px] font-tech text-white/40 italic text-right tracking-widest opacity-60">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center p-2 rounded-full border border-white/5 text-white/20 group-hover:text-accent group-hover:border-accent/30 group-hover:bg-accent/5 transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="card glass-heavy border border-white/10 rounded-[40px] p-10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-dot opacity-[0.03] pointer-events-none"></div>

              <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8 relative z-10">
                <Settings size={20} className="text-accent" />
                <h3 className="font-tech text-sm text-white tracking-[0.3em] uppercase">Control_Nodes</h3>
              </div>

              <div className="flex flex-col gap-6 relative z-10">
                {[
                  { icon: LayoutDashboard, label: "System_Analytics", color: "accent" },
                  { icon: Settings, label: "Security_Protocols", color: "accent" },
                  {
                    icon: LogOut, label: "Terminate_Session", color: "red-500", action: () => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.href = "/";
                    }
                  }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className={`flex items-center gap-5 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-${item.color}/30 hover:bg-${item.color}/5 hover:text-${item.color === 'red-500' ? 'red-500' : 'accent'} transition-all group font-tech text-[10px] tracking-[0.3em] uppercase text-left`}
                  >
                    <item.icon size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card glass-heavy border border-white/10 rounded-[40px] p-10 text-center"
            >
              <div className="flex items-center justify-center gap-4 mb-8">
                <Clock size={18} className="text-accent/40" />
                <span className="text-[10px] font-tech text-white/30 tracking-[0.4em] uppercase">Node_Time_Sync</span>
              </div>
              <div className="text-4xl font-tech text-white/80 tracking-widest">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </div>
              <div className="mt-8 text-[8px] font-tech text-white/20 tracking-[0.5em] uppercase">SYSTEM_STATUS: STABLE // LATENCY: 12ms</div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-accent/5 rounded-full blur-[200px] pointer-events-none -z-10 opacity-30"></div>
    </div>
  );
};

export default Dashboard;