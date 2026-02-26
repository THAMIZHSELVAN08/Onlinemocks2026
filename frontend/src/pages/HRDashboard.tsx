import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, Users, Search, LogOut,
    CheckCircle2, Clock, ShieldCheck, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import { socket } from '../api/socket';

/* --- UI COMPONENTS --- */

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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight italic uppercase">
            {title} <span className="text-[#2563eb]">{highlight}</span>
        </h1>
        <div className="h-1 w-20 bg-[#2563eb] rounded-full mt-4" />
    </div>
);

const HRDashboard = () => {
    const { logout, user } = useAuthStore();
    const location = useLocation();

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-[#0f172a] flex flex-col fixed h-screen z-50 shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic">H</div>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase whitespace-nowrap">Lead <span className="text-[#2563eb]">Executive</span></h1>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2 italic px-1">{user?.name || 'Interviewer'}</p>
                </div>

                <nav className="flex-1 mt-6">
                    <SidebarLink to="/hr" icon={LayoutGrid} label="Control Hub" />
                    <SidebarLink to="/hr/students" icon={Users} label="Candidate Pool" />
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
                        <Route path="/students" element={<Students />} />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
};

/* --- PAGE COMPONENTS --- */

const Overview = () => {
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
    const [activeSessions, setActiveSessions] = useState<Array<{
        studentId: string,
        status: string,
        progress: number,
        lastUpdate: number
    }>>([]);

    useEffect(() => {
        api.get('/hr/stats').then(res => setStats(res.data));

        socket.on('update_exam_status', (data) => {
            setActiveSessions(prev => {
                const existing = prev.findIndex(s => s.studentId === data.studentId);
                if (existing > -1) {
                    const next = [...prev];
                    next[existing] = { ...next[existing], ...data, lastUpdate: Date.now() };
                    return next;
                }
                return [...prev, { ...data, lastUpdate: Date.now() }];
            });
        });

        const cleanup = setInterval(() => {
            setActiveSessions(prev => prev.filter(s => Date.now() - s.lastUpdate < 30000));
        }, 10000);

        return () => {
            socket.off('update_exam_status');
            clearInterval(cleanup);
        };
    }, []);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <SectionHeader title="Operational" highlight="Overview" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard label="Total Candidates" value={stats.total} icon={Users} color="blue" />
                <StatCard label="Audit Completed" value={stats.completed} icon={CheckCircle2} color="blue" />
                <StatCard label="Pending Evaluation" value={stats.pending} icon={Clock} color="indigo" />
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-blue-50 text-[#2563eb] rounded-xl"><ShieldCheck size={24} /></div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Live Calibration <span className="text-[#2563eb]">Telemetry</span></h3>
                </div>

                <div className="space-y-4">
                    {activeSessions.length === 0 ? (
                        <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                            <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">No active candidate modules detected</p>
                        </div>
                    ) : (
                        activeSessions.map((session) => (
                            <div key={session.studentId} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-200 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-black text-[#2563eb]">S</div>
                                    <div>
                                        <div className="font-extrabold text-slate-900 uppercase tracking-tight italic">Module Activity Detected</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {session.studentId.slice(-6)}</span>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${session.status === 'tab-switched' ? 'text-red-500' : 'text-blue-500'}`}>
                                                {session.status === 'tab-switched' ? 'Security Anomaly' : 'Signal Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Module Progress</div>
                                        <div className="w-32 h-2 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${session.progress}%` }} className="h-full bg-[#2563eb]" />
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-200 group-hover:text-[#2563eb] transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
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
        evaluation_status: string
    }>>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        api.get('/hr/students').then((res: { data: any[] }) => setStudents(res.data));
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <SectionHeader title="Candidate" highlight="Repository" />
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                    <div className="relative w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563eb] transition-colors" size={20} />
                        <input
                            className="input-field pl-16 h-14 bg-white border-white shadow-sm"
                            placeholder="Identify Candidate Signal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="w-24 pl-10">S.NO</th>
                                <th>CANDIDATE IDENTITY</th>
                                <th>SPECIALIZATION</th>
                                <th className="text-center">AUDIT STATUS</th>
                                <th className="text-right pr-10">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                <tr key={s.id} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="pl-10 text-slate-400 font-mono text-xs">{i + 1}</td>
                                    <td>
                                        <div className="font-extrabold text-slate-900 uppercase tracking-tight italic">{s.name}</div>
                                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{s.register_number}</div>
                                    </td>
                                    <td><span className="badge-blue">{s.department}</span></td>
                                    <td className="text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic ${s.evaluation_status === 'COMPLETED' ? 'bg-blue-50 text-[#2563eb] border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
                                            }`}>
                                            {s.evaluation_status === 'COMPLETED' ? 'Archived' : 'Ready'}
                                        </span>
                                    </td>
                                    <td className="text-right pr-10">
                                        <Link to={`/hr/evaluate/${s.id}`} className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-[#2563eb] uppercase tracking-[0.2em] transition-all group/link italic">
                                            Start Audit <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
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

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: number, icon: React.ElementType, color: string }) => (
    <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-blue-500/5 transition-all group">
        <div className={`p-4 bg-${color}-50 text-${color}-600 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
            <Icon size={28} />
        </div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
    </div>
);

export default HRDashboard;
