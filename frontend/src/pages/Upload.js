import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload as UploadIcon, Truck, ChevronRight, FileCode, Cpu } from "lucide-react";
import LayerSlicer from "../components/LayerSlicer";
import { useFileUpload } from "../hooks/useFileUpload";
import { useShipping } from "../hooks/useShipping";
import { calculatePricing } from "../utils/pricing";

const Upload = () => {
  const navigate = useNavigate();
  const { file, estimate, handleFileUpload, updateEstimate } = useFileUpload();
  const { pincode, shipping, handlePincodeChange } = useShipping();

  const handle3DEstimate = ({ volumeCm3, weightGrams, printHours }) => {
    const pricing = calculatePricing(volumeCm3, weightGrams, printHours);
    updateEstimate(pricing);
  };

  const handleCheckout = () => {
    if (!estimate) return;
    localStorage.setItem("checkoutData", JSON.stringify({ ...estimate, shipping }));
    navigate("/checkout");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileUpload(selectedFile);
  };

  const handlePincode = (e) => {
    const pin = e.target.value;
    const weight = estimate ? estimate.estimate.weightGrams : 200;
    handlePincodeChange(pin, weight);
  };

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="noise"></div>
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

      <div className="container-custom pt-40 pb-32 relative z-10">
        <header className="mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="badge-pill mb-8"
          >
            FABRICATION_INITIALIZATION // STEP_01
          </motion.div>
          <h1 className="section-title">Upload_Geometry</h1>
          <p className="text-muted text-lg font-light leading-relaxed max-w-2xl">
            Initialize your project by uploading industrial-grade 3D assets.
            Our neural engine will perform instant geometric analysis and layer-by-layer slicing.
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* LEFT: Upload & Preview */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border-dashed border-2 border-accent/20 bg-accent/[0.01] hover:bg-accent/[0.04] transition-all cursor-pointer relative group flex flex-col items-center justify-center py-24 rounded-[40px]"
            >
              <input
                type="file"
                accept=".stl,.obj,.3mf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="w-24 h-24 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent mb-8 group-hover:scale-110 transition-transform duration-700 bg-dot">
                <UploadIcon size={36} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-tech font-bold text-white mb-3 uppercase tracking-[0.2em]">Select_Artifact</h3>
                <p className="text-muted text-sm font-light uppercase tracking-widest opacity-60">Drag and drop STL, OBJ, or 3MF</p>
              </div>
              {file && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-10 px-8 py-3 rounded-full bg-accent/10 border border-accent/20 text-accent font-tech text-[10px] tracking-[0.3em] flex items-center gap-4"
                >
                  <div className="w-2 h-2 rounded-full bg-accent animate-ping"></div>
                  VERIFIED: {file.name.toUpperCase()}
                </motion.div>
              )}
            </motion.div>

            {/* Real 3D Slicer Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card !p-0 overflow-hidden border border-white/5 shadow-heavy glass-heavy rounded-[40px]"
            >
              <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <FileCode size={20} className="text-accent" />
                  <h3 className="font-tech text-[11px] text-white tracking-[0.4em] uppercase">Layer_Slicer_Preview</h3>
                </div>
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                  <div className="px-4 py-2 text-[9px] font-tech text-accent tracking-widest">REALTIME_RENDER</div>
                </div>
              </div>
              <div className="p-10 bg-black/20 min-h-[500px] relative">
                <div className="absolute inset-0 bg-dot opacity-10 pointer-events-none"></div>
                <LayerSlicer file={file} onEstimate={handle3DEstimate} />
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Pricing & Shipping */}
          <div className="lg:col-span-4 flex flex-col gap-10">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card glass-heavy border border-white/10 rounded-[40px]"
            >
              <div className="flex items-center gap-4 mb-12 border-b border-white/5 pb-8">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Cpu size={20} />
                </div>
                <h3 className="font-tech text-xs text-white tracking-[0.3em] uppercase">Analysis_Data</h3>
              </div>

              <div className="space-y-8">
                {[
                  { label: "Volume", value: estimate ? `${estimate.estimate.volumeCm3} cm³` : "NULL" },
                  { label: "Net_Weight", value: estimate ? `${estimate.estimate.weightGrams} g` : "NULL" },
                  { label: "Runtime", value: estimate ? `${estimate.estimate.printHours} H` : "NULL" },
                  { label: "Nodes", value: "142_Active", color: "text-accent" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <span className="text-[10px] font-tech text-muted tracking-widest uppercase group-hover:text-white/40 transition-colors">{item.label}</span>
                    <span className={`text-xs font-tech ${item.color || "text-white"}`}>{item.value}</span>
                  </div>
                ))}

                <div className="pt-10 border-t border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-tech text-muted tracking-widest uppercase">Base_Pricing</span>
                    <span className="text-sm font-tech text-white">₹ {estimate ? estimate.estimate.price : 0}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-tech text-muted tracking-widest uppercase">Fulfillment_Node</span>
                      <span className="text-[9px] text-accent/50 group-hover:text-accent transition-colors tracking-widest uppercase mt-1">
                        {shipping.text || "Awaiting_Pincode"}
                      </span>
                    </div>
                    <span className="text-sm font-tech text-white">₹ {shipping.cost || 0}</span>
                  </div>

                  <div className="flex flex-col gap-4 pt-4">
                    <label className="text-[9px] font-tech text-white/40 tracking-[0.3em] uppercase">Target_Pincode</label>
                    <input
                      type="text"
                      placeholder="ENTER 6-DIGIT CODE"
                      value={pincode}
                      onChange={handlePincode}
                      maxLength={6}
                      className="!bg-white/[0.03] border-white/10 font-tech text-sm text-center tracking-[0.4em] uppercase !rounded-[20px] py-5 focus:border-accent/40"
                    />
                  </div>

                  <div className="pt-10 mt-6 border-t border-accent/20 flex justify-between items-center">
                    <span className="font-tech text-sm font-bold text-white tracking-[0.2em] uppercase">Final_Quote</span>
                    <span className="text-3xl font-tech text-accent glow-text tracking-tighter">
                      ₹ {estimate ? (estimate.estimate.price + shipping.cost).toLocaleString() : (shipping.cost || 0)}
                    </span>
                  </div>

                  <button
                    className="btn-primary w-full flex items-center justify-center gap-4 mt-12 group disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                    onClick={handleCheckout}
                    disabled={!estimate || !pincode || pincode.length !== 6}
                  >
                    INITIALIZE_FIBER <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="flex items-start gap-4 px-8 py-6 bg-white/[0.02] border border-white/5 rounded-3xl">
              <Truck size={18} className="text-accent/50 mt-1" />
              <p className="text-[9px] font-tech tracking-[0.2em] uppercase leading-[1.8] text-white/30">
                Localized node production ensures dispatch within 24 standard cycle hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[200px] pointer-events-none -z-10 animate-pulse"></div>
    </div>
  );
};

export default Upload;