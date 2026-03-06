import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, UserCheck, User, Send, CloudUpload, Users,
    LogOut, Search, UserPlus, Trash2, HelpCircle,
    TrendingUp, Clock, PieChart as PieChartIcon,
    AlertTriangle, Bell, CheckCircle2, Workflow, Filter, X, ChevronDown, Menu, PanelLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell
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
];

function StatCard({ title, value, icon: Icon, themeIndex = 0 }: { title: string; value: string | number; icon: any; themeIndex?: number }) {
    const t = STAT_THEMES[themeIndex % STAT_THEMES.length];
    return (
        <div className={`${t.bg} rounded-2xl p-6 flex items-center gap-5`}>
            <div className={`w-12 h-12 rounded-xl ${t.icon} flex items-center justify-center shrink-0`}>
                <Icon size={22} className="text-white" strokeWidth={2} />
            </div>
            <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${t.label}`}>{title}</p>
                <p className={`text-3xl font-bold leading-none ${t.value}`}>{value}</p>
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

    const navLinks = [
        { group: 'Platform', links: [{ to: '/admin', icon: LayoutGrid, label: 'Dashboard' }] },
        { group: 'Personnel', links: [
            { to: '/admin/hrs', icon: UserCheck, label: 'HR Management' },
            { to: '/admin/volunteers', icon: Users, label: 'Volunteers' },
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
            { to: '/admin/pipeline', icon: Workflow, label: 'Pipeline' },
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
                <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200/60">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
                        <LayoutGrid className="text-white" size={18} strokeWidth={2.5} />
                    </div>
                    {sidebarOpen && (
                        <div>
                            <div className="text-[15px] font-black tracking-tight text-slate-900 uppercase leading-none">FORESE</div>
                            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mt-0.5">Admin Portal</div>
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

                {sidebarOpen && (
                    <div className="px-4 pb-4">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200">
                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                                <HelpCircle size={16} className="text-blue-600" />
                            </div>
                            <p className="text-[12px] font-semibold text-slate-800 mb-0.5">Need help?</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">Contact our support team.</p>
                            <button className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-white transition-all">Contact Support</button>
                        </div>
                    </div>
                )}

                <div className="px-3 pb-5">
                    <button onClick={logout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ${!sidebarOpen ? 'justify-center' : ''}`}>
                        <LogOut size={17} />
                        {sidebarOpen && 'Log Out'}
                    </button>
                </div>
            </aside>

            {/* Mobile Drawer */}
            <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-100 md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0"><LayoutGrid className="text-white" size={16} /></div>
                    <span className="font-bold text-slate-900">Admin Portal</span>
                    <button onClick={() => setMobileOpen(false)} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
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

    useEffect(() => { api.get('/admin/hrs').then(res => setHrs(res.data)).catch(() => setHrs([])); }, []);

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
            <PageHeader title="HR Management" subtitle="Manage HR executive accounts and company profiles." />

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

    useEffect(() => {
        api.get('/admin/volunteers').then(res => setVolunteers(res.data)).catch(() => setVolunteers([]));
        api.get('/admin/hrs').then(res => setHrs(res.data)).catch(() => setHrs([]));
    }, []);

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
            <PageHeader title="Volunteer Management" subtitle="Create and manage support volunteer accounts." />

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
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 flex items-center shadow-sm">
                                                NO SHOW
                                            </span>
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
        catch { alert('Upload failed.'); }
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

// ─── Statistics ───────────────────────────────────────────────────────────────

const StatsDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    useEffect(() => { api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error); }, []);
    if (!stats) return <div className="py-16 text-center text-[13px] text-slate-400">Loading statistics...</div>;

    const chartStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-8">
            <PageHeader title="Statistics" subtitle="Platform-wide analytics and performance metrics." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-5">Department Progress</h3>
                    <div className="h-72"><ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.departmentStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <RechartsTooltip contentStyle={chartStyle} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="evaluated" stackId="a" fill="#2563eb" name="Evaluated" radius={[0,0,6,6]} barSize={28} />
                            <Bar dataKey="pending" stackId="a" fill="#e2e8f0" name="Pending" radius={[6,6,0,0]} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer></div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-5">Overall Distribution</h3>
                    <div className="h-72"><ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie data={[{ name: 'Evaluated', value: stats.overall?.evaluatedStudents || 0 }, { name: 'Pending', value: stats.overall?.pendingStudents || 0 }]}
                                cx="50%" cy="45%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                                <Cell fill="#2563eb" /><Cell fill="#cbd5e1" />
                            </Pie>
                            <RechartsTooltip contentStyle={chartStyle} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
                        </RechartsPieChart>
                    </ResponsiveContainer></div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-5">HR Performance</h3>
                    <div className="h-72"><ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie data={[{ name: 'Evaluated', value: stats.overall?.evaluatedStudents || 0 }, { name: 'Pending', value: stats.overall?.pendingStudents || 0 }]}
                                cx="50%" cy="45%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                                <Cell fill="#10b981" /><Cell fill="#cbd5e1" />
                            </Pie>
                            <RechartsTooltip contentStyle={chartStyle} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
                        </RechartsPieChart>
                    </ResponsiveContainer></div>
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-[13px] font-semibold text-slate-800 mb-5">Individual HR Performance</h3>
                <div className="h-80"><ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.hrStats} layout="vertical" margin={{ left: 60, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                        <RechartsTooltip contentStyle={chartStyle} />
                        <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" align="right" />
                        <Bar dataKey="evaluated" stackId="hr" fill="#10b981" name="Evaluated" barSize={20} />
                        <Bar dataKey="pending" stackId="hr" fill="#e2e8f0" name="Pending" radius={[0,4,4,0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer></div>
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
