import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Plus, X, Server, Database, Terminal, ChevronRight, Hash, HardDrive, Thermometer } from "lucide-react";
import { admin, printers as printerApi } from "../api";

const AdminPanel = () => {
  const [queue, setQueue] = useState({ orders: [], dental_cases: [] });
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrinter, setSelectedPrinter] = useState({});
  const [showAddPrinter, setShowAddPrinter] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [queueRes, printerRes] = await Promise.all([
        admin.getPrintQueue(),
        admin.getPrinters()
      ]);
      setQueue(queueRes.data);
      setPrinters(printerRes.data);
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrinter = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const config = {
      name: formData.get("name"),
      model: formData.get("model"),
      api_url: formData.get("api_url"),
      api_key: formData.get("api_key"),
      build_volume_x: 256,
      build_volume_y: 256,
      build_volume_z: 256
    };

    try {
      await printerApi.add(config);
      setShowAddPrinter(false);
      fetchData();
    } catch (err) {
      alert("SIGNAL_ERROR: Connection failed. " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAssign = async (type, id, printerId) => {
    if (!printerId) return;
    try {
      await admin.assignPrinter({
        job_id: id,
        printer_id: printerId,
        job_type: type
      });
      fetchData();
    } catch (error) {
      alert("INIT_FAILED: Node assignment rejected. " + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
      <span className="font-tech text-[10px] tracking-[0.5em] text-accent">SYNCING_GLOBAL_FLEET...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="noise"></div>
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

      <div className="container-custom pt-40 pb-32 relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div className="flex-grow">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="badge-pill mb-6">
              FLEET_OPERATIONS_COMMAND // v.4.0
            </motion.div>
            <h1 className="section-title mb-4">Fabrication_Control</h1>
            <p className="text-muted text-lg font-light max-w-2xl leading-relaxed">
              Managing the high-fidelity fiber network, automated print nodes, and neural fabrication queues.
            </p>
          </div>
          <button
            onClick={() => setShowAddPrinter(!showAddPrinter)}
            className="btn-primary !py-4 !px-8 flex items-center gap-4 group"
          >
            {showAddPrinter ? (
              <>CLOSE_DIAGNOSTICS <X size={18} /></>
            ) : (
              <>INITIALIZE_NODE <Plus size={18} className="group-hover:rotate-90 transition-transform" /></>
            )}
          </button>
        </header>

        <AnimatePresence>
          {showAddPrinter && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="overflow-hidden mb-16"
            >
              <div className="card glass-heavy border border-accent/20 rounded-[40px] p-10 bg-accent/5">
                <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
                  <Server size={20} className="text-accent" />
                  <h3 className="font-tech text-sm text-white tracking-[0.4em] uppercase">Connect_Digital_Node</h3>
                </div>
                <form onSubmit={handleAddPrinter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-tech text-muted tracking-widest uppercase ml-2">Node_Label</label>
                    <input placeholder="FIBER_ALPHA_01" className="w-full" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-tech text-muted tracking-widest uppercase ml-2">Hardware_Model</label>
                    <input placeholder="BAMBU_LAB_A1" className="w-full" name="model" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-tech text-muted tracking-widest uppercase ml-2">Signal_Endpoint</label>
                    <input placeholder="http://192.168.1.XX" className="w-full" name="api_url" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-tech text-muted tracking-widest uppercase ml-2">Access_Token</label>
                    <input type="password" placeholder="••••••••••••" className="w-full" name="api_key" required />
                  </div>
                  <div className="md:col-span-2 lg:col-span-4 pt-4">
                    <button type="submit" className="btn-primary w-full py-5 text-xs">SYNCHRONIZE_NEW_NODE</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* PRINTER FLEET */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-tech text-sm text-white tracking-[0.3em] uppercase opacity-40 flex items-center gap-4">
                <Cpu size={18} className="text-accent" /> Hardware_Fleet
              </h2>
              <span className="text-[10px] font-tech text-accent/60 tracking-widest">{printers.length}_UNITS</span>
            </div>

            <div className="space-y-6">
              {printers.map((p, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={p.id}
                  className="card group hover:border-accent/30 transition-all duration-500 overflow-hidden relative p-8 rounded-[32px]"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-tech text-white text-md tracking-wider mb-1">{p.name}</h3>
                      <span className="text-[9px] font-tech text-accent/60 tracking-[0.3em] uppercase">{p.model}</span>
                    </div>
                    <div className={`flex items-center gap-2 py-1.5 px-3 rounded-full border text-[8px] font-tech tracking-[0.2em] font-bold ${p.octoprint_connected ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${p.octoprint_connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      {p.octoprint_connected ? 'SIGNAL_STABLE' : 'SIGNAL_LOST'}
                    </div>
                  </div>

                  <div className="space-y-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-tech text-white/30 tracking-widest uppercase">System_State</span>
                      <span className="text-[10px] font-tech text-white tracking-widest uppercase">{p.octoprint_state || "IDLE"}</span>
                    </div>
                    {p.octoprint_connected && p.temperatures?.tool0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-tech text-white/30 tracking-widest uppercase">Heat_Sync</span>
                        <div className="flex items-center gap-3">
                          <Thermometer size={12} className="text-orange-400 opacity-60" />
                          <span className="text-[10px] font-tech text-orange-400">{p.temperatures.tool0.actual}° / {p.temperatures.tool0.target}°</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-grow py-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-tech tracking-widest uppercase hover:bg-accent/10 hover:border-accent/30 hover:text-accent transition-all">TERMINATE</button>
                    <button className="flex-grow py-3 rounded-xl bg-accent/10 border border-accent/20 text-[9px] font-tech text-accent tracking-widest uppercase hover:bg-accent hover:text-black transition-all">DIAGNOSTICS</button>
                  </div>
                </motion.div>
              ))}
              {printers.length === 0 && (
                <div className="card border-dashed border-2 border-white/5 p-12 text-center rounded-[32px]">
                  <span className="text-[10px] font-tech text-white/20 tracking-[0.4em] uppercase">No_Hardware_Nodes_Synced</span>
                </div>
              )}
            </div>
          </div>

          {/* JOB QUEUES */}
          <div className="lg:col-span-8 space-y-12">

            {/* Dental Cases */}
            <div className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="font-tech text-sm text-white tracking-[0.3em] uppercase opacity-40 flex items-center gap-4">
                  <Database size={18} className="text-accent" /> Neural_Fabrication_Queue
                </h2>
                <span className="text-[10px] font-tech text-accent/60 tracking-widest uppercase">{queue.dental_cases.length}_ACTIVE_NODES</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {queue.dental_cases.map(c => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 rounded-[32px] border border-white/5 hover:border-accent/20 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent">
                          <Hash size={18} />
                        </div>
                        <div>
                          <h4 className="font-tech text-white text-xs tracking-widest uppercase mb-1">CASE_#{c.id}</h4>
                          <span className="text-[9px] font-tech text-accent/70 tracking-widest uppercase">{c.case_type}</span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[8px] font-tech text-white/40 tracking-widest uppercase">
                        {c.status}
                      </div>
                    </div>

                    <div className="space-y-3 mb-8 opacity-40 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-between items-center text-[9px] font-tech">
                        <span className="text-white/40 uppercase tracking-widest">Architect</span>
                        <span className="text-white">DR. {c.dentist_name?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-tech">
                        <span className="text-white/40 uppercase tracking-widest">Subject_ID</span>
                        <span className="text-white">{c.patient_id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2 bg-black/40 rounded-2xl border border-white/5 group-focus-within:border-accent/40 transition-all">
                      <select
                        className="bg-transparent border-none focus:ring-0 text-[10px] font-tech text-white tracking-widest uppercase flex-grow"
                        onChange={(e) => setSelectedPrinter({ ...selectedPrinter, [`dental-${c.id}`]: e.target.value })}
                      >
                        <option value="" className="bg-bg text-white">SELECT_HARDWARE_NODE</option>
                        {printers.map(p => <option key={p.id} value={p.id} className="bg-bg text-white">{p.name}</option>)}
                      </select>
                      <button
                        onClick={() => handleAssign('dental', c.id, selectedPrinter[`dental-${c.id}`])}
                        className="bg-accent text-black font-tech text-[9px] font-bold px-6 py-2.5 rounded-xl hover:bg-white transition-all tracking-widest"
                      >
                        ASSIGN
                      </button>
                    </div>
                  </motion.div>
                ))}
                {queue.dental_cases.length === 0 && (
                  <div className="md:col-span-2 card border-dashed border-2 border-white/5 p-16 text-center rounded-[40px]">
                    <span className="text-[10px] font-tech text-white/10 tracking-[0.5em] uppercase leading-relaxed">System_Queue_Empty // Waiting_For_Neural_Trigger</span>
                  </div>
                )}
              </div>
            </div>

            {/* Standard Queue */}
            <div className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="font-tech text-sm text-white tracking-[0.3em] uppercase opacity-40 flex items-center gap-4">
                  <Terminal size={18} className="text-accent" /> Standard_Grid_Queue
                </h2>
                <span className="text-[10px] font-tech text-accent/60 tracking-widest uppercase">{queue.orders.length}_ACTIVE</span>
              </div>

              <div className="space-y-4">
                {queue.orders.map(o => (
                  <motion.div key={o.orderId} className="card p-6 px-10 rounded-[32px] border border-white/5 hover:border-accent/20 transition-all flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20">
                        <HardDrive size={22} />
                      </div>
                      <div>
                        <h4 className="font-tech text-white text-xs tracking-[0.2em] mb-1 uppercase">ORDR_{o.orderId.slice(-8)}</h4>
                        <p className="text-[9px] font-tech text-white/40 tracking-widest uppercase font-light italic opacity-60">{o.customer?.name} {"//"} {new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-tech text-white/20 tracking-[0.3em] uppercase mb-1">Queue_Priority</span>
                        <span className="text-[10px] font-tech text-accent tracking-[0.2em] uppercase">STANDARD_NODE</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-tech text-white/20 tracking-[0.3em] uppercase mb-1">State_Hook</span>
                        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[8px] font-tech text-white tracking-widest uppercase">
                          {o.status}
                        </div>
                      </div>
                      <div className="p-2 rounded-full border border-white/5 text-white/20 hover:text-accent hover:border-accent/30 cursor-pointer transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                ))}
                {queue.orders.length === 0 && (
                  <div className="card border-dashed border-2 border-white/5 p-12 text-center rounded-[32px]">
                    <span className="text-[10px] font-tech text-white/10 tracking-[0.4em] uppercase">No_Pending_Orders</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[60%] h-[30%] bg-accent/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>
    </div>
  );
};

export default AdminPanel;