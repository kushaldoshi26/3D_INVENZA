import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Cpu } from "lucide-react";

const Navbar = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Upload", path: "/upload" },
    { name: "AI Studio", path: "/ai-generator" },
    { name: "Track", path: "/track" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${scrolled
        ? "py-4 bg-black/60 backdrop-blur-2xl border-b border-white/5"
        : "py-8 bg-transparent"
        }`}
    >
      <div className="max-w-[1400px] mx-auto flex justify-between items-center px-6 md:px-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all duration-500">
            <Cpu size={20} className="group-hover:rotate-90 transition-transform duration-700" />
          </div>
          <span className="font-tech text-base font-bold tracking-[0.4em] text-white uppercase">3DINVENZA</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-12">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative py-2 text-[10px] font-tech tracking-[0.2em] uppercase transition-all duration-500 ${location.pathname === link.path ? "text-accent" : "text-white/40 hover:text-white"
                  }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-accent shadow-[0_0_15px_rgba(0,242,255,0.8)]"
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <div className="w-[1px] h-6 bg-white/10"></div>
            {token ? (
              <div className="flex items-center gap-6">
                <Link
                  to={isAdmin ? "/admin" : "/dashboard"}
                  className={`text-[10px] font-tech tracking-widest transition-colors ${location.pathname.includes("dashboard") || location.pathname.includes("admin") ? "text-accent" : "text-white/40 hover:text-white"
                    }`}
                >
                  {isAdmin ? "ADMIN_NODE" : "DASHBOARD"}
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}
                  className="px-6 py-2 border border-white/10 rounded-full text-[9px] font-tech tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  DISCONNECT
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="btn-primary !py-3 !px-8 text-[9px]">
                  INITIALIZE_SESSION
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-white/60 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black/95 backdrop-blur-3xl border-b border-white/5 overflow-hidden"
          >
            <div className="flex flex-col gap-6 px-10 py-12">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-tech tracking-widest uppercase ${location.pathname === link.path ? "text-accent" : "text-white/40"
                    }`}
                >
                  {link.name}
                </Link>
              ))}
              {!token && (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="btn-primary w-full !py-4">SIGN_IN</button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;