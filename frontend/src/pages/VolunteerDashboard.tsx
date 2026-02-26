import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, UserPlus, LogOut,
    PlusCircle, Users, Activity, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className="block px-4 mb-2">
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 ${isActive
                ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={20} />
                <span className="text-sm tracking-tight">{label}</span>
            </div>
        </Link>
    );
};

const SectionHeader = ({ title, highlight }: { title: string, highlight?: string }) => (
    <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase italic">
            {title} <span className="text-[#2563eb]">{highlight}</span>
        </h1>
        <div className="h-1 w-20 bg-[#2563eb] rounded-full mt-4" />
    </div>
);

const VolunteerDashboard = () => {
    const { logout, user } = useAuthStore();
    const location = useLocation();

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-[#0f172a] flex flex-col fixed h-screen z-50 shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#2563eb] rounded-2xl flex items-center justify-center text-white font-black italic">V</div>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase whitespace-nowrap">Support <span className="text-[#2563eb]">Node</span></h1>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2 italic px-1">{user?.name || 'Volunteer'}</p>
                </div>

                <nav className="flex-1 mt-6">
                    <SidebarLink to="/volunteer" icon={LayoutGrid} label="Dashboard" />
                    <SidebarLink to="/volunteer/enroll" icon={UserPlus} label="New Registration" />
                </nav>

                <div className="p-6 border-t border-white/5">
                    <button onClick={logout} className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-red-400 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 transition-colors italic">
                        <LogOut size={18} />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 ml-72 p-14 min-h-screen">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Overview />} />
                        <Route path="/enroll" element={<EnrollStudent />} />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
};

const Overview = () => {
    const [stats, setStats] = useState({ enrolledToday: 0, totalEnrolled: 0 });

    useEffect(() => {
        api.get('/volunteer/stats').then((res: { data: { enrolledToday: number, totalEnrolled: number } }) => setStats(res.data));
    }, []);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <SectionHeader title="Staff" highlight="Perspective" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-blue-500/5 transition-all group">
                    <div className="p-4 bg-blue-50 text-[#2563eb] w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Cycle Enrolment</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.enrolledToday}</h3>
                </div>
                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-blue-500/5 transition-all group">
                    <div className="p-4 bg-indigo-50 text-indigo-600 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform"><Users size={28} /></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Managed</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalEnrolled}</h3>
                </div>
            </div>

            <div className="bg-[#2563eb] rounded-[3rem] p-12 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 text-white/5 opacity-40 group-hover:rotate-12 transition-transform scale-150 pointer-events-none">
                    <PlusCircle size={240} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tight italic">Resource <span className="opacity-60">Allocation</span></h3>
                    <p className="text-blue-100/80 text-sm mb-10 max-w-lg font-medium leading-relaxed">Identity verification and initial module registration for candidates. Ensure all metadata is accurate prior to Executive Audit.</p>
                    <Link to="/volunteer/enroll" className="inline-flex items-center gap-4 bg-white text-[#2563eb] px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20 active:scale-95">Enroll New Candidate <ChevronRight size={18} /></Link>
                </div>
            </div>
        </motion.div>
    );
};

const EnrollStudent = () => {
    const [formData, setFormData] = useState({ name: '', register_number: '', department: '', section: '', resume_url: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/volunteer/enroll', formData);
            alert('Candidate identity successfully registered.');
            setFormData({ name: '', register_number: '', department: '', section: '', resume_url: '' });
        } catch { alert('Enrolment protocol failed.'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <SectionHeader title="Candidate" highlight="Enrolment" />
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Candidate Name</label>
                        <input className="input-field h-14 italic" placeholder="Full Identity" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Register ID</label>
                        <input className="input-field h-14 italic" placeholder="Unique Identifier" value={formData.register_number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, register_number: e.target.value })} required />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                        <input className="input-field h-14 italic" placeholder="e.g. Computer Science" value={formData.department} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, department: e.target.value })} required />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Node</label>
                        <input className="input-field h-14 italic" placeholder="e.g. A, B, C" value={formData.section} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, section: e.target.value })} required />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dossier Link (Cloud)</label>
                        <input className="input-field h-14 italic" placeholder="Resume URL / Cloud Storage Link" value={formData.resume_url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, resume_url: e.target.value })} />
                    </div>
                    <div className="md:col-span-2 pt-6">
                        <button className="btn-primary w-full py-6 rounded-2xl shadow-blue-200 uppercase tracking-[0.2em] font-black italic">Finalize Enrolment</button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default VolunteerDashboard;
