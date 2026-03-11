import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../api";
import { Lock, Mail, ArrowRight, Shield, Cpu } from "lucide-react";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await auth.login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (error) {
      alert("Login failed: " + (error.response?.data?.error || error.message));
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
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 text-accent mb-8 shadow-glow"
          >
            <Shield size={36} />
          </motion.div>
          <h1 className="text-4xl font-tech font-bold tracking-[0.1em] text-white mb-4 uppercase">System_Access</h1>
          <p className="text-muted text-[10px] font-tech tracking-[0.4em] uppercase opacity-60">Verified Credentials Required</p>
        </div>

        <div className="card glass-heavy p-10 md:p-12 rounded-[40px] border border-white/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-dot opacity-5 group-focus-within:opacity-10 transition-opacity"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[9px] font-tech text-white/40 tracking-[0.3em] uppercase ml-1">Node_Identifier</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  type="email"
                  required
                  autoFocus
                  className="pl-14 !bg-white/[0.03] hover:!bg-white/[0.06] transition-all !rounded-[20px] py-4 border-white/5 focus:border-accent/30 text-white font-light"
                  placeholder="ID@MATRIX.SYSTEM"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-tech text-white/40 tracking-[0.3em] uppercase ml-1">Secure_Passkey</label>
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
              className="btn-primary w-full flex items-center justify-center gap-4 py-5 !rounded-[20px] filter saturate-[1.2] contrast-[1.1] transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  SYNCING...
                </>
              ) : (
                <>
                  INITIALIZE_ACCESS <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <p className="text-muted text-[10px] font-tech tracking-[0.2em] leading-relaxed">
              UNAUTHORIZED ACCESS DETECTED? <br />
              <Link to="/signup" className="text-accent hover:text-white transition-all mt-3 inline-block uppercase tracking-[0.4em] font-bold">Create_Identity</Link>
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></div>
            <span className="text-[8px] font-tech text-white/30 tracking-[0.3em] uppercase">Auth_Node_v4.2.1</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-tech text-white/30 tracking-[0.3em] uppercase">
            <Cpu size={12} />
            Security: RSA_4KB
          </div>
        </div>
      </motion.div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[200px] pointer-events-none -z-10 opacity-50"></div>
    </div>
  );
};

export default Login;