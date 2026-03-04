import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, Users, Search, LogOut,
    CheckCircle2, Clock, ChevronRight, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

import EvaluationPage from './EvaluationPage';
import { FileText } from 'lucide-react';

/* --- UI COMPONENTS --- */

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className="block mb-2">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-400 ${isActive
                ? 'bg-[#0055ff] text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-500 hover:text-black hover:bg-[#F5F5F7]/50'
                }`}>
                <Icon size={19} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
                {isActive && <motion.div layoutId="sidebar-accent" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
        </Link>
    );
};

const SectionHeader = ({ title, highlight }: { title: string, highlight?: string }) => (
    <div className="mb-12">
        <h1 className="text-5xl font-bold text-black tracking-tight leading-tight">
            {title} <span className="text-slate-400">{highlight}</span>
        </h1>
    </div>
);

const HRDashboard = () => {
    const { logout, user } = useAuthStore();
    const location = useLocation();

    return (
        <div className="flex bg-[#FBFBFD] min-h-screen font-sans antialiased text-[#111111]">
            {/* Sidebar */}
            <aside className="w-80 bg-white/80 backdrop-blur-xl border-r border-[#D2D2D7]/30 flex flex-col fixed h-screen z-50">
                <div className="p-10 pt-12">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#0055ff] to-[#9d00ff] rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/10">
                            <ShieldCheck size={22} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-black">HR <span className="text-[#0055ff]">Hub</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user?.name || 'Interviewer'}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 mt-6 px-4">
                    <SidebarLink to="/hr" icon={LayoutGrid} label="Dashboard Overview" />
                    <SidebarLink to="/hr/students" icon={Users} label="Students List" />
                </nav>

                <div className="p-8 border-t border-[#D2D2D7]/30">
                    <button onClick={logout} className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-red-500 font-semibold text-sm hover:bg-red-50 transition-all group">
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 ml-72 p-14 min-h-screen">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Overview />} />
                        <Route path="/students" element={<Students />} />
                        <Route path="/evaluate/:studentId" element={<EvaluationPage />} />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
};

/* --- PAGE COMPONENTS --- */

const Overview = () => {
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });

    useEffect(() => {
        api.get('/hr/stats').then(res => setStats(res.data));
    }, []);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <SectionHeader title="Evaluation" highlight="Overview" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard label="Total Students" value={stats.total} icon={Users} />
                <StatCard label="Completed Evaluation" value={stats.completed} icon={CheckCircle2} />
                <StatCard label="Pending Evaluation" value={stats.pending} icon={Clock} />
            </div>
        </motion.div>
    );
};

const Students = () => {
    const [students, setStudents] = useState<Array<{
        id: string,
        name: string,
        register_number: string,
        department: string,
        evaluation_status: string,
        resumeUrl?: string
    }>>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        api.get('/hr/students').then((res: { data: any[] }) => setStudents(res.data));
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <SectionHeader title="Student" highlight="List" />
            
            <div className="bg-white border border-[#D2D2D7]/30 rounded-[3rem] shadow-sm overflow-hidden p-4">
                <div className="p-8 pt-10 border-b border-[#D2D2D7]/20">
                    <div className="relative group max-w-lg">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-[#86868B] group-focus-within:text-black transition-colors" size={18} strokeWidth={2} />
                        <input
                            className="w-full bg-[#f5f5f7] border-none rounded-2xl h-16 pl-16 pr-8 text-sm font-semibold placeholder-[#86868B] focus:ring-2 focus:ring-black/5 transition-all outline-none"
                            placeholder="Search by name or registration number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#D2D2D7]/10">
                                <th className="w-24 pl-12 py-8 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em]">S.No</th>
                                <th className="py-8 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em]">Student Name</th>
                                <th className="py-8 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em]">Department</th>
                                <th className="py-8 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em] text-center">Resume</th>
                                <th className="py-8 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em] text-center">Status</th>
                                <th className="pr-12 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D2D2D7]/10">
                            {students.filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.register_number || '').includes(searchTerm)).map((s, i) => (
                                <tr key={s.id} className="group hover:bg-[#FBFBFD] transition-all duration-300">
                                    <td className="pl-12 py-10 text-[#86868B] font-medium text-sm">{(i + 1).toString().padStart(2, '0')}</td>
                                    <td className="py-10">
                                        <div className="font-bold text-black tracking-tight text-[16px]">{s.name}</div>
                                        <div className="text-[11px] font-semibold text-[#86868B] mt-1 uppercase tracking-widest">{s.register_number}</div>
                                    </td>
                                    <td className="py-10">
                                        <span className="text-sm font-semibold text-black bg-[#F5F5F7] px-4 py-2 rounded-full border border-[#D2D2D7]/30">
                                            {s.department || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="py-10 text-center">
                                        {s.resumeUrl ? (
                                            <a href={s.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-6 py-3 bg-[#0055ff] text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 active:scale-95">
                                                <FileText size={14} /> Resume
                                            </a>
                                        ) : (
                                            <span className="text-[11px] font-bold text-[#D2D2D7] uppercase tracking-widest">Unavailable</span>
                                        )}
                                    </td>
                                    <td className="py-10 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${s.evaluation_status === 'COMPLETED' ? 'bg-green-500' : 'bg-slate-300'}`} />
                                            <span className={`text-[11px] font-bold uppercase tracking-widest ${s.evaluation_status === 'COMPLETED' ? 'text-black' : 'text-[#86868B]'}`}>
                                                {s.evaluation_status === 'COMPLETED' ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-right pr-12 py-10">
                                        <Link to={`/hr/evaluate/${s.id}`} className="inline-flex items-center gap-3 px-10 py-4 bg-[#f8faff] text-[#0055ff] border border-blue-100 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:bg-[#0055ff] hover:text-white hover:border-black active:scale-95 group/btn">
                                            Evaluate <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

const StatCard = ({ label, value, icon: Icon }: { label: string, value: number, icon: React.ElementType }) => (
    <div className="bg-white border border-[#D2D2D7]/30 p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-[#86868B] text-sm font-semibold tracking-tight mb-2 uppercase">{label}</p>
                <h3 className="text-5xl font-bold text-black tracking-tight">{value}</h3>
            </div>
            <div className={`p-4 bg-[#F5F5F7] text-black w-fit rounded-[1.25rem] group-hover:scale-110 transition-transform duration-500`}>
                <Icon size={24} strokeWidth={1.5} />
            </div>
        </div>
    </div>
);

export default HRDashboard;
