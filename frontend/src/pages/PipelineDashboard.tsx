import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    User, Send, Search, UserPlus, HelpCircle, LayoutGrid,
    LogOut, Clock, Bell, CheckCircle2, Filter, X, ChevronDown, Menu, PanelLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputCls = "w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all";
const labelCls = "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2";

// ─── Sidebar Link ─────────────────────────────────────────────────────────────

const SidebarLink = ({ to, icon: Icon, label, collapsed }: { to: string; icon: any; label: string; collapsed?: boolean }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/pipeline' && location.pathname.startsWith(to));
    return (
        <Link to={to} title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${collapsed ? 'justify-center' : ''} ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}>
            <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
            {!collapsed && <span className={`text-[13px] truncate ${isActive ? 'font-semibold text-blue-600' : 'font-medium'}`}>{label}</span>}
            {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
        </Link>
    );
};

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">{title}</h1>
            {subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}
        </div>
    );
}

// ─── Form Card ────────────────────────────────────────────────────────────────

function FormCard({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <Icon size={16} className="text-blue-600" />
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
                            <h3 className="text-[15px] font-semibold text-slate-900">Filter Students</h3>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
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
                <select value={value} onChange={e => onChange(e.target.value)} className={`${inputCls} appearance-none pr-9 cursor-pointer`}>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}

// ─── Recipient Item ───────────────────────────────────────────────────────────

function RecipientItem({ name, sub, selected, onClick }: { name: string; sub: string; selected: boolean; onClick: () => void }) {
    return (
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
}

// ─── Main Pipeline Dashboard ──────────────────────────────────────────────────

const PipelineDashboard = () => {
    const { logout } = useAuthStore();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const navLabel = (() => {
        const p = location.pathname;
        if (p === '/pipeline') return 'Students';
        if (p.startsWith('/pipeline/transfer')) return 'Student Transfer';
        if (p.startsWith('/pipeline/add-student')) return 'Add Student';
        if (p.startsWith('/pipeline/notifications')) return 'Notifications';
        return 'Pipeline';
    })();

    const navLinks = [
        { group: 'Management', links: [
            { to: '/pipeline', icon: User, label: 'Students' },
            { to: '/pipeline/transfer', icon: Send, label: 'Student Transfer' },
            { to: '/pipeline/add-student', icon: UserPlus, label: 'Add Student' },
        ]},
        { group: 'Communication', links: [
            { to: '/pipeline/notifications', icon: Bell, label: 'Notifications' },
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
                            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mt-0.5">Pipeline Portal</div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
                    <span className="font-bold text-slate-900">Pipeline Portal</span>
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
                            <span className="text-slate-400 font-medium">Pipeline</span>
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
                            <span className="text-[13px] font-semibold text-slate-800 hidden sm:block">Pipeline Executive</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-8 pb-16">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<StudentList />} />
                            <Route path="/transfer" element={<TransferStudents />} />
                            <Route path="/add-student" element={<AddStudent />} />
                            <Route path="/notifications" element={<SendNotifications />} />
                        </Routes>
                    </AnimatePresence>
                </main>
            </div>
        </div>
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
            ((s.name || '').toLowerCase().includes(q) || (s.register_number || s.registerNumber || '').toLowerCase().includes(q)) &&
            (filterDept === 'ALL' || s.department === filterDept) &&
            (filterStatus === 'ALL' || (filterStatus === 'COMPLETED' ? s.evaluation_status === 'COMPLETED' : s.evaluation_status !== 'COMPLETED')) &&
            (filterHR === 'ALL' || s.hr_name === filterHR)
        );
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <PageHeader title="Student Directory" subtitle="Centralized registry of all students across departments." />

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
                    <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={[{ value: 'ALL', label: 'All Status' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'PENDING', label: 'Pending' }]} />
                </FilterModal>

                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                        <colgroup><col style={{ width: 52 }} /><col style={{ width: '30%' }} /><col /><col style={{ width: '18%' }} /><col style={{ width: 120 }} /></colgroup>
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['#', 'Student', 'Department', 'Assigned HR', 'Status'].map((h, i) => (
                                    <th key={h} className={`py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${i === 0 || i === 4 ? 'px-6 text-left' : 'px-3 text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="py-16 text-center text-[13px] text-slate-400">Loading students...</td></tr>
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
            <PageHeader title="Student Transfer" subtitle="Move students between HR executives for workload balancing." />
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
                                <p className="text-[11px] text-slate-400 mt-1.5">Search by full ID or just the unique last digits.</p>
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
                                <div>
                                    <div className="text-[13px] font-semibold text-slate-900">{s.name}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{s.department || '—'}</div>
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
    const [hrs, setHrs] = useState<Array<{ id: string; name: string; companyName?: string }>>([]);
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
            <PageHeader title="Add Student" subtitle="Register a student into the evaluation pipeline." />
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
                                <option value="" disabled>Select HR executive...</option>
                                {hrs.map(hr => <option key={hr.id} value={hr.id}>{hr.name}{hr.companyName ? ` — ${hr.companyName}` : ''}</option>)}
                            </select>
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-50">
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding...</>
                                : <><UserPlus size={15} /> Add Student</>}
                        </button>
                    </div>
                </form>
            </FormCard>
        </motion.div>
    );
};

// ─── Send Notifications ───────────────────────────────────────────────────────

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

    const total = selectedHrIds.length + selectedVolunteerIds.length;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <PageHeader title="Notifications" subtitle="Send real-time messages to HR executives and volunteers." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <FormCard title="Compose Message" subtitle="Write or select a quick preset" icon={Bell}>
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
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                                        {selectedHrIds.length === hrs.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                                    {hrs.map(hr => <RecipientItem key={hr.id} name={hr.name} sub={hr.company_name || hr.companyName || ''} selected={selectedHrIds.includes(hr.id)} onClick={() => toggleHr(hr.id)} />)}
                                    {hrs.length === 0 && <p className="text-[12px] text-slate-400 text-center py-6">No HRs found</p>}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className={labelCls + ' mb-0'}>Volunteers ({selectedVolunteerIds.length}/{volunteers.length})</p>
                                    <button onClick={() => setSelectedVolunteerIds(p => p.length === volunteers.length ? [] : volunteers.map(v => v.id))}
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                                        {selectedVolunteerIds.length === volunteers.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="space-y-1.5 max-h-52 overflow-y-auto">
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
                        {[['HRs Selected', selectedHrIds.length], ['Volunteers Selected', selectedVolunteerIds.length], ['Total Recipients', total]].map(([lbl, val], i) => (
                            <div key={lbl as string} className={`flex justify-between items-center ${i === 2 ? 'pt-3 border-t border-slate-100' : ''}`}>
                                <span className="text-[12px] text-slate-500">{lbl}</span>
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
                    <button onClick={handleSend} disabled={sending || !message.trim() || total === 0}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-40">
                        {sending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Send size={14} /> Send Notification</>}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default PipelineDashboard;