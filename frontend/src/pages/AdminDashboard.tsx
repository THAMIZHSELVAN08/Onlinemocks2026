import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, UserCheck, User, Send, CloudUpload, Users,
    LogOut, Search, UserPlus, Trash2,
    TrendingUp, Clock, PieChart as PieChartIcon,
    AlertTriangle, Bell, CheckCircle2, Workflow, Filter, X, ChevronDown, Menu, PanelLeft,
    Award, BarChart2, Target, Zap, TrendingDown, AlertCircle, BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell,
    AreaChart, Area, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

// ─── Sidebar Link ─────────────────────────────────────────────────────────────

const SidebarLink = ({ to, icon: Icon, label, collapsed }: { to: string; icon: any; label: string; collapsed?: boolean }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));
    return (
        <Link to={to} title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${collapsed ? 'justify-center' : ''} ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}>
            <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
            {!collapsed && (
                <span className={`text-[13px] truncate ${isActive ? 'font-semibold text-blue-600' : 'font-medium'}`}>{label}</span>
            )}
            {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
        </Link>
    );
};

// ─── Shared Form Styles ───────────────────────────────────────────────────────

const inputCls = "w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all";
const labelCls = "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2";

function FormCard({ title, subtitle, icon: Icon, iconBg = "bg-blue-50", iconColor = "text-blue-600", iconBorder = "border-blue-100", children }: any) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center border ${iconBorder}`}>
                    <Icon size={16} className={iconColor} />
                </div>
                <div>
                    <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
                    {subtitle && <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function TableCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
                    {subtitle && <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">{title}</h1>
            {subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const STAT_THEMES = [
    { bg: 'bg-emerald-50', icon: 'bg-emerald-500', value: 'text-emerald-800', label: 'text-emerald-600' },
    { bg: 'bg-blue-50',    icon: 'bg-blue-500',    value: 'text-blue-800',    label: 'text-blue-600'    },
    { bg: 'bg-amber-50',   icon: 'bg-amber-500',   value: 'text-amber-800',   label: 'text-amber-600'   },
    { bg: 'bg-violet-50',  icon: 'bg-violet-500',  value: 'text-violet-800',  label: 'text-violet-600'  },
    { bg: 'bg-rose-50',    icon: 'bg-rose-500',    value: 'text-rose-800',    label: 'text-rose-600'    },
    { bg: 'bg-cyan-50',    icon: 'bg-cyan-500',    value: 'text-cyan-800',    label: 'text-cyan-600'    },
];

function StatCard({ title, value, icon: Icon, themeIndex = 0, sub }: { title: string; value: string | number; icon: any; themeIndex?: number; sub?: string }) {
    const t = STAT_THEMES[themeIndex % STAT_THEMES.length];
    return (
        <div className={`${t.bg} rounded-2xl p-6 flex items-center gap-5`}>
            <div className={`w-12 h-12 rounded-xl ${t.icon} flex items-center justify-center shrink-0`}>
                <Icon size={22} className="text-white" strokeWidth={2} />
            </div>
            <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${t.label}`}>{title}</p>
                <p className={`text-3xl font-bold leading-none ${t.value}`}>{value}</p>
                {sub && <p className={`text-[11px] mt-1 ${t.label} opacity-70`}>{sub}</p>}
            </div>
        </div>
    );
}

// ─── Filter Modal ─────────────────────────────────────────────────────────────

function FilterModal({ show, onClose, onReset, children }: { show: boolean; onClose: () => void; onReset: () => void; children: React.ReactNode }) {
    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-[15px] font-semibold text-slate-900">Filter</h3>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="px-6 py-5 space-y-4">{children}</div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={onReset} className="flex-1 h-10 rounded-xl text-[13px] font-medium text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition-all">Reset</button>
                            <button onClick={onClose} className="flex-[2] h-10 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all">Apply</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <div className="relative">
                <select value={value} onChange={e => onChange(e.target.value)}
                    className={`${inputCls} appearance-none pr-9 cursor-pointer`}>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const AdminDashboard = () => {
    const { logout } = useAuthStore();
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, type: '' as 'hr' | 'volunteer' | 'pipeline', id: '', name: '' });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const navLabel = (() => {
        const p = location.pathname;
        if (p === '/admin') return 'Dashboard';
        if (p.startsWith('/admin/hrs')) return 'HR Management';
        if (p.startsWith('/admin/volunteers')) return 'Volunteers';
        if (p.startsWith('/admin/students')) return 'Students';
        if (p.startsWith('/admin/transfer')) return 'Student Transfer';
        if (p.startsWith('/admin/add-student')) return 'Add Student';
        if (p.startsWith('/admin/uploads')) return 'Bulk Imports';
        if (p.startsWith('/admin/notifications')) return 'Notifications';
        if (p.startsWith('/admin/stats')) return 'Statistics';
        if (p.startsWith('/admin/pipeline')) return 'Pipeline';
        return 'Admin';
    })();

    const executeDeletion = async () => {
        const { type, id } = confirmModal;
        try {
            if (type === 'hr') await api.delete(`/admin/hr/${id}`);
            else if (type === 'volunteer') await api.delete(`/admin/volunteer/${id}`);
            else if (type === 'pipeline') await api.delete(`/admin/pipeline/${id}`);
            window.location.reload();
        } catch {
            alert(`Failed to delete ${type}.`);
        } finally {
            setConfirmModal({ show: false, type: '' as any, id: '', name: '' });
        }
    };

    // ── Sidebar nav — Pipeline is now under Volunteers ──
    const navLinks = [
        { group: 'Platform', links: [{ to: '/admin', icon: LayoutGrid, label: 'Dashboard' }] },
        { group: 'Personnel', links: [
            { to: '/admin/hrs', icon: UserCheck, label: 'HR Management' },
            { to: '/admin/volunteers', icon: Users, label: 'Volunteers' },
            { to: '/admin/pipeline', icon: Workflow, label: 'Pipeline' },
            { to: '/admin/students', icon: User, label: 'Students' },
        ]},
        { group: 'Operations', links: [
            { to: '/admin/transfer', icon: Send, label: 'Student Transfer' },
            { to: '/admin/add-student', icon: UserPlus, label: 'Add Student' },
            { to: '/admin/uploads', icon: CloudUpload, label: 'Bulk Imports' },
            { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
        ]},
        { group: 'Analytics', links: [
            { to: '/admin/stats', icon: PieChartIcon, label: 'Statistics' },
        ]},
    ];

    return (
        <div className="bg-slate-100 font-sans text-slate-900 md:p-2 flex gap-0" style={{ height: '100vh' }}>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" />
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col bg-slate-100 transition-all duration-300 overflow-hidden shrink-0 ${sidebarOpen ? 'md:w-56' : 'md:w-0'}`}>
                <div className="h-28 px-6 flex flex-col justify-center border-b border-slate-200/60">
                    <img src="/forese.png" alt="FORESE" className="h-16 w-auto self-start" />
                    {sidebarOpen && (
                        <div className="mt-2 text-left">
                            <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100/50">
                                Admin Portal
                            </span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
                    {navLinks.map(({ group, links }) => (
                        <div key={group}>
                            {sidebarOpen && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-5 pb-1.5">{group}</p>}
                            {!sidebarOpen && <div className="my-2 border-t border-slate-200" />}
                            {links.map(l => <SidebarLink key={l.to} to={l.to} icon={l.icon} label={l.label} collapsed={!sidebarOpen} />)}
                        </div>
                    ))}
                </nav>

                <div className="px-3 pb-5">
                    <button onClick={logout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ${!sidebarOpen ? 'justify-center' : ''}`}>
                        <LogOut size={17} />
                        {sidebarOpen && 'Log Out'}
                    </button>
                </div>
            </aside>

            {/* Mobile Drawer */}
            <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-100 md:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col gap-3 px-6 py-6 border-b border-slate-100">
                    <div className="flex items-center justify-between w-full">
                        <img src="/forese.png" alt="FORESE" className="h-9 w-auto" />
                        <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="mt-1">
                        <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100/50">
                            Admin Portal
                        </span>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navLinks.map(({ group, links }) => (
                        <div key={group}>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-4 pb-1">{group}</p>
                            {links.map(l => <SidebarLink key={l.to} to={l.to} icon={l.icon} label={l.label} />)}
                        </div>
                    ))}
                </nav>
                <div className="px-3 pb-6">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <LogOut size={17} /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden md:rounded-2xl md:border md:border-slate-200 bg-white md:shadow-sm">
                <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Menu size={20} /></button>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"><PanelLeft size={18} /></button>
                        <div className="hidden sm:flex items-center gap-2 text-[13px]">
                            <span className="text-slate-400 font-medium">Admin</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-800 font-semibold">{navLabel}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[12px] text-slate-500">
                            <Clock size={13} className="text-slate-400" />
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><User size={15} className="text-slate-400" /></div>
                            <span className="text-[13px] font-semibold text-slate-800 hidden sm:block">Admin</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-8 pb-16">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<Overview />} />
                            <Route path="/hrs" element={<ManageHRs setGlobalConfirm={setConfirmModal} />} />
                            <Route path="/volunteers" element={<ManageVolunteers setGlobalConfirm={setConfirmModal} />} />
                            <Route path="/pipeline" element={<ManagePipeline setGlobalConfirm={setConfirmModal} />} />
                            <Route path="/students" element={<StudentList />} />
                            <Route path="/transfer" element={<TransferStudents />} />
                            <Route path="/add-student" element={<AddStudent />} />
                            <Route path="/uploads" element={<BulkUploads />} />
                            <Route path="/notifications" element={<SendNotifications />} />
                            <Route path="/stats" element={<StatsDashboard />} />
                        </Routes>
                    </AnimatePresence>
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal({ show: false, type: '' as any, id: '', name: '' })}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100">
                            <div className="p-7 text-center">
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={22} />
                                </div>
                                <h3 className="text-[16px] font-semibold text-slate-900 mb-2">Confirm Deletion</h3>
                                <p className="text-[13px] text-slate-500 leading-relaxed">
                                    Are you sure you want to delete <span className="font-semibold text-slate-800">{confirmModal.name}</span>? This action cannot be undone.
                                </p>
                            </div>
                            <div className="px-6 pb-6 flex gap-3">
                                <button onClick={() => setConfirmModal({ show: false, type: '' as any, id: '', name: '' })}
                                    className="flex-1 h-10 rounded-xl text-[13px] font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">
                                    Cancel
                                </button>
                                <button onClick={executeDeletion}
                                    className="flex-1 h-10 bg-red-500 text-white rounded-xl text-[13px] font-semibold hover:bg-red-600 transition-all">
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Overview ─────────────────────────────────────────────────────────────────

const Overview = () => {
    const [stats, setStats] = useState({ students: 0, hrs: 0, volunteers: 0 });
    useEffect(() => { api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error); }, []);
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
            <PageHeader title="Dashboard" subtitle="Platform-wide overview and quick stats." />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Students" value={stats.students} icon={User} themeIndex={0} />
                <StatCard title="Total HRs" value={stats.hrs} icon={UserCheck} themeIndex={1} />
                <StatCard title="Total Volunteers" value={stats.volunteers} icon={Users} themeIndex={2} />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-5 flex items-center gap-4">
                <TrendingUp size={20} className="text-blue-500 shrink-0" />
                <p className="text-[13px] text-blue-700 font-medium">Use the sidebar to navigate through management sections.</p>
            </div>
        </motion.div>
    );
};

// ─── Reusable Account Table ───────────────────────────────────────────────────

function AccountTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full table-fixed">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider" style={{ width: 52 }}>#</th>
                        {columns.map(c => (
                            <th key={c} className="px-3 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{c}</th>
                        ))}
                        <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider" style={{ width: 80 }}>Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">{rows}</tbody>
            </table>
        </div>
    );
}

// ─── Manage HRs ───────────────────────────────────────────────────────────────

const ManageHRs = ({ setGlobalConfirm }: { setGlobalConfirm: any }) => {
    const [hrs, setHrs] = useState<any[]>([]);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', company_name: '' });
    const [uploadingBulk, setUploadingBulk] = useState(false);

    useEffect(() => { api.get('/admin/hrs').then(res => setHrs(res.data)).catch(() => setHrs([])); }, []);

    const handleBulkHrUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        setUploadingBulk(true);
        try {
            const res = await api.post('/admin/hr/bulk', formData);
            alert(res.data.message);
            api.get('/admin/hrs').then(res => setHrs(res.data));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Bulk upload failed.');
        } finally {
            setUploadingBulk(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/register/hr', formData);
            setFormData({ name: '', username: '', password: '', company_name: '' });
            api.get('/admin/hrs').then(res => setHrs(res.data));
        } catch (err: any) { alert(err.response?.data?.message || 'Unable to create HR'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <PageHeader title="HR Management" subtitle="Manage HR executive accounts and company profiles." />
                <div className="flex items-center gap-3 mb-7">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-blue-100 transition-all shadow-sm">
                        <CloudUpload size={14} /> {uploadingBulk ? 'Uploading...' : 'Bulk Upload HRs'}
                        <input type="file" className="hidden" accept=".csv" disabled={uploadingBulk} onChange={e => {
                            if (e.target.files?.[0]) handleBulkHrUpload(e.target.files[0]);
                        }} />
                    </label>
                    <button onClick={() => {
                        const csv = "name,company\nJohn Doe,Google\nJane Smith,Microsoft";
                        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'hr_template.csv'; a.click();
                    }} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" title="Download Template">
                        <CloudUpload size={16} className="rotate-180" />
                    </button>
                </div>
            </div>

            <FormCard title="Create HR Account" subtitle="Add a new HR executive to the platform" icon={UserCheck}>
                <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[['Full Name', 'name', 'e.g. Alexander Pierce', 'text'], ['Username', 'username', 'e.g. hr_alex', 'text'],
                      ['Password', 'password', 'Set password', 'text'], ['Company Name', 'company_name', 'e.g. Apple Inc.', 'text']].map(([lbl, key, ph]) => (
                        <div key={key}>
                            <label className={labelCls}>{lbl}</label>
                            <input className={inputCls} placeholder={ph} value={(formData as any)[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} required />
                        </div>
                    ))}
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all shadow-sm">
                            <UserCheck size={15} /> Create HR Account
                        </button>
                    </div>
                </form>
            </FormCard>

            <TableCard title="HR Directory" subtitle="All registered HR executives">
                <AccountTable
                    columns={['Name', 'Company', 'Username', 'Password', 'Progress']}
                    rows={hrs.map((hr, idx) => (
                        <tr key={hr.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-[12px] text-slate-300 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                            <td className="px-3 py-4 text-[13px] font-semibold text-slate-900 truncate">{hr.name}</td>
                            <td className="px-3 py-4">
                                <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-semibold border border-blue-100 truncate max-w-[120px]">
                                    {hr.company_name || hr.companyName}
                                </span>
                            </td>
                            <td className="px-3 py-4 text-[13px] text-slate-500 truncate">{hr.username}</td>
                            <td className="px-3 py-4">
                                <code className="bg-slate-50 px-2.5 py-1 rounded-lg text-slate-600 text-[12px] border border-slate-200 font-mono">{hr.plain_password || '—'}</code>
                            </td>
                            <td className="px-3 py-4">
                                <span className="text-[12px] font-semibold text-slate-600">{hr.completed_students || 0} / {hr.total_students || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => setGlobalConfirm({ show: true, type: 'hr', id: hr.id, name: hr.name })}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                    <Trash2 size={15} />
                                </button>
                            </td>
                        </tr>
                    ))}
                />
            </TableCard>
        </motion.div>
    );
};

// ─── Manage Pipeline ──────────────────────────────────────────────────────────

const ManagePipeline = ({ setGlobalConfirm }: { setGlobalConfirm: any }) => {
    const [pipelines, setPipelines] = useState<any[]>([]);
    const [formData, setFormData] = useState({ name: '', username: '', password: '' });

    useEffect(() => { api.get('/admin/pipeline').then(res => setPipelines(res.data)).catch(() => setPipelines([])); }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/register/pipeline', formData);
            setFormData({ name: '', username: '', password: '' });
            api.get('/admin/pipeline').then(res => setPipelines(res.data));
        } catch (err: any) { alert(err.response?.data?.message || 'Unable to create pipeline user'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <PageHeader title="Pipeline Management" subtitle="Create and manage pipeline operation credentials." />

            <FormCard title="Create Pipeline Account" subtitle="Add a new pipeline user" icon={Workflow}>
                <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[['Full Name', 'name', 'e.g. Pipeline Admin'], ['Username', 'username', 'e.g. p_admin'], ['Password', 'password', 'Set password']].map(([lbl, key, ph]) => (
                        <div key={key}>
                            <label className={labelCls}>{lbl}</label>
                            <input className={inputCls} placeholder={ph} value={(formData as any)[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} required />
                        </div>
                    ))}
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all shadow-sm">
                            <UserPlus size={15} /> Create Pipeline Account
                        </button>
                    </div>
                </form>
            </FormCard>

            <TableCard title="Pipeline Directory">
                <AccountTable
                    columns={['Name', 'Username', 'Password']}
                    rows={pipelines.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-[12px] text-slate-300 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                            <td className="px-3 py-4 text-[13px] font-semibold text-slate-900 truncate">{p.name || '—'}</td>
                            <td className="px-3 py-4 text-[13px] text-slate-500 truncate">{p.username}</td>
                            <td className="px-3 py-4">
                                <code className="bg-slate-50 px-2.5 py-1 rounded-lg text-slate-600 text-[12px] border border-slate-200 font-mono">{p.plain_password || '—'}</code>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => setGlobalConfirm({ show: true, type: 'pipeline', id: p.id, name: p.name })}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                    <Trash2 size={15} />
                                </button>
                            </td>
                        </tr>
                    ))}
                />
            </TableCard>
        </motion.div>
    );
};

// ─── Manage Volunteers ────────────────────────────────────────────────────────

const ManageVolunteers = ({ setGlobalConfirm }: { setGlobalConfirm: any }) => {
    const [volunteers, setVolunteers] = useState<any[]>([]);
    const [hrs, setHrs] = useState<any[]>([]);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', hrId: '' });
    const [uploadingBulk, setUploadingBulk] = useState(false);

    useEffect(() => {
        api.get('/admin/volunteers').then(res => setVolunteers(res.data)).catch(() => setVolunteers([]));
        api.get('/admin/hrs').then(res => setHrs(res.data)).catch(() => setHrs([]));
    }, []);

    const handleBulkVolunteerUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        setUploadingBulk(true);
        try {
            const res = await api.post('/admin/volunteers/bulk', formData);
            alert(res.data.message);
            api.get('/admin/volunteers').then(res => setVolunteers(res.data));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Bulk upload failed.');
        } finally {
            setUploadingBulk(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/register/volunteer', formData);
            setFormData({ name: '', username: '', password: '', hrId: '' });
            api.get('/admin/volunteers').then(res => setVolunteers(res.data));
        } catch (err: any) { alert(err.response?.data?.message || 'Unable to create volunteer'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <PageHeader title="Volunteer Management" subtitle="Create and manage support volunteer accounts." />
                <div className="flex items-center gap-3 mb-7">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-blue-100 transition-all shadow-sm">
                        <CloudUpload size={14} /> {uploadingBulk ? 'Uploading...' : 'Bulk Upload Volunteers'}
                        <input type="file" className="hidden" accept=".csv" disabled={uploadingBulk} onChange={e => {
                            if (e.target.files?.[0]) handleBulkVolunteerUpload(e.target.files[0]);
                        }} />
                    </label>
                    <button onClick={() => {
                        const csv = "name,hr_name\nVolunteer One,Alex HR\nVolunteer Two,John Doe HR";
                        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'volunteer_template.csv'; a.click();
                    }} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" title="Download Template">
                        <CloudUpload size={16} className="rotate-180" />
                    </button>
                </div>
            </div>

            <FormCard title="Create Volunteer Account" subtitle="Add a new volunteer to the platform" icon={Users}>
                <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[['Full Name', 'name', 'e.g. John Doe'], ['Username', 'username', 'e.g. v_john'], ['Password', 'password', 'Set password']].map(([lbl, key, ph]) => (
                        <div key={key}>
                            <label className={labelCls}>{lbl}</label>
                            <input className={inputCls} placeholder={ph} value={(formData as any)[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} required />
                        </div>
                    ))}
                    <div>
                        <label className={labelCls}>Assigned HR</label>
                        <div className="relative">
                            <select className={`${inputCls} appearance-none pr-9`} value={formData.hrId} onChange={e => setFormData({ ...formData, hrId: e.target.value })} required>
                                <option value="">Select HR...</option>
                                {hrs.map(hr => <option key={hr.id} value={hr.id}>{hr.name}</option>)}
                            </select>
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all shadow-sm">
                            <UserPlus size={15} /> Create Volunteer Account
                        </button>
                    </div>
                </form>
            </FormCard>

            <TableCard title="Volunteer Directory">
                <AccountTable
                    columns={['Name', 'Username', 'Password', 'Assigned HR']}
                    rows={volunteers.map((v, idx) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-[12px] text-slate-300 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                            <td className="px-3 py-4 text-[13px] font-semibold text-slate-900 truncate">{v.name}</td>
                            <td className="px-3 py-4 text-[13px] text-slate-500 truncate">{v.username}</td>
                            <td className="px-3 py-4"><code className="bg-slate-50 px-2.5 py-1 rounded-lg text-slate-600 text-[12px] border border-slate-200 font-mono">{v.plain_password || '—'}</code></td>
                            <td className="px-3 py-4">
                                <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium truncate max-w-[120px]">{v.hr_name || 'Unassigned'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => setGlobalConfirm({ show: true, type: 'volunteer', id: v.id, name: v.name })}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                    <Trash2 size={15} />
                                </button>
                            </td>
                        </tr>
                    ))}
                />
            </TableCard>
        </motion.div>
    );
};

// ─── Student List ─────────────────────────────────────────────────────────────

const StudentList = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [filterDept, setFilterDept] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterHR, setFilterHR] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);

    const DEPARTMENTS = ["Computer Science","Information Technology","Artificial Intelligence and Data Science","Electronics and Communication Engineering","Electrical and Electronics Engineering","Civil Engineering","Chemical Engineering","Mechanical and Automation Engineering","Mechanical Engineering","Automobile Engineering","Biotechnology"];

    useEffect(() => {
        setLoading(true);
        api.get('/admin/students/all').then(res => setStudents(res.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const hrOptions = ['ALL', ...new Set(students.map(s => s.hr_name).filter(Boolean))];
    const filteredStudents = students.filter(s => {
        const q = searchTerm.toLowerCase();
        return (
            (s.name?.toLowerCase().includes(q) || (s.register_number || s.registerNumber || '').toLowerCase().includes(q)) &&
            (filterDept === 'ALL' || s.department === filterDept) &&
            (filterStatus === 'ALL' || (filterStatus === 'COMPLETED' ? s.evaluation_status === 'COMPLETED' : s.evaluation_status !== 'COMPLETED')) &&
            (filterHR === 'ALL' || s.hr_name === filterHR)
        );
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <PageHeader title="Student Directory" subtitle="Centralized registry for all students across all departments." />
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input className={`${inputCls} pl-10`} placeholder="Search by name or register number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => setShowFilters(true)}
                        className={`flex items-center gap-2 h-11 px-4 rounded-xl border text-[13px] font-medium transition-all ${filterDept !== 'ALL' || filterStatus !== 'ALL' || filterHR !== 'ALL' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        <Filter size={15} /> Filters
                    </button>
                </div>

                <FilterModal show={showFilters} onClose={() => setShowFilters(false)} onReset={() => { setFilterDept('ALL'); setFilterStatus('ALL'); setFilterHR('ALL'); }}>
                    <FilterSelect label="Department" value={filterDept} onChange={setFilterDept} options={[{ value: 'ALL', label: 'All Departments' }, ...DEPARTMENTS.map(d => ({ value: d, label: d }))]} />
                    <FilterSelect label="Assigned HR" value={filterHR} onChange={setFilterHR} options={hrOptions.map(h => ({ value: h, label: h === 'ALL' ? 'All HRs' : h }))} />
                    <FilterSelect label="Evaluation Status" value={filterStatus} onChange={setFilterStatus} options={[{ value: 'ALL', label: 'All Status' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'PENDING', label: 'Pending' }]} />
                </FilterModal>

                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                        <colgroup><col style={{ width: 52 }} /><col style={{ width: '28%' }} /><col /><col style={{ width: '18%' }} /><col style={{ width: 120 }} /></colgroup>
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['#', 'Student', 'Department', 'Assigned HR', 'Status'].map((h, i) => (
                                    <th key={h} className={`py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${i === 0 ? 'px-6 text-left' : i === 4 ? 'px-6 text-left' : 'px-3 text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="py-16 text-center text-[13px] text-slate-400">Loading...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan={5} className="py-16 text-center text-[13px] text-slate-400">No students found.</td></tr>
                            ) : filteredStudents.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-[12px] text-slate-300 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                                    <td className="px-3 py-4">
                                        <div className="text-[13px] font-semibold text-slate-900 truncate">{s.name}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{s.register_number || s.registerNumber}</div>
                                    </td>
                                    <td className="px-3 py-4 text-[12px] text-slate-500 truncate">{s.department || '—'}</td>
                                    <td className="px-3 py-4 text-[12px] text-slate-500 truncate">{s.hr_name || 'Unallocated'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.evaluation_status === 'COMPLETED' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-500'}`}>
                                            {s.evaluation_status === 'COMPLETED' ? 'Completed' : 'Pending'}
                                        </span>
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

// ─── Transfer Students ────────────────────────────────────────────────────────

const TransferStudents = () => {
    const [hrs, setHrs] = useState<any[]>([]);
    const [selectedHrId, setSelectedHrId] = useState('');
    const [targetHrId, setTargetHrId] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { api.get('/admin/hrs').then(res => setHrs(res.data)); }, []);

    const fetchStudents = (hrId: string) => {
        api.get(`/admin/hrs/${hrId}/students`).then(res => setStudents(res.data.length ? res.data : [])).catch(() => setStudents([]));
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.trim()) {
            try { const res = await api.get(`/admin/students/global?query=${val}`); setStudents(res.data); setSelectedHrId(''); }
            catch {}
        } else if (selectedHrId) fetchStudents(selectedHrId);
        else setStudents([]);
    };

    const handleTransfer = async () => {
        if (!targetHrId || selectedStudentIds.length === 0) return;
        try {
            await api.post('/admin/students/transfer', { studentIds: selectedStudentIds, targetHrId });
            alert('Transfer completed successfully.');
            if (searchQuery) handleSearch(searchQuery); else if (selectedHrId) fetchStudents(selectedHrId);
            setSelectedStudentIds([]);
        } catch { alert('Transfer failed.'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <PageHeader title="Student Transfer" subtitle="Move students between HR executives." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <FormCard title="Find Students" subtitle="Search or filter by HR" icon={Search}>
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Search Student</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input className={`${inputCls} pl-10`} placeholder="Name or last 5 digits of register number..." value={searchQuery} onChange={e => handleSearch(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className={labelCls}>Filter by HR</label>
                                    <div className="relative">
                                        <select className={`${inputCls} appearance-none pr-9`} value={selectedHrId} onChange={e => { setSelectedHrId(e.target.value); fetchStudents(e.target.value); }}>
                                            <option value="">All HRs</option>
                                            {hrs.map(hr => <option key={hr.id} value={hr.id}>{hr.name}</option>)}
                                        </select>
                                        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="shrink-0 pt-6">
                                    <span className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-[12px] font-semibold border border-blue-100">
                                        {selectedStudentIds.length} selected
                                    </span>
                                </div>
                            </div>
                        </div>
                    </FormCard>

                    <div className="space-y-2 max-h-[420px] overflow-y-auto">
                        {students.length === 0 && (
                            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl text-[13px] text-slate-400">
                                {(selectedHrId || searchQuery) ? 'No students found.' : 'Search or select an HR to view students.'}
                            </div>
                        )}
                        {students.map(s => (
                            <div key={s.id} onClick={() => setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedStudentIds.includes(s.id) ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                                <div className="space-y-0.5">
                                    <div className="font-bold tracking-tight text-[15px]">{s.name}</div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{s.department || 'Not Assigned'}</div>
                                        {s.status === 'NO_SHOW' && (
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 flex items-center shadow-sm">NO SHOW</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{s.register_number}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">HR: {s.hr_name || 'Unassigned'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-fit sticky top-6">
                    <h3 className="text-[14px] font-semibold text-slate-900 mb-5">Transfer To</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Target HR</label>
                            <div className="relative">
                                <select className={`${inputCls} appearance-none pr-9`} value={targetHrId} onChange={e => setTargetHrId(e.target.value)}>
                                    <option value="">Select HR...</option>
                                    {hrs.filter(h => h.id !== selectedHrId).map(hr => <option key={hr.id} value={hr.id}>{hr.name}</option>)}
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <button onClick={handleTransfer} disabled={!targetHrId || selectedStudentIds.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <Send size={14} /> Transfer Students
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Add Student ──────────────────────────────────────────────────────────────

const AddStudent = () => {
    const [formData, setFormData] = useState({ name: '', register_number: '', department: '', resume_url: '', hr_id: '' });
    const [hrs, setHrs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const DEPARTMENTS = ["Computer Science","Information Technology","Artificial Intelligence and Data Science","Electronics and Communication Engineering","Electrical and Electronics Engineering","Civil Engineering","Chemical Engineering","Mechanical and Automation Engineering","Mechanical Engineering","Automobile Engineering","Biotechnology"];

    useEffect(() => { api.get('/admin/hrs').then(res => setHrs(res.data)); }, []);

    const isValidDriveLink = (url: string) => !url || /^https:\/\/(drive\.google\.com|docs\.google\.com)\/.+/i.test(url);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.resume_url && !isValidDriveLink(formData.resume_url)) { alert('Please enter a valid Google Drive link.'); return; }
        setLoading(true);
        try {
            await api.post('/admin/add-student', formData);
            alert('Student added successfully.');
            setFormData({ name: '', register_number: '', department: '', resume_url: '', hr_id: '' });
        } catch (err: any) { alert(err?.response?.data?.message || 'Failed to add student.'); }
        finally { setLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <PageHeader title="Add Student" subtitle="Individually register a student into the platform." />
            <FormCard title="Student Details" subtitle="Fill in the student's information" icon={UserPlus}>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className={labelCls}>Full Name</label>
                        <input className={inputCls} placeholder="Enter full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div>
                        <label className={labelCls}>Register Number</label>
                        <input className={inputCls} placeholder="e.g. 212723060190" value={formData.register_number} onChange={e => setFormData({ ...formData, register_number: e.target.value })} required />
                    </div>
                    <div>
                        <label className={labelCls}>Department</label>
                        <div className="relative">
                            <select className={`${inputCls} appearance-none pr-9`} value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required>
                                <option value="" disabled>Select department</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Resume Link</label>
                        <input className={`${inputCls} ${formData.resume_url && !isValidDriveLink(formData.resume_url) ? 'border-red-300 focus:border-red-400' : ''}`}
                            placeholder="Google Drive link" value={formData.resume_url} onChange={e => setFormData({ ...formData, resume_url: e.target.value })} />
                        {formData.resume_url && !isValidDriveLink(formData.resume_url) && <p className="text-[11px] text-red-500 mt-1.5">Only Google Drive links are accepted.</p>}
                    </div>
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Assign HR</label>
                        <div className="relative">
                            <select className={`${inputCls} appearance-none pr-9`} value={formData.hr_id} onChange={e => setFormData({ ...formData, hr_id: e.target.value })} required>
                                <option value="" disabled>Select HR to assign...</option>
                                {hrs.map(hr => <option key={hr.id} value={hr.id}>{hr.name}{hr.companyName ? ` — ${hr.companyName}` : ''}</option>)}
                            </select>
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-50">
                            <UserPlus size={15} /> {loading ? 'Adding...' : 'Add Student'}
                        </button>
                    </div>
                </form>
            </FormCard>
        </motion.div>
    );
};

// ─── Bulk Uploads ─────────────────────────────────────────────────────────────

const BulkUploads = () => {
    const [studentFile, setStudentFile] = useState<File | null>(null);
    const [resumeFiles, setResumeFiles] = useState<FileList | null>(null);
    const [resumeRegisterNumber, setResumeRegisterNumber] = useState('');

    const handleUpload = async (type: string, file: File | null) => {
        if (!file) return;
        const formData = new FormData(); formData.append('file', file);
        try { await api.post(`/admin/${type}/bulk`, formData); alert('Upload completed.'); if (type === 'students') setStudentFile(null); }
        catch (err: any) { alert(err.response?.data?.message || 'Upload failed.'); }
    };

    const handleBulkResumeUpload = async () => {
        if (!resumeFiles) return;
        const formData = new FormData();
        const cleanedNumber = resumeRegisterNumber.trim();
        if (cleanedNumber && resumeFiles.length === 1) formData.append('files', resumeFiles[0], `${cleanedNumber}.pdf`);
        else Array.from(resumeFiles).forEach(f => formData.append('files', f));
        try { await api.post('/admin/resumes/bulk', formData); alert('Resumes uploaded.'); setResumeFiles(null); setResumeRegisterNumber(''); }
        catch { alert('Resume upload failed.'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <PageHeader title="Bulk Imports" subtitle="Upload students or resumes in bulk." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormCard title="Student Import" subtitle="Upload a CSV file with student data" icon={CloudUpload}>
                    <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <p className="text-[11px] font-mono text-slate-500">Format: name, register_number, department, allocated_hr, resume</p>
                        </div>
                        <button onClick={() => {
                            const csv = "name,register_number,department,allocated_hr,resume\nJohn Doe,212723060001,Computer Science,HR-Alex,https://drive.google.com/example";
                            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'template.csv'; a.click();
                        }} className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">↓ Download Template</button>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-blue-100 transition-all">
                                <CloudUpload size={14} /> Choose CSV
                                <input type="file" className="hidden" accept=".csv" onChange={e => e.target.files && setStudentFile(e.target.files[0])} />
                            </label>
                            <span className="text-[12px] text-slate-400 truncate">{studentFile ? studentFile.name : 'No file chosen'}</span>
                        </div>
                        <button onClick={() => handleUpload('students', studentFile)} disabled={!studentFile}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-40">
                            Upload Students
                        </button>
                    </div>
                </FormCard>

                <FormCard title="Resume Import" subtitle="Upload PDF resumes named by register number" icon={CloudUpload} iconBg="bg-violet-50" iconColor="text-violet-600" iconBorder="border-violet-100">
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Register Number</label>
                            <input className={inputCls} placeholder="e.g. 2127230601090" value={resumeRegisterNumber} onChange={e => setResumeRegisterNumber(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-600 border border-violet-200 rounded-xl text-[12px] font-semibold cursor-pointer hover:bg-violet-100 transition-all">
                                <CloudUpload size={14} /> Choose PDFs
                                <input type="file" className="hidden" multiple accept=".pdf" onChange={e => setResumeFiles(e.target.files)} />
                            </label>
                            <span className="text-[12px] text-slate-400 truncate">{resumeFiles ? (resumeFiles.length === 1 ? resumeFiles[0].name : `${resumeFiles.length} files`) : 'No files chosen'}</span>
                        </div>
                        <button onClick={handleBulkResumeUpload} disabled={!resumeFiles}
                            className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-[13px] font-semibold hover:bg-violet-700 transition-all disabled:opacity-40">
                            Upload Resumes
                        </button>
                    </div>
                </FormCard>
            </div>
        </motion.div>
    );
};

// ─── Statistics Dashboard (EXPANDED) ─────────────────────────────────────────

const CHART_TOOLTIP_STYLE = {
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    fontSize: 12,
    fontFamily: 'inherit',
};

const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

// Mini progress bar used in HR leaderboard
function ProgressBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 w-8 text-right">{pct}%</span>
        </div>
    );
}

const StatsDashboard = () => {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
    }, []);

    if (!stats) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-[13px] text-slate-400">Loading statistics…</p>
                </div>
            </div>
        );
    }

    // ── Derived values ──
    const overall = stats.overall || {};
    const totalStudents = (overall.evaluatedStudents || 0) + (overall.pendingStudents || 0);
    const completionRate = totalStudents > 0 ? Math.round(((overall.evaluatedStudents || 0) / totalStudents) * 100) : 0;
    const pendingRate = 100 - completionRate;

    const deptStats: any[] = stats.departmentStats || [];
    const hrStats: any[] = stats.hrStats || [];

    // Top performer HR
    const topHR = [...hrStats].sort((a, b) => (b.evaluated || 0) - (a.evaluated || 0))[0];
    // Lowest performer HR
    const lowestHR = [...hrStats].sort((a, b) => {
        const rateA = (a.evaluated + a.pending) > 0 ? a.evaluated / (a.evaluated + a.pending) : 1;
        const rateB = (b.evaluated + b.pending) > 0 ? b.evaluated / (b.evaluated + b.pending) : 1;
        return rateA - rateB;
    })[0];

    // Department with most pending
    const mostPendingDept = [...deptStats].sort((a, b) => (b.pending || 0) - (a.pending || 0))[0];

    // Pie data
    const overallPieData = [
        { name: 'Evaluated', value: overall.evaluatedStudents || 0 },
        { name: 'Pending', value: overall.pendingStudents || 0 },
    ];

    // Department pie (top 6 by total)
    const deptPieData = [...deptStats]
        .sort((a, b) => ((b.evaluated || 0) + (b.pending || 0)) - ((a.evaluated || 0) + (a.pending || 0)))
        .slice(0, 6)
        .map(d => ({ name: d.name?.split(' ')[0] || d.name, value: (d.evaluated || 0) + (d.pending || 0) }));

    // HR completion rate data (for sorted bar)
    const hrCompletionData = hrStats
        .map(h => ({
            name: h.name?.split(' ')[0] || h.name,
            fullName: h.name,
            rate: (h.evaluated + h.pending) > 0 ? Math.round((h.evaluated / (h.evaluated + h.pending)) * 100) : 0,
            evaluated: h.evaluated || 0,
            pending: h.pending || 0,
            total: (h.evaluated || 0) + (h.pending || 0),
        }))
        .sort((a, b) => b.rate - a.rate);

    // Department completion rate
    const deptCompletionData = deptStats
        .map(d => ({
            name: d.name?.length > 10 ? d.name.slice(0, 10) + '…' : d.name,
            fullName: d.name,
            rate: (d.evaluated + d.pending) > 0 ? Math.round((d.evaluated / (d.evaluated + d.pending)) * 100) : 0,
            evaluated: d.evaluated || 0,
            pending: d.pending || 0,
        }))
        .sort((a, b) => b.rate - a.rate);

    // Area chart: simulated hourly trend (replace with real data if available)
    const hourlyTrend = stats.hourlyTrend || Array.from({ length: 8 }, (_, i) => ({
        time: `${8 + i}:00`,
        evaluated: Math.round((overall.evaluatedStudents || 0) * ((i + 1) / 8) * (0.9 + Math.random() * 0.2)),
    }));

    // Resume coverage
    const withResume = overall.studentsWithResume || 0;
    const withoutResume = totalStudents - withResume;
    const resumePie = [
        { name: 'With Resume', value: withResume },
        { name: 'Without Resume', value: withoutResume },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-7 pb-10">
            <PageHeader title="Statistics" subtitle="Comprehensive analytics across students, departments, and HR performance." />

            {/* ── Row 1: KPI cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Students" value={totalStudents} icon={Users} themeIndex={1} sub="Registered on platform" />
                <StatCard title="Evaluated" value={overall.evaluatedStudents || 0} icon={CheckCircle2} themeIndex={0} sub={`${completionRate}% completion`} />
                <StatCard title="Pending" value={overall.pendingStudents || 0} icon={Clock} themeIndex={2} sub={`${pendingRate}% remaining`} />
                <StatCard title="Completion Rate" value={`${completionRate}%`} icon={Target} themeIndex={3} sub="Platform-wide" />
            </div>

            {/* ── Row 2: Secondary KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Active HRs" value={overall.totalHRs || hrStats.length} icon={UserCheck} themeIndex={5} />
                <StatCard title="Volunteers" value={overall.totalVolunteers || 0} icon={Users} themeIndex={4} />
                <StatCard title="Top HR" value={topHR?.name?.split(' ')[0] || '—'} icon={Award} themeIndex={0} sub={`${topHR?.evaluated || 0} evaluated`} />
                <StatCard title="Needs Attention" value={mostPendingDept?.name?.split(' ')[0] || '—'} icon={AlertCircle} themeIndex={4} sub={`${mostPendingDept?.pending || 0} pending`} />
            </div>

            {/* ── Row 3: Overall pie + Hourly area ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut: Overall */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">Overall Completion</h3>
                    <p className="text-[11px] text-slate-400 mb-4">Evaluated vs pending across all HRs</p>
                    <div className="h-56 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie data={overallPieData} cx="50%" cy="50%" innerRadius={68} outerRadius={88} paddingAngle={4} dataKey="value" stroke="none">
                                    <Cell fill="#2563eb" /><Cell fill="#e2e8f0" />
                                </Pie>
                                <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-slate-900">{completionRate}%</span>
                            <span className="text-[11px] text-slate-400 font-medium mt-0.5">Complete</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-2">
                        {overallPieData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: i === 0 ? '#2563eb' : '#e2e8f0' }} />
                                <span className="text-[11px] text-slate-500">{d.name} <span className="font-semibold text-slate-700">{d.value}</span></span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Area: Evaluation trend */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">Evaluation Progress Trend</h3>
                    <p className="text-[11px] text-slate-400 mb-4">Cumulative evaluations over the session</p>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyTrend}>
                                <defs>
                                    <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                <Area type="monotone" dataKey="evaluated" stroke="#2563eb" strokeWidth={2.5} fill="url(#evalGrad)" name="Evaluated" dot={{ fill: '#2563eb', r: 3 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Row 4: Department stacked bar + dept completion ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stacked bar: dept breakdown */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">Department Breakdown</h3>
                    <p className="text-[11px] text-slate-400 mb-4">Evaluated vs pending per department</p>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptStats} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }}
                                    tickFormatter={v => v?.split(' ')[0] || v} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="evaluated" stackId="a" fill="#2563eb" name="Evaluated" radius={[0,0,4,4]} barSize={22} />
                                <Bar dataKey="pending" stackId="a" fill="#e2e8f0" name="Pending" radius={[4,4,0,0]} barSize={22} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Horizontal bar: dept completion rate */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">Dept. Completion Rates</h3>
                    <p className="text-[11px] text-slate-400 mb-4">Sorted by completion percentage</p>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptCompletionData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} width={72} />
                                <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Completion']} />
                                <Bar dataKey="rate" fill="#10b981" name="Completion %" radius={[0, 6, 6, 0]} barSize={16}>
                                    {deptCompletionData.map((_, i) => (
                                        <Cell key={i} fill={_ .rate >= 80 ? '#10b981' : _.rate >= 50 ? '#f59e0b' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Row 5: HR Performance leaderboard + HR stacked bar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leaderboard table */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h3 className="text-[13px] font-semibold text-slate-800">HR Leaderboard</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ranked by completion rate</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {hrCompletionData.slice(0, 8).map((hr, idx) => (
                            <div key={hr.name} className="px-6 py-3.5 flex items-center gap-4">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                    idx === 0 ? 'bg-amber-100 text-amber-600' :
                                    idx === 1 ? 'bg-slate-100 text-slate-600' :
                                    idx === 2 ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'
                                }`}>{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[13px] font-semibold text-slate-800 truncate">{hr.fullName}</span>
                                        <span className="text-[12px] font-bold text-slate-600 shrink-0 ml-2">{hr.evaluated}/{hr.total}</span>
                                    </div>
                                    <ProgressBar value={hr.evaluated} max={hr.total}
                                        color={hr.rate >= 80 ? 'bg-emerald-500' : hr.rate >= 50 ? 'bg-amber-400' : 'bg-rose-400'} />
                                </div>
                            </div>
                        ))}
                        {hrCompletionData.length === 0 && (
                            <div className="py-12 text-center text-[13px] text-slate-400">No HR data available.</div>
                        )}
                    </div>
                </div>

                {/* HR stacked bar */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">HR Workload Distribution</h3>
                    <p className="text-[11px] text-slate-400 mb-4">Total students assigned per HR executive</p>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hrCompletionData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} width={60} />
                                <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" align="right" />
                                <Bar dataKey="evaluated" stackId="hr" fill="#10b981" name="Evaluated" barSize={18} />
                                <Bar dataKey="pending" stackId="hr" fill="#e2e8f0" name="Pending" radius={[0,4,4,0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Row 6: Dept pie + Resume coverage ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department distribution pie */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">Department Distribution</h3>
                    <p className="text-[11px] text-slate-400 mb-4">Student share by department (top 6)</p>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie data={deptPieData} cx="50%" cy="50%" outerRadius={85} dataKey="value" stroke="none" paddingAngle={3}>
                                    {deptPieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                        {deptPieData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-1.5 min-w-0">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                                <span className="text-[10px] text-slate-500 truncate">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resume coverage donut */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">Resume Coverage</h3>
                    <p className="text-[11px] text-slate-400 mb-4">Students with uploaded resumes</p>
                    <div className="h-56 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie data={resumePie} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                    <Cell fill="#8b5cf6" /><Cell fill="#e2e8f0" />
                                </Pie>
                                <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-slate-900">
                                {totalStudents > 0 ? Math.round((withResume / totalStudents) * 100) : 0}%
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5">Coverage</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-5 mt-2">
                        {resumePie.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: i === 0 ? '#8b5cf6' : '#e2e8f0' }} />
                                <span className="text-[11px] text-slate-500">{d.name}: <span className="font-semibold text-slate-700">{d.value}</span></span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status summary cards */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4">
                    <h3 className="text-[13px] font-semibold text-slate-800">Quick Summary</h3>
                    {[
                        { label: 'Avg. Students per HR', value: hrStats.length > 0 ? Math.round(totalStudents / hrStats.length) : 0, icon: BarChart2, color: 'text-blue-600 bg-blue-50' },
                        { label: 'Highest Pending HR', value: lowestHR?.fullName?.split(' ')[0] || lowestHR?.name?.split(' ')[0] || '—', icon: TrendingDown, color: 'text-rose-600 bg-rose-50' },
                        { label: 'Depts Tracked', value: deptStats.length, icon: BookOpen, color: 'text-violet-600 bg-violet-50' },
                        { label: 'HRs > 80% Done', value: hrCompletionData.filter(h => h.rate >= 80).length, icon: Zap, color: 'text-emerald-600 bg-emerald-50' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                <item.icon size={15} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] text-slate-400 leading-none mb-0.5">{item.label}</p>
                                <p className="text-[15px] font-bold text-slate-900">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Row 7: Radar (dept multi-metric) + HR efficiency table ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar chart: per-dept evaluated vs pending */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">Department Radar</h3>
                    <p className="text-[11px] text-slate-400 mb-4">Evaluated counts across departments</p>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={deptStats.map(d => ({ ...d, shortName: d.name?.split(' ')[0] || d.name }))}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="shortName" tick={{ fontSize: 10, fill: '#64748b' }} />
                                <PolarRadiusAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                <Radar name="Evaluated" dataKey="evaluated" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} strokeWidth={2} />
                                <Radar name="Pending" dataKey="pending" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* HR efficiency detail table */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h3 className="text-[13px] font-semibold text-slate-800">HR Efficiency Details</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Evaluated, pending and completion rate per HR</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    {['HR Name', 'Evaluated', 'Pending', 'Total', 'Rate'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {hrCompletionData.map(hr => (
                                    <tr key={hr.name} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 text-[13px] font-semibold text-slate-800 truncate max-w-[120px]">{hr.fullName}</td>
                                        <td className="px-4 py-3 text-[13px] text-emerald-600 font-semibold">{hr.evaluated}</td>
                                        <td className="px-4 py-3 text-[13px] text-amber-500 font-semibold">{hr.pending}</td>
                                        <td className="px-4 py-3 text-[13px] text-slate-600">{hr.total}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                                hr.rate >= 80 ? 'bg-emerald-50 text-emerald-600' :
                                                hr.rate >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                            }`}>{hr.rate}%</span>
                                        </td>
                                    </tr>
                                ))}
                                {hrCompletionData.length === 0 && (
                                    <tr><td colSpan={5} className="py-10 text-center text-[13px] text-slate-400">No HR data.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Notifications ────────────────────────────────────────────────────────────

const SendNotifications = () => {
    const [hrs, setHrs] = useState<any[]>([]);
    const [volunteers, setVolunteers] = useState<any[]>([]);
    const [selectedHrIds, setSelectedHrIds] = useState<string[]>([]);
    const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sentCount, setSentCount] = useState<number | null>(null);

    const presets = [
        { label: 'Forese Greeting', title: 'Greeting', msg: 'Greeting from Forese Tech team' },
        { label: 'Documentation', title: 'Get Started', msg: 'To get started Please refer to the documentation attached' },
        { label: 'Welcome Sir', title: 'Welcome Back', msg: 'Welcome back Sir' },
        { label: 'Welcome Mam', title: 'Welcome Back', msg: 'Welcome back mam' },
        { label: 'Thank You', title: 'MockPlacements 2026', msg: 'Thank you for attending MockPlacements 2026' },
        { label: 'Session Starting', title: 'Session Alert', msg: 'The evaluation session is about to begin. Please be ready at your desk.' },
        { label: 'Break Time', title: 'Break Notification', msg: 'A short break has been scheduled. You may pause your evaluations.' },
        { label: 'Session Ending', title: 'Session Wrap-up', msg: 'The evaluation session is ending soon. Please complete your current evaluations.' },
        { label: 'New Students', title: 'Students Updated', msg: 'New students have been assigned to your queue. Check your dashboard.' },
        { label: 'Important Update', title: 'Admin Notice', msg: 'There is an important update. Please check your dashboard for more details.' },
    ];

    useEffect(() => {
        api.get('/admin/hrs').then(res => setHrs(res.data)).catch(() => setHrs([]));
        api.get('/admin/volunteers').then(res => setVolunteers(res.data)).catch(() => setVolunteers([]));
    }, []);

    const toggleHr = (id: string) => setSelectedHrIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleVolunteer = (id: string) => setSelectedVolunteerIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    const handleSend = async () => {
        if (!message.trim() || (selectedHrIds.length + selectedVolunteerIds.length) === 0) return;
        setSending(true); setSentCount(null);
        try {
            const res = await api.post('/admin/notify', { title: title.trim() || 'Admin Notification', message: message.trim(), hrIds: selectedHrIds, volunteerIds: selectedVolunteerIds });
            setSentCount(res.data.sent);
            setTimeout(() => setSentCount(null), 4000);
        } catch { alert('Failed to send notification.'); }
        finally { setSending(false); }
    };

    const RecipientItem = ({ name, sub, selected, onClick }: { name: string; sub: string; selected: boolean; onClick: () => void }) => (
        <div onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${selected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                {selected && <CheckCircle2 size={10} className="text-white" />}
            </div>
            <div className="min-w-0">
                <div className="text-[13px] font-semibold text-slate-900 truncate">{name}</div>
                <div className="text-[11px] text-slate-400 truncate">{sub}</div>
            </div>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <PageHeader title="Notifications" subtitle="Send real-time messages to HR executives and volunteers." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <FormCard title="Compose Message" subtitle="Write or select a preset notification" icon={Bell}>
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Quick Presets</label>
                                <div className="flex flex-wrap gap-2">
                                    {presets.map(p => (
                                        <button key={p.label} onClick={() => { setTitle(p.title); setMessage(p.msg); }}
                                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${message === p.msg ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Title</label>
                                <input className={inputCls} placeholder="Notification title..." value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className={labelCls}>Message</label>
                                <textarea className={`${inputCls} h-24 resize-none py-3`} placeholder="Notification message..." value={message} onChange={e => setMessage(e.target.value)} />
                            </div>
                        </div>
                    </FormCard>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="text-[14px] font-semibold text-slate-900">Select Recipients</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className={labelCls + ' mb-0'}>HR Executives ({selectedHrIds.length}/{hrs.length})</p>
                                    <button onClick={() => setSelectedHrIds(p => p.length === hrs.length ? [] : hrs.map(h => h.id))}
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                        {selectedHrIds.length === hrs.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                                    {hrs.map(hr => <RecipientItem key={hr.id} name={hr.name} sub={hr.company_name || hr.companyName || ''} selected={selectedHrIds.includes(hr.id)} onClick={() => toggleHr(hr.id)} />)}
                                    {hrs.length === 0 && <p className="text-[12px] text-slate-400 text-center py-6">No HRs found</p>}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className={labelCls + ' mb-0'}>Volunteers ({selectedVolunteerIds.length}/{volunteers.length})</p>
                                    <button onClick={() => setSelectedVolunteerIds(p => p.length === volunteers.length ? [] : volunteers.map(v => v.id))}
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                        {selectedVolunteerIds.length === volunteers.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                                    {volunteers.map(v => <RecipientItem key={v.id} name={v.name} sub={`HR: ${v.hr_name || 'Unassigned'}`} selected={selectedVolunteerIds.includes(v.id)} onClick={() => toggleVolunteer(v.id)} />)}
                                    {volunteers.length === 0 && <p className="text-[12px] text-slate-400 text-center py-6">No volunteers found</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-fit sticky top-6 space-y-5">
                    <h3 className="text-[14px] font-semibold text-slate-900">Send Summary</h3>
                    <div className="space-y-3">
                        {[['HRs Selected', selectedHrIds.length], ['Volunteers Selected', selectedVolunteerIds.length], ['Total Recipients', selectedHrIds.length + selectedVolunteerIds.length]].map(([label, val], i) => (
                            <div key={label as string} className={`flex justify-between items-center ${i === 2 ? 'pt-3 border-t border-slate-100' : ''}`}>
                                <span className="text-[12px] text-slate-500">{label}</span>
                                <span className={`text-[14px] font-semibold ${i === 2 ? 'text-blue-600' : 'text-slate-900'}`}>{val}</span>
                            </div>
                        ))}
                    </div>
                    {title && message && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Preview</p>
                            <p className="text-[13px] font-semibold text-slate-900 mb-1">{title}</p>
                            <p className="text-[12px] text-slate-500 leading-relaxed">{message}</p>
                        </div>
                    )}
                    {sentCount !== null && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span className="text-[12px] font-semibold text-emerald-600">Sent to {sentCount} recipient(s)</span>
                        </div>
                    )}
                    <button onClick={handleSend} disabled={sending || !message.trim() || (selectedHrIds.length + selectedVolunteerIds.length) === 0}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-40">
                        {sending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Send size={14} /> Send Notification</>}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
