import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { User, Lock, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { username, password });
            setAuth(response.data.user, response.data.token);

            const role = response.data.user.role;
            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'HR') navigate('/hr');
            else if (role === 'VOLUNTEER') navigate('/volunteer');
            else navigate('/student');

        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/40 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/30 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-[460px] relative z-10"
            >
                {/* Branding Section */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <img
                            src="/forese.png"
                            alt="Forese Logo"
                            className="w-32 mx-auto drop-shadow-lg"
                        />
                    </motion.div>
                    <h1 className="text-4xl font-extrabold text-[#0f172a] tracking-tight mb-2 uppercase">
                        Mock<span className="text-[#2563eb]"> Placements 2026</span>
                    </h1>
                </div>

                {/* Login Card */}
                <div className="bg-white/70 backdrop-blur-3xl border border-white shadow-[0_40px_80px_-20px_rgba(37,99,235,0.08)] rounded-[3.5rem] p-12 relative overflow-hidden group">
                    <form onSubmit={handleLogin} className="space-y-8">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-5 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[11px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2"
                                >
                                    <AlertCircle size={16} /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-3">
                            <div className="relative group/input">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within/input:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input-field pl-16 h-16 bg-white"
                                    placeholder="Username or Register ID..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="relative group/input">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within/input:text-blue-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-16 h-16 bg-white"
                                    placeholder="Enter secure password..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <motion.button
                                whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white font-black py-6 px-8 rounded-3xl shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-4 group/btn uppercase tracking-widest text-[11px]"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span>Log In</span>
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[#64748b] text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                        <Sparkles size={14} className="text-blue-500/30" />
                        Professional Assessment Portal
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
