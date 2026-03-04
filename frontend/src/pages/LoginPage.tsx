import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import Grainient from '../components/Backgrounds/Grainient';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(true);

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
        <div className="min-h-screen bg-[#f1f3ff] flex items-center justify-center p-6 font-sans selection:bg-blue-500/20">
            {/* Main Bespoke Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[1000px] h-[700px] bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] flex overflow-hidden border border-white"
            >
                {/* Left Side: Animated Brand Area */}
                <div className="w-[45%] relative p-12 flex flex-col justify-between overflow-hidden m-4 rounded-[2.5rem]">
                    {/* Background Component */}
                    <div className="absolute inset-0 z-0 scale-110">
                        <Grainient
                            color1="#0055ff"
                            color2="#9d00ff"
                            color3="#ff0080"
                            timeSpeed={1.5}
                            noiseScale={1.5}
                            grainAmount={0}
                            zoom={0.7}
                        />
                    </div>
                    

                    <div className="relative z-10 flex-grow flex items-center">
                        <h2 className="text-[80px] font-bold text-white leading-[0.95] tracking-tighter drop-shadow-xl">
                            Mock Placement<br />2026
                        </h2>
                    </div>

                    {/* Bottom Content: Branding Text */}
                    <div className="relative z-10 text-white drop-shadow-md">
                        <p className="text-white/80 text-[11px] font-black uppercase tracking-[0.25em] mb-3">Assessment Portal</p>
                        <p className="text-white/70 text-sm font-medium max-w-[260px] leading-relaxed">
                            Sharpen your skills and prepare for the real thing — right here.
                        </p>
                    </div>
                </div>

                {/* Right Side: Form Area */}
                <div className="flex-1 p-16 flex flex-col justify-center">
                    <div className="max-w-[360px] mx-auto w-full">
                        {/* Branding: Forese Logo */}
                        <div className="mb-10 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 inline-block"
                            >
                                <img
                                    src="/forese.png"
                                    alt="Forese Logo"
                                    className="h-16 w-auto mx-auto object-contain drop-shadow-sm"
                                />
                            </motion.div>
                            <h1 className="text-[32px] font-semibold text-slate-900 tracking-tight">Sign in to your account</h1>
                            <p className="text-slate-400 text-sm mt-1.5 font-medium">Enter your credentials to access the assessment portal.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username / Register ID</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#f8faff] border border-slate-100 rounded-xl py-4 px-5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all placeholder:text-slate-300"
                                    placeholder="e.g. john_doe or 22CS001"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#f8faff] border border-slate-100 rounded-xl py-4 px-5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all placeholder:text-slate-300 pr-12"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-[10px] font-bold text-red-500 flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100"
                                >
                                    <AlertCircle size={14} /> {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] text-sm mt-4 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Sign in</span>}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
