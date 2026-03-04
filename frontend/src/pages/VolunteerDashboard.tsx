import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, UserPlus, LogOut,
    Users, Activity, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

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
            {title} <span className="text-[#0055ff]">{highlight}</span>
        </h1>
    </div>
);

const VolunteerDashboard = () => {
    const { logout, user } = useAuthStore();
    const location = useLocation();

    return (
        <div className="flex bg-[#FBFBFD] min-h-screen font-sans antialiased text-[#111111]">
            {/* Sidebar */}
            <aside className="w-80 bg-white/80 backdrop-blur-xl border-r border-[#D2D2D7]/30 flex flex-col fixed h-screen z-50">
                <div className="p-10 pt-12">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#0055ff] to-[#9d00ff] rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/10">
                            <Activity size={22} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-black">Volunteer <span className="text-[#0055ff]">Hub</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user?.name || 'Volunteer'}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 mt-6 px-4">
                    <SidebarLink to="/volunteer" icon={LayoutGrid} label="Dashboard" />
                    <SidebarLink to="/volunteer/enroll" icon={UserPlus} label="Add Student" />
                </nav>

                <div className="p-8 border-t border-[#D2D2D7]/30">
                    <button onClick={logout} className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-red-500 font-semibold text-sm hover:bg-red-50 transition-all group">
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 ml-80 p-16 min-h-screen">
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
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, studentsRes] = await Promise.all([
                    api.get('/volunteer/stats'),
                    api.get('/volunteer/students')
                ]);
                setStats(statsRes.data);
                setStudents(studentsRes.data);
            } catch (err) {
                console.error("Data fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        
        // Refresh every 30 seconds for real-time status updates
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <SectionHeader title="Evaluation" highlight="Overview" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white border border-[#D2D2D7]/30 p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[#86868B] text-sm font-semibold tracking-tight mb-2 uppercase">Students Evaluated</p>
                            <h3 className="text-5xl font-bold text-black tracking-tight">{stats.enrolledToday}</h3>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-[#0055ff] to-[#9d00ff] text-white w-fit rounded-[1.25rem] group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-500/10">
                            <Activity size={24} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-[#D2D2D7]/30 p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[#86868B] text-sm font-semibold tracking-tight mb-2 uppercase">Total Students Assigned</p>
                            <h3 className="text-5xl font-bold text-black tracking-tight">{stats.totalEnrolled}</h3>
                        </div>
                        <div className="p-4 bg-[#F5F5F7] text-black w-fit rounded-[1.25rem] group-hover:scale-110 transition-transform duration-500">
                            <Users size={24} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-[#D2D2D7]/30 rounded-[3rem] shadow-sm overflow-hidden p-4">
                <div className="p-10 border-b border-[#D2D2D7]/20 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-black tracking-tight">Assigned Students</h3>
                        <p className="text-xs text-[#86868B] font-semibold uppercase tracking-widest mt-1">Live Status Monitoring</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-[#0055ff] rounded-xl">
                        <Activity size={20} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#D2D2D7]/10">
                                <th className="w-24 pl-12 py-8 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em]">S.No</th>
                                <th className="py-8 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em]">Student Name </th>
                                <th className="py-8 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em]">Department</th>
                                <th className="py-8 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em] text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D2D2D7]/10">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse italic text-xs">
                                        Synchronizing Data Layers...
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-[#86868B] font-medium text-sm italic">
                                        No Students registered under your assigned protocol.
                                    </td>
                                </tr>
                            ) : (
                                students.map((s, i) => (
                                    <tr key={s.id} className="group hover:bg-[#FBFBFD] transition-all duration-300">
                                        <td className="pl-12 py-10 text-[#86868B] font-medium text-sm">{(i + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-10">
                                            <div className="font-bold text-black tracking-tight text-[16px]">{s.name}</div>
                                            <div className="text-[11px] font-semibold text-[#86868B] mt-1 uppercase tracking-widest">{s.register_number}</div>
                                        </td>
                                        <td className="py-10">
                                            <span className="text-[12px] font-bold text-[#0055ff] bg-blue-50/50 px-4 py-2 rounded-full border border-blue-100/50 whitespace-nowrap">
                                                {s.department || 'General'}
                                            </span>
                                        </td>
                                        <td className="py-10 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.evaluation_status === 'COMPLETED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${s.evaluation_status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {s.evaluation_status === 'COMPLETED' ? 'Evaluated' : 'Awaiting HR Evaluation'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

const EnrollStudent = () => {
    const [formData, setFormData] = useState({ name: '', register_number: '', department: '', resume_url: '' });

    const departments = [
        "Computer Science",
        "Information Technology",
        "Artificial intelligence and Data Science",
        "Electronics and Communication Engineering",
        "Electrical and Electronics Engineering",
        "Civil Engineering",
        "Chemical Egineering",
        "Mechanical and Automation Engineering",
        "Mechanical Engineering",
        "Automobile Engineering",
        "Biotechnology"
    ];

    const isValidDriveLink = (url: string) => {
        if (!url) return true;
        return /^https:\/\/(drive\.google\.com|docs\.google\.com)\/.+/i.test(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.resume_url && !isValidDriveLink(formData.resume_url)) {
            alert('Please enter a valid Google Drive link.');
            return;
        }
        try {
            await api.post('/volunteer/enroll', formData);
            alert('Student identity successfully registered.');
            setFormData({ name: '', register_number: '', department: '', resume_url: '' });
        } catch { alert('Enrolment protocol failed.'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <SectionHeader title="Add" highlight="Student" />
            <div className="bg-white border border-[#D2D2D7]/30 rounded-[3rem] p-16 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-50 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                
                <form onSubmit={handleSubmit} className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="space-y-3 px-2">
                        <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em] ml-5">Student Name</label>
                        <input className="w-full bg-[#f5f5f7] border-none rounded-2xl h-16 px-10 text-sm font-semibold placeholder-[#86868B] focus:ring-2 focus:ring-[#0055ff]/5 transition-all outline-none" placeholder="Enter Full Name" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="space-y-3 px-2">
                        <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em] ml-5">Register ID (12 Digits)</label>
                        <input className="w-full bg-[#f5f5f7] border-none rounded-2xl h-16 px-10 text-sm font-semibold placeholder-[#86868B] focus:ring-2 focus:ring-[#0055ff]/5 transition-all outline-none" placeholder="e.g. 212723060190" value={formData.register_number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, register_number: e.target.value })} required />
                    </div>
                    <div className="space-y-3 px-2">
                        <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em] ml-5">Department</label>
                        <select 
                            className="w-full bg-[#f5f5f7] border-none rounded-2xl h-16 px-10 text-sm font-semibold text-black focus:ring-2 focus:ring-[#0055ff]/5 transition-all outline-none appearance-none" 
                            value={formData.department} 
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, department: e.target.value })} 
                            required
                        >
                            <option value="" disabled>Select Department</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3 px-2">
                        <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em] ml-5">Add Resume Link</label>
                        <input className={`w-full bg-[#f5f5f7] border-none rounded-2xl h-16 px-10 text-sm font-semibold placeholder-[#86868B] focus:ring-2 focus:ring-[#0055ff]/5 transition-all outline-none ${formData.resume_url && !isValidDriveLink(formData.resume_url) ? 'ring-2 !ring-red-300' : ''}`} placeholder="Google Drive Link" value={formData.resume_url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, resume_url: e.target.value })} required />
                        {formData.resume_url && !isValidDriveLink(formData.resume_url) && (
                            <p className="text-[10px] text-red-500 font-semibold ml-5">Only Google Drive links are accepted</p>
                        )}
                    </div>
                    <div className="md:col-span-2 pt-10 px-2">
                        <button className="w-full bg-[#0055ff] hover:bg-blue-700 text-white py-10 rounded-[2rem] shadow-xl shadow-blue-500/10 uppercase tracking-[0.25em] font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-4 group">
                            Add Student
                            <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default VolunteerDashboard;
