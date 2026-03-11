import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Gift, Box, ArrowUpRight, Cpu } from "lucide-react";

const Products = () => {
  const categories = [
    {
      id: "custom-upload",
      title: "Direct_Upload",
      description: "Industrial-grade fabrication for STL, OBJ, and 3MF models. Accuracy up to 0.05mm.",
      icon: <Upload size={28} />,
      link: "/upload",
      price: "FROM ₹99",
      accent: "var(--accent)"
    },
    {
      id: "gifts",
      title: "Neural_Gifts",
      description: "Personalized artifacts and stands integrated with AI-generated textures and lattices.",
      icon: <Gift size={28} />,
      link: "/gifts",
      price: "₹149 - 299",
      accent: "var(--accent-secondary)"
    },
    {
      id: "catalog",
      title: "Asset_Repository",
      description: "Access our curated library of pre-engineered models ready for instant production.",
      icon: <Box size={28} />,
      link: "/products",
      price: "₹99 - 499",
      accent: "var(--accent)"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="noise"></div>
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

      <div className="container-custom pt-40 pb-32 relative z-10">
        <header className="mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="badge-pill mb-8"
          >
            CORE_FABRICATION_CHANNELS // v.4.0
          </motion.div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="max-w-3xl">
              <h1 className="section-title mb-6">Fabrication_Pathways</h1>
              <p className="text-muted text-lg font-light leading-relaxed max-w-2xl">
                Select your production channel. Our neural network routes your request
                to the optimal production node based on geometry and material requirements.
              </p>
            </div>
            <div className="flex items-center gap-6 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
              <Cpu size={16} className="text-accent animate-pulse" />
              <div className="font-tech text-[9px] text-white/50 tracking-[0.3em] uppercase">Active_Nodes: 142</div>
            </div>
          </div>
        </header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-10"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={cardVariants}>
              <Link to={category.link} className="block group h-full">
                <div className="card h-full flex flex-col group-hover:border-accent/40 transition-all duration-700 relative overflow-hidden bg-black/20">
                  <div className="absolute top-0 right-0 p-10 text-white/[0.02] group-hover:text-accent/[0.05] transition-all duration-700 -rotate-12 translate-x-4 -translate-y-4">
                    {category.icon}
                  </div>

                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-10 border border-white/5 transition-all duration-500 group-hover:scale-110 group-hover:border-accent/30 bg-white/[0.03]"
                    style={{ color: category.accent }}
                  >
                    {category.icon}
                  </div>

                  <h3 className="text-2xl font-tech font-bold text-white mb-6 uppercase tracking-tight group-hover:text-accent transition-colors">
                    {category.title}
                  </h3>

                  <p className="text-muted text-sm leading-relaxed font-light mb-12 flex-grow opacity-80 group-hover:opacity-100 transition-opacity">
                    {category.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                    <span className="font-tech text-sm text-accent glow-text">{category.price}</span>
                    <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20 group-hover:bg-accent group-hover:text-black group-hover:border-accent group-hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all">
                      <ArrowUpRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-accent/5 rounded-full blur-[180px] pointer-events-none -z-10"></div>
    </div>
  );
};

export default Products;