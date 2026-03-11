import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../api";
import { User, Mail, Lock, ArrowRight, Database, Cpu } from "lucide-react";

const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await auth.signup(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (error) {
      alert("Signup failed: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden px-6 py-20">
      <div className="noise"></div>
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[500px] relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary mb-8 shadow-[0_0_20px_rgba(112,0,255,0.2)]"
          >
            <Database size={36} />
          </motion.div>
          <h1 className="text-4xl font-tech font-bold tracking-[0.1em] text-white mb-4 uppercase">Register_Node</h1>
          <p className="text-muted text-[10px] font-tech tracking-[0.4em] uppercase opacity-60">Initialize Your Digital Identity</p>
        </div>

        <div className="card glass-heavy p-10 md:p-12 rounded-[40px] border border-white/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-dot opacity-5 group-focus-within:opacity-10 transition-opacity"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-3">
              <label className="text-[9px] font-tech text-white/40 tracking-[0.3em] uppercase ml-1">Node_Alias</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  required
                  autoFocus
                  className="pl-14 !bg-white/[0.03] hover:!bg-white/[0.06] transition-all !rounded-[20px] py-4 border-white/5 focus:border-accent/30 text-white font-light"
                  placeholder="FULL_NAME_REQUESTED"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-tech text-white/40 tracking-[0.3em] uppercase ml-1">Comm_Channel</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  type="email"
                  required
                  className="pl-14 !bg-white/[0.03] hover:!bg-white/[0.06] transition-all !rounded-[20px] py-4 border-white/5 focus:border-accent/30 text-white font-light"
                  placeholder="ID@MATRIX.SYSTEM"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-tech text-white/40 tracking-[0.3em] uppercase ml-1">Encryption_Passkey</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  type="password"
                  required
                  className="pl-14 !bg-white/[0.03] hover:!bg-white/[0.06] transition-all !rounded-[20px] py-4 border-white/5 focus:border-accent/30 text-white font-light"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-4 py-5 !rounded-[20px] transition-all"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, var(--accent-secondary), #4e00b3)' }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  GENERATING...
                </>
              ) : (
                <>
                  GENERATE_IDENTITY <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <p className="text-muted text-[10px] font-tech tracking-[0.2em] leading-relaxed">
              ALREADY REGISTERED? <br />
              <Link to="/login" className="text-accent hover:text-white transition-all mt-3 inline-block uppercase tracking-[0.4em] font-bold">Node_Auth</Link>
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse"></div>
            <span className="text-[8px] font-tech text-white/30 tracking-[0.3em] uppercase">Identity_Service_v1.0</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-tech text-white/30 tracking-[0.3em] uppercase">
            <Cpu size={12} />
            Edge_Node: {Math.random().toString(16).substring(2, 8).toUpperCase()}
          </div>
        </div>
      </motion.div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-secondary/5 rounded-full blur-[200px] pointer-events-none -z-10 opacity-50"></div>
    </div>
  );
};

export default Signup;