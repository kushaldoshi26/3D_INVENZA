import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/5">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-accent rounded-sm rotate-45 flex items-center justify-center">
                        <div className="w-4 h-4 bg-black rounded-sm"></div>
                    </div>
                    <span className="font-tech font-bold text-xl tracking-[0.2em]">3DINVENZA</span>
                </Link>

                <div className="hidden md:flex items-center gap-10">
                    <Link to="/" className="text-xs font-tech text-gray-400 hover:text-brand-accent transition-colors">HOME</Link>
                    <Link to="/upload" className="text-xs font-tech text-gray-400 hover:text-brand-accent transition-colors">UPLOAD</Link>
                    <Link to="/gallery" className="text-xs font-tech text-gray-400 hover:text-brand-accent transition-colors">GALLERY</Link>
                    {user?.role === 'admin' && (
                        <Link to="/admin" className="text-xs font-tech text-brand-accent">ADMIN_PANEL</Link>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-tech text-gray-500 uppercase">{user.name}</span>
                            <button
                                onClick={logout}
                                className="px-5 py-2 border border-white/10 rounded font-tech text-[10px] hover:bg-white/5 transition-all"
                            >
                                LOGOUT
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="px-6 py-2 bg-white text-black font-tech text-[10px] rounded hover:bg-brand-accent transition-all"
                        >
                            LOGIN_PORTAL
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
