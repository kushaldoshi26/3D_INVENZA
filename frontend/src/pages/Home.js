import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Microscope, Rocket, ArrowRight, Terminal, Sparkles, Cpu } from "lucide-react";

const Home = () => {
  const containerRef = useRef(null);

  const words = "Materialize Your Reality".split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 50, rotateX: 45 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div ref={containerRef} className="relative bg-bg min-h-screen">
      <div className="noise"></div>

      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-accent/5 rounded-full blur-[180px] animate-pulse"></div>
        <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] bg-accent-secondary/5 rounded-full blur-[140px] animate-pulse delay-700"></div>
      </div>

      {/* Hero Section - Centered */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 z-10 text-center overflow-hidden">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl mx-auto flex flex-col items-center"
        >
          <motion.div variants={wordVariants} className="badge-pill mb-10">
            <Sparkles size={14} className="animate-spin-slow" />
            NEXT_GEN_FABRICATION_PROTOCOL // v4.2.1
          </motion.div>

          <h1 className="section-title !mb-12 flex flex-wrap justify-center gap-x-6 gap-y-4 perspective-[1000px]">
            {words.map((word, i) => (
              <motion.span
                key={i}
                variants={wordVariants}
                className={i === 2 ? "text-gradient glow-text" : "text-white opacity-95"}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            variants={wordVariants}
            className="text-lg md:text-xl text-muted max-w-2xl leading-relaxed mb-16 font-light"
          >
            Enter the era of autonomous production. 3DINVENZA utilizes high-fidelity
            neural synthesis to transform complex geometries into precision-engineered artifacts.
          </motion.p>

          <motion.div variants={wordVariants} className="flex flex-col sm:flex-row gap-8 items-center justify-center">
            <Link to="/upload" className="btn-primary flex items-center gap-4 group">
              INITIALIZE_FABRICATION <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link to="/products" className="btn-ghost flex items-center gap-4 group">
              EXPLORE_CATALOG <Terminal size={18} className="group-hover:rotate-12 transition-transform opacity-50" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1.2 }}
          className="mt-32 w-full max-w-6xl mx-auto px-4"
        >
          <div className="glass-heavy rounded-[40px] border border-white/5 p-2 shadow-2xl relative group">
            <div className="bg-black/40 rounded-[38px] overflow-hidden p-8 md:p-12">
              <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Cpu size={24} className="animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="font-tech text-xs text-white tracking-widest uppercase mb-1">REALTIME_NODE_STATUS</div>
                    <div className="text-[9px] text-accent/60 tracking-[0.3em] font-tech uppercase">Sync Link: Active_01</div>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden md:flex gap-8 mr-8">
                    <div className="text-right">
                      <div className="text-[8px] text-muted font-tech tracking-widest mb-1">LOAD</div>
                      <div className="text-xs text-white font-tech">42%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] text-muted font-tech tracking-widest mb-1">TEMP</div>
                      <div className="text-xs text-white font-tech">38°C</div>
                    </div>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-accent animate-ping"></div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Precision", val: "0.05mm", color: "text-accent" },
                  { label: "Build Rate", val: "142cm³/h", color: "text-white" },
                  { label: "Material", val: "PETG_CARBON", color: "text-white" },
                  { label: "Uptime", val: "99.98%", color: "text-accent" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5 text-left">
                    <div className="text-[8px] font-tech text-muted tracking-widest uppercase mb-2">{stat.label}</div>
                    <div className={`text-xl font-tech ${stat.color}`}>{stat.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="section bg-grid relative pt-60 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <div className="badge-pill mb-8 mx-auto">CORE_CAPABILITIES // AI_INTEGRATED</div>
            <h2 className="section-title">Industrial_Intelligence</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Our autonomous nodes utilize predictive neuro-pathing to optimize
              geometry fabrication in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: <Zap size={32} />,
                title: "Neural Engine",
                desc: "Real-time G-code optimization using proprietary models, reducing fabrication time by 35%."
              },
              {
                icon: <Microscope size={32} />,
                title: "Atomic Resolution",
                desc: "Industrial tolerances of ±0.05mm verified against digital twins in parallel workflows."
              },
              {
                icon: <Rocket size={32} />,
                title: "Rapid Dispatch",
                desc: "Global node network ensures localized production and instant fulfillment protocols."
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="card group hover:border-accent/40"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent mb-10 group-hover:bg-accent group-hover:text-black transition-all">
                  {f.icon}
                </div>
                <h3 className="text-xl font-tech font-bold text-white mb-6 uppercase tracking-tight">{f.title}</h3>
                <p className="text-muted leading-relaxed font-light text-sm mb-10">
                  {f.desc}
                </p>
                <div className="w-full h-[1px] bg-white/5"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Status Bar */}
      <footer className="py-20 border-y border-white/5 mb-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-between items-center gap-12 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-1000">
            {["Industrial_Grade", "AI_Distributed", "Global_Link", "50_Micron_Res", "Zero_Latency"].map(text => (
              <span key={text} className="font-tech text-[10px] tracking-[0.5em] uppercase text-white">{text}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;