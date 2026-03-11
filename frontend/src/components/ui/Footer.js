import React from "react";
import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, MessageSquare, Cpu, ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative pt-32 pb-12 border-t border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>

      <div className="container-custom relative z-10">
        <div className="grid md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-4 mb-8 group">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-all">
                <Cpu size={20} />
              </div>
              <span className="font-tech text-xl font-bold tracking-[0.4em] text-white uppercase">3DINVENZA</span>
            </Link>
            <p className="text-muted max-w-sm text-sm leading-relaxed mb-10 font-light mt-4">
              Pioneering additive manufacturing through neural synthesis
              and global node-based fulfillment protocols.
            </p>
            <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5 w-fit">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_15px_#00f2ff]"></div>
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping opacity-75"></div>
              </div>
              <span className="font-tech text-[8px] tracking-[0.3em] text-white/40 uppercase">CORE_PROCESSOR_ONLINE // SYNC_ACTIVE</span>
            </div>
          </div>

          <div>
            <h4 className="font-tech text-[9px] tracking-[0.4em] text-white/50 uppercase mb-8">Navigation</h4>
            <ul className="space-y-4 text-[11px] font-tech text-muted tracking-widest uppercase">
              <li><Link to="/upload" className="hover:text-accent transition-all">Direct_Uploader</Link></li>
              <li><Link to="/ai-generator" className="hover:text-accent transition-all">AI_Studio</Link></li>
              <li><Link to="/products" className="hover:text-accent transition-all">Asset_Repo</Link></li>
              <li><Link to="/track" className="hover:text-accent transition-all">Track_Fulfillment</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-tech text-[9px] tracking-[0.4em] text-white/50 uppercase mb-8">Connect</h4>
            <div className="flex gap-4">
              {[Twitter, Github, Linkedin, MessageSquare].map((Icon, i) => (
                <button key={i} className="p-3 bg-white/[0.03] rounded-xl border border-white/5 hover:border-accent/30 hover:bg-accent/5 transition-all text-white/30 hover:text-accent">
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 text-[8px] font-tech text-white/20 tracking-[0.4em] uppercase">
            <ShieldCheck size={12} />
            © 2026 3DINVENZA SYSTEM // STABLE_BUILD_4.2.1
          </div>
          <div className="flex gap-10 text-[8px] font-tech text-white/20 tracking-[0.4em] uppercase">
            <button className="hover:text-white transition-colors">Privacy_Gate</button>
            <button className="hover:text-white transition-colors">System_Terms</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;