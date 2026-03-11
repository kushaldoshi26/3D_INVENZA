import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Wand2, Terminal, Info, Cpu, Activity } from 'lucide-react';

const AIGenerator = () => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState('idle');
    const [result, setResult] = useState(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setStatus('generating');

        try {
            const response = await fetch('http://localhost:8000/api/ai/text-to-3d', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, style: 'realistic' })
            });
            const data = await response.json();
            setResult(data);
            setStatus('ready');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-bg relative overflow-hidden">
            <div className="noise"></div>
            <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

            <div className="container-custom pt-40 pb-32 relative z-10">
                <header className="text-center mb-20 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="badge-pill mx-auto mb-8"
                    >
                        NEURAL_FABRICATION_ENGINE // v.4.0
                    </motion.div>
                    <h1 className="section-title mb-6">Text_to_Geometry</h1>
                    <p className="text-muted text-lg font-light leading-relaxed">
                        Harness advanced manufacturing intelligence. Describe your physical objective,
                        and our neural network will synthesize industrial-grade 3D geometry.
                    </p>
                </header>

                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card glass-heavy border border-white/10 p-1 rounded-[40px] shadow-heavy overflow-hidden mb-12"
                    >
                        <div className="bg-black/60 rounded-[38px] p-10 md:p-12 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-dot opacity-5 group-focus-within:opacity-10 transition-opacity"></div>

                            <div className="flex items-center gap-4 mb-10 opacity-40">
                                <Terminal size={18} className="text-accent" />
                                <span className="font-tech text-[10px] tracking-[0.4em] uppercase">SYSTEM_NEURAL_PROMPT</span>
                            </div>

                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. A high-torque planetary gear system with integrated cooling channels and ISO industrial tolerances..."
                                className="!bg-transparent border-none !p-0 text-xl md:text-2xl font-light leading-relaxed min-h-[180px] focus:ring-0 placeholder:text-white/10 text-white resize-none"
                            />

                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-white/5 relative z-10">
                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-3">
                                        <Cpu size={16} className="text-accent/40" />
                                        <span className="text-[9px] font-tech tracking-[0.3em] uppercase text-white/40">NV_A100_NODE</span>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-3">
                                        <Activity size={16} className="text-accent/40" />
                                        <span className="text-[9px] font-tech tracking-[0.3em] uppercase text-white/40">LATENCY_24MS</span>
                                    </div>
                                </div>

                                <button
                                    className="btn-primary flex items-center gap-4 group w-full md:w-auto min-w-[240px]"
                                    onClick={handleGenerate}
                                    disabled={status === 'generating' || !prompt}
                                >
                                    {status === 'generating' ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                            SYNTHESIZING...
                                        </>
                                    ) : (
                                        <>
                                            INITIALIZE_GENESIS <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full"
                            >
                                <div className="card glass-heavy border border-accent/20 rounded-[40px] shadow-glow">
                                    <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-[0_0_15px_rgba(0,242,255,0.2)]">
                                                <Box size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-tech text-sm text-white tracking-[0.3em] uppercase mb-1">Genesis_Protocol_Active</h3>
                                                <p className="text-[9px] text-muted tracking-widest uppercase font-tech">NODE_TASK: {result.generation_id}</p>
                                            </div>
                                        </div>
                                        <div className="px-5 py-2.5 bg-accent/5 rounded-full border border-accent/20 font-tech text-[9px] text-accent flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></div>
                                            ACTIVE_FIBER_BUILD
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-12 mb-12">
                                        <div className="space-y-4 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                                            <span className="text-[9px] font-tech text-white/40 tracking-[0.3em] uppercase flex items-center gap-2">
                                                <Terminal size={12} /> Refined_Prompt
                                            </span>
                                            <p className="text-xs text-white/80 leading-relaxed font-light italic opacity-60">" {result.processing_data.refined_prompt} "</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between items-center text-[10px] font-tech">
                                                    <span className="text-white/40 tracking-widest uppercase">Complexity</span>
                                                    <span className="text-accent underline decoration-accent/20 underline-offset-4">0.84_MAX</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: "84%" }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="h-full bg-gradient-to-r from-accent to-accent-secondary rounded-full"
                                                    ></motion.div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between items-center text-[10px] font-tech text-white/40">
                                                    <span className="tracking-widest uppercase">Lattice_Sync</span>
                                                    <span className="text-white">92%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: "92%" }}
                                                        transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                                                        className="h-full bg-white/20 rounded-full"
                                                    ></motion.div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <span className="text-[9px] font-tech text-white/40 tracking-[0.3em] uppercase">Resource_Allocation</span>
                                            <div className="flex flex-col gap-4 font-tech text-[11px]">
                                                <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                                    <span className="text-white/40 uppercase tracking-widest">Cycle_ETA</span>
                                                    <span className="text-white">{result.estimated_completion}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-xl bg-accent/5 border border-accent/10">
                                                    <span className="text-accent/60 uppercase tracking-widest">Compute_Cost</span>
                                                    <span className="text-accent">₹ {result.cost_estimate.ai_generation_cost}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-accent/[0.03] rounded-3xl border border-accent/10 flex items-start gap-5">
                                        <Info size={20} className="text-accent mt-1 opacity-50" />
                                        <p className="text-[10px] text-accent/70 leading-[1.8] font-tech tracking-[0.2em] uppercase max-w-3xl">
                                            NEURAL_ADVISORY: Geometry synthesis is performing industrial lattice optimization.
                                            High-fidelity STL artifacts will be available in your control dashboard upon node completion.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[60%] h-[30%] bg-accent/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>
        </div>
    );
};

export default AIGenerator;
