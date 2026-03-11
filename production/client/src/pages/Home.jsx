import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Box, Zap, Shield, Rocket } from 'lucide-react';

const Home = () => {
    return (
        <div className="relative pt-20">
            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-tech mb-6 leading-none">
                        <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
                        INDUSTRIAL 3D PRINTING REDEFINED
                    </div>
                    <h1 className="text-6xl lg:text-8xl font-black mb-8 leading-tight">
                        <span className="text-gradient">3DINVENZA</span><br />
                        ESTIMATE. PRINT.
                    </h1>
                    <p className="text-gray-400 text-lg mb-10 max-w-lg leading-relaxed">
                        Transform photos and digital files into industrial-grade physical parts.
                        AI-powered generation meets precision engineering.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/upload" className="px-8 py-4 bg-gradient-to-r from-brand-accent to-[#7000ff] rounded-md font-tech text-black hover:opacity-90 transition-all glow-btn">
                            UPLOAD MODEL
                        </Link>
                        <button className="px-8 py-4 border border-brand-accent/30 rounded-md font-tech text-brand-accent hover:bg-brand-accent/10 transition-all">
                            VIEW GALLERY
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="relative"
                >
                    <div className="aspect-square bg-gradient-to-br from-brand-accent/20 to-purple-500/10 rounded-3xl border border-white/5 flex items-center justify-center overflow-hidden">
                        {/* 3D Visual Decorative Element */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.1),transparent_70%)]"></div>
                        <Box size={240} className="text-brand-accent/20 animate-bounce transition-all duration-1000" />
                    </div>
                    {/* Floating Data Badge */}
                    <div className="absolute -bottom-6 -left-6 glass-panel p-6 rounded-2xl shadow-2xl">
                        <div className="text-xs text-gray-400 font-tech mb-1">SYSTEM UPTIME</div>
                        <div className="text-2xl font-tech text-brand-accent">99.9%</div>
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-6 py-32">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: Zap, title: "INSTANT SLICING", desc: "Real-time cost estimation based on true geometric analysis." },
                        { icon: Shield, title: "PRECISION AUTH", desc: "Enterprise-grade security and production tracking." },
                        { icon: Rocket, title: "RAPID DELIVERY", desc: "Global fulfillment within 24-72 hours of approval." }
                    ].map((f, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="glass-panel p-10 rounded-2xl border-white/5"
                        >
                            <f.icon className="text-brand-accent mb-6" size={40} />
                            <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
