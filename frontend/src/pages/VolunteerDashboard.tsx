import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, UserPlus, LogOut, Users, Activity,
    CheckCircle2, Clock, Menu, X,
    ChevronDown, PanelLeft, User, Search, Filter,
    HelpCircle, Bell, Star, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import { socket } from '../api/socket';
import { toast } from 'sonner';

interface Notification {
    id: string;
    title: string | null;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

interface FeedbackFormState {
    clarityOfInstructions: number;
    hrCooperation: number;
    organizationOfSchedule: number;
    softwareEase: number;
    workloadManagement: number;
    overallExperience: number;
    issuesFaced: string;
    improvementSuggestions: string;
    additionalComments: string;
}

// ─── Sidebar Link ─────────────────────────────────────────────────────────────

const SidebarLink = ({
    to, icon: Icon, label, collapsed,
}: {
    to: string; icon: React.ElementType; label: string; collapsed: boolean;
}) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/volunteer' && location.pathname.startsWith(to));

    return (
        <Link to={to} className="block">
            <div
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${collapsed ? 'justify-center' : ''} ${isActive
                        ? 'bg-green-50 text-green-700'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
            >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                {!collapsed && (
                    <span className={`text-[13px] truncate ${isActive ? 'font-semibold text-green-700' : 'font-medium'}`}>
                        {label}
                    </span>
                )}
                {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />}
            </div>
        </Link>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const STAT_THEMES = [
    { bg: 'bg-emerald-50', icon: 'bg-emerald-500', value: 'text-emerald-800', label: 'text-emerald-600' },
    { bg: 'bg-slate-100', icon: 'bg-slate-500', value: 'text-slate-800', label: 'text-slate-500' },
];

function StatCard({ title, value, icon: Icon, themeIndex = 0 }: {
    title: string; value: number | string; icon: React.ElementType; themeIndex?: number;
}) {
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const VolunteerDashboard = () => {
    const { logout, user } = useAuthStore();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/volunteer/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/volunteer/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) { console.error("Failed to mark as read", err); }
    };

    const markAllAsRead = async () => {
        try {
            await api.post("/volunteer/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("All caught up!");
        } catch (err) { console.error("Failed to mark all as read", err); }
    };

    useEffect(() => {
        fetchNotifications();
        if (user?.id) {
            socket.on('student_transferred', () => {
                fetchNotifications();
            });
            socket.on('admin_notification', () => {
                fetchNotifications();
            });
        }
        return () => {
            socket.off('student_transferred');
            socket.off('admin_notification');
        };
    }, [user]);

    const navLabel =
        location.pathname === '/volunteer' ? 'Dashboard' :
            location.pathname === '/volunteer/notifications' ? 'Notifications' :
                location.pathname === '/volunteer/feedback' ? 'Event Feedback' :
                    location.pathname.startsWith('/volunteer/enroll') ? 'Add Student' : '';

    return (
        <div className="bg-slate-100 font-sans text-slate-900 md:p-2 flex gap-0" style={{ height: '100vh' }}>

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" />
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col bg-slate-100 transition-all duration-300 overflow-hidden shrink-0 ${sidebarOpen ? 'md:w-56' : 'md:w-0'}`}>
                {/* Brand */}
                <div className="h-28 px-6 flex flex-col justify-center border-b border-slate-200/60">
                    <img src="/forese.png" alt="FORESE" className="h-16 w-auto self-start" />
                    {sidebarOpen && (
                        <div className="mt-2 text-left">
                            <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100/50">
                                Volunteer Portal
                            </span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    <SidebarLink to="/volunteer" icon={LayoutGrid} label="Dashboard" collapsed={!sidebarOpen} />

                    {sidebarOpen && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-5 pb-1.5">Actions</p>}
                    {!sidebarOpen && <div className="my-3 border-t border-slate-200" />}

                    <SidebarLink to="/volunteer/enroll" icon={UserPlus} label="Add Student" collapsed={!sidebarOpen} />
                    <SidebarLink to="/volunteer/feedback" icon={Star} label="Event Feedback" collapsed={!sidebarOpen} />
                    <SidebarLink to="/volunteer/notifications" icon={Bell} label="Notifications" collapsed={!sidebarOpen} />

                    {sidebarOpen && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-5 pb-1.5">Support</p>}
                    {!sidebarOpen && <div className="my-3 border-t border-slate-200" />}
                    <SidebarLink to="/volunteer/docs" icon={HelpCircle} label="Help & Docs" collapsed={!sidebarOpen} />
                </nav>

                {/* Logout */}
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
                            Volunteer Portal
                        </span>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    <SidebarLink to="/volunteer" icon={LayoutGrid} label="Dashboard" collapsed={false} />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-4 pb-1">Actions</p>
                    <SidebarLink to="/volunteer/enroll" icon={UserPlus} label="Add Student" collapsed={false} />
                    <SidebarLink to="/volunteer/feedback" icon={Star} label="Event Feedback" collapsed={false} />
                    <SidebarLink to="/volunteer/notifications" icon={Bell} label="Notifications" collapsed={false} />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-4 pb-1">Support</p>
                    <SidebarLink to="/volunteer/docs" icon={HelpCircle} label="Help & Docs" collapsed={false} />
                </nav>
                <div className="px-3 pb-6">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <LogOut size={17} /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden md:rounded-2xl md:border md:border-slate-200 bg-white md:shadow-sm">

                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                            <Menu size={20} />
                        </button>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                            <PanelLeft size={18} />
                        </button>
                        <div className="hidden sm:flex items-center gap-2 text-[13px]">
                            <span className="text-slate-400 font-medium">Volunteer Hub</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-800 font-semibold">{navLabel}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[12px] text-slate-500">
                            <Clock size={13} className="text-slate-400" />
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2.5 cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                <User size={15} className="text-slate-400" />
                            </div>
                            <span className="text-[13px] font-semibold text-slate-800 hidden sm:block">
                                {user?.name || 'Volunteer'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8 pb-16">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<Overview />} />
                            <Route path="/enroll" element={<EnrollStudent />} />
                            <Route path="/feedback" element={<EventFeedback />} />
                            <Route path="/notifications" element={<Notifications notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} />} />
                        </Routes>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

// ─── Overview ─────────────────────────────────────────────────────────────────

const Overview = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ enrolledToday: 0, totalEnrolled: 0 });
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);

    const DEPARTMENTS = [
        "Computer Science", "Information Technology", "Artificial Intelligence and Data Science",
        "Electronics and Communication Engineering", "Electrical and Electronics Engineering",
        "Civil Engineering", "Chemical Engineering", "Mechanical and Automation Engineering",
        "Mechanical Engineering", "Automobile Engineering", "Biotechnology",
    ];

    const fetchData = async () => {
        try {
            const [statsRes, studentsRes] = await Promise.all([
                api.get('/volunteer/stats'),
                api.get('/volunteer/students'),
            ]);
            setStats(statsRes.data);
            setStudents(studentsRes.data);
        } catch (err) {
            console.error('Data fetch failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (user?.id) {
            socket.connect();
            socket.emit('join_room', { room: user.id });
            socket.on('student_transferred', (data: { message: string; count: number }) => {
                toast.success('New Student Added', { description: data.message });
                fetchData();
            });
            socket.on('admin_notification', (data: { title: string; message: string }) => {
                toast.info(data.title, { description: data.message });
            });
        }
        const interval = setInterval(fetchData, 30000);
        return () => {
            clearInterval(interval);
            socket.off('student_transferred');
            socket.off('admin_notification');
            socket.disconnect();
        };
    }, [user]);

    const filteredStudents = students.filter(s => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = (s.name ?? '').toLowerCase().includes(q) || (s.register_number ?? '').toLowerCase().includes(q);
        const matchesDept = filterDept === 'ALL' || s.department === filterDept;
        const matchesStatus = filterStatus === 'ALL' ||
            (filterStatus === 'COMPLETED'
                ? (s.evaluation_status === 'COMPLETED' || s.status === 'COMPLETED')
                : (s.evaluation_status !== 'COMPLETED' && s.status !== 'COMPLETED'));
        return matchesSearch && matchesDept && matchesStatus;
    });

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Dashboard</h1>
                <p className="text-[13px] text-slate-500">Live status of your assigned students.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard title="Students Evaluated" value={stats.enrolledToday} icon={Activity} themeIndex={0} />
                <StatCard title="Total Assigned" value={stats.totalEnrolled} icon={Users} themeIndex={1} />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {/* Search + Filter bar */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                            placeholder="Search by name or register number..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(true)}
                        className={`flex items-center gap-2 h-10 px-4 rounded-xl border text-[13px] font-medium transition-all ${filterDept !== 'ALL' || filterStatus !== 'ALL'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                    >
                        <Filter size={15} /> Filters
                        {(filterDept !== 'ALL' || filterStatus !== 'ALL') && (
                            <span className="bg-white/30 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">Active</span>
                        )}
                    </button>
                </div>

                {/* Filter Modal */}
                <AnimatePresence>
                    {showFilters && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowFilters(false)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[15px] font-semibold text-slate-900">Filter Students</h3>
                                    <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={18} /></button>
                                </div>
                                <div className="px-6 py-5 space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                        <div className="relative">
                                            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                                                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-9 text-[13px] text-slate-700 font-medium outline-none appearance-none cursor-pointer">
                                                {['ALL', ...DEPARTMENTS].map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
                                            </select>
                                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                        <div className="relative">
                                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-9 text-[13px] text-slate-700 font-medium outline-none appearance-none cursor-pointer">
                                                <option value="ALL">All Status</option>
                                                <option value="COMPLETED">Evaluated</option>
                                                <option value="PENDING">Awaiting</option>
                                            </select>
                                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                                    <button onClick={() => { setFilterDept('ALL'); setFilterStatus('ALL'); }}
                                        className="flex-1 h-10 rounded-xl text-[13px] font-medium text-slate-500 hover:text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-all">
                                        Reset
                                    </button>
                                    <button onClick={() => setShowFilters(false)}
                                        className="flex-[2] h-10 bg-emerald-500 text-white rounded-xl text-[13px] font-semibold hover:bg-emerald-600 transition-all">
                                        Apply Filters
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                        <colgroup>
                            <col style={{ width: '52px' }} />
                            <col style={{ width: '35%' }} />
                            <col />
                            <col style={{ width: '140px' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">#</th>
                                <th className="px-3 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                                <th className="px-3 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-[13px] text-slate-400">
                                        Loading students...
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-[13px] text-slate-400">
                                        No students found.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s, i) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-[12px] text-slate-300 font-mono">{String(i + 1).padStart(2, '0')}</td>
                                        <td className="px-3 py-4">
                                            <div className="text-[13px] font-semibold text-slate-900 truncate">{s.name}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{s.register_number}</div>
                                        </td>
                                        <td className="px-3 py-4 text-[12px] text-slate-500 truncate">{s.department || 'General'}</td>
                                        <td className="px-6 py-4">
                                            {s.evaluation_status === 'COMPLETED' || s.status === 'COMPLETED' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-semibold border border-emerald-100">
                                                    <CheckCircle2 size={11} /> Evaluated
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-semibold border border-amber-100">
                                                    <Clock size={11} /> Awaiting
                                                </span>
                                            )}
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

// ─── Enroll Student ───────────────────────────────────────────────────────────

const EnrollStudent = () => {
    const [formData, setFormData] = useState({
        name: '', register_number: '', department: '', resume_url: '',
    });

    const departments = [
        'Computer Science', 'Information Technology', 'Artificial Intelligence and Data Science',
        'Electronics and Communication Engineering', 'Electrical and Electronics Engineering',
        'Civil Engineering', 'Chemical Engineering', 'Mechanical and Automation Engineering',
        'Mechanical Engineering', 'Automobile Engineering', 'Biotechnology',
    ];

    const isValidDriveLink = (url: string) =>
        !url || /^https:\/\/(drive\.google\.com|docs\.google\.com)\/.+/i.test(url);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.resume_url && !isValidDriveLink(formData.resume_url)) {
            alert('Please enter a valid Google Drive link.');
            return;
        }
        try {
            await api.post('/volunteer/enroll', formData);
            alert('Student registered successfully.');
            setFormData({ name: '', register_number: '', department: '', resume_url: '' });
        } catch {
            alert('Registration failed. Please try again.');
        }
    };

    const inputClass = "w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all";
    const labelClass = "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2";

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Add Student</h1>
                <p className="text-[13px] text-slate-500">Register a new student to your assigned cohort.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                            <UserPlus size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-semibold text-slate-900">Student Details</h2>
                            <p className="text-[12px] text-slate-400 mt-0.5">Fill in the student's information below</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Student Name</label>
                            <input
                                className={inputClass}
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Register Number</label>
                            <input
                                className={inputClass}
                                placeholder="e.g. 212723060190"
                                value={formData.register_number}
                                onChange={e => setFormData({ ...formData, register_number: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Department</label>
                            <div className="relative">
                                <select
                                    className={`${inputClass} appearance-none pr-9 cursor-pointer`}
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select department</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Resume Link</label>
                            <input
                                className={`${inputClass} ${formData.resume_url && !isValidDriveLink(formData.resume_url) ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                                placeholder="Google Drive link"
                                value={formData.resume_url}
                                onChange={e => setFormData({ ...formData, resume_url: e.target.value })}
                                required
                            />
                            {formData.resume_url && !isValidDriveLink(formData.resume_url) && (
                                <p className="text-[11px] text-red-500 font-medium mt-1.5">Only Google Drive links are accepted.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[13px] font-semibold transition-all shadow-sm active:scale-95"
                        >
                            <UserPlus size={15} /> Add Student
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

// ─── Notifications ────────────────────────────────────────────────────────────

const Notifications = ({ notifications, markAsRead, markAllAsRead }: {
    notifications: Notification[];
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Notifications</h1>
                    <p className="text-[13px] text-slate-500">Stay updated on student transfers and platform alerts.</p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {notifications.length > 0 ? (
                    notifications.map((n) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => !n.isRead && markAsRead(n.id)}
                            className={`group p-4 bg-white rounded-2xl border transition-all cursor-pointer ${n.isRead ? "border-slate-100 opacity-75" : "border-emerald-100 bg-emerald-50/10 shadow-sm"
                                } hover:border-emerald-200`}
                        >
                            <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${n.isRead ? "bg-slate-50 text-slate-400" : "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                    }`}>
                                    <Bell size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`text-[14px] font-bold truncate ${n.isRead ? "text-slate-600" : "text-slate-900"}`}>
                                            {n.title || "Notification"}
                                        </h3>
                                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                                            {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-[13px] leading-relaxed ${n.isRead ? "text-slate-400" : "text-slate-600"}`}>
                                        {n.message}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Bell size={24} className="text-slate-300" />
                        </div>
                        <h3 className="text-[15px] font-bold text-slate-800">Clear as a whistle!</h3>
                        <p className="text-[12px] text-slate-400 mt-1">You're all caught up with your notifications.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ─── Event Feedback ───────────────────────────────────────────────────────────

const FEEDBACK_TEXT_FIELDS = [
    {
        key: 'issuesFaced' as keyof FeedbackFormState,
        label: 'Issues Faced During Your Shift',
        description: 'Describe any problems or challenges you encountered.',
        placeholder: 'e.g. Technical issues, coordination gaps, student behaviour concerns...',
    },
    {
        key: 'improvementSuggestions' as keyof FeedbackFormState,
        label: 'Suggestions for Improvement',
        description: 'What could make this process better for future drives?',
        placeholder: 'e.g. Better scheduling, clearer briefings, improved platform features...',
    },
    {
        key: 'additionalComments' as keyof FeedbackFormState,
        label: 'Additional Comments',
        description: 'Any other thoughts, shoutouts, or final remarks.',
        placeholder: 'e.g. Any final thoughts or general observations...',
    },
];

const RATING_CRITERIA = [
    {
        key: 'clarityOfInstructions' as keyof FeedbackFormState,
        label: 'Clarity of Instructions',
        sub: 'How clearly were your responsibilities and tasks explained by HR?',
    },
    {
        key: 'hrCooperation' as keyof FeedbackFormState,
        label: 'HR Cooperation & Support',
        sub: 'How supportive and approachable were the HR coordinators?',
    },
    {
        key: 'organizationOfSchedule' as keyof FeedbackFormState,
        label: 'Interview Schedule Organization',
        sub: 'How well were interviews scheduled and conducted on time?',
    },
    {
        key: 'softwareEase' as keyof FeedbackFormState,
        label: 'Software & System Usability',
        sub: 'How easy was the platform to use for managing candidates?',
    },
    {
        key: 'workloadManagement' as keyof FeedbackFormState,
        label: 'Workload Management',
        sub: 'Was the workload assigned to you reasonable and manageable?',
    },
    {
        key: 'overallExperience' as keyof FeedbackFormState,
        label: 'Overall Experience',
        sub: 'Your overall experience assisting with the interview process.',
    },
];

function RatingRow({ index, label, sub, value, onChange }: {
    index: number; label: string; sub: string; value: number; onChange: (v: number) => void;
}) {
    const getButtonStyle = (n: number) => {
        if (value !== n) return 'bg-white border border-blue-100 text-blue-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50';
        if (n <= 4) return 'bg-red-500 border-red-500 text-white shadow shadow-red-200';
        if (n <= 6) return 'bg-amber-400 border-amber-400 text-white shadow shadow-amber-200';
        if (n <= 8) return 'bg-blue-500 border-blue-500 text-white shadow shadow-blue-200';
        return 'bg-blue-700 border-blue-700 text-white shadow shadow-blue-300';
    };

    const sentimentLabel = (v: number) => {
        if (!v) return null;
        if (v <= 4) return <span className="text-[10px] font-semibold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">Needs Work</span>;
        if (v <= 6) return <span className="text-[10px] font-semibold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Fair</span>;
        if (v <= 8) return <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Good</span>;
        return <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Excellent</span>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${value > 0 ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100 bg-white'
                }`}
        >
            <div className="px-5 pt-5 pb-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[12px] font-extrabold ${value > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                    {String(index + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-bold text-slate-800">{label}</span>
                        {sentimentLabel(value)}
                        {value > 0 && (
                            <span className="ml-auto text-[18px] font-extrabold text-blue-600 leading-none">{value}<span className="text-[11px] text-blue-300 font-semibold">/10</span></span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed">{sub}</p>
                </div>
            </div>
            <div className="px-5 pb-5">
                <div className="flex gap-1.5 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => onChange(n)}
                            className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all ${getButtonStyle(n)}`}
                        >
                            {n}
                        </button>
                    ))}
                    <span className="ml-auto self-center text-[10px] text-slate-300 font-medium">1 = Poor &nbsp;·&nbsp; 10 = Excellent</span>
                </div>
            </div>
        </motion.div>
    );
}

const EventFeedback = () => {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState<FeedbackFormState>({
        clarityOfInstructions: 0,
        hrCooperation: 0,
        organizationOfSchedule: 0,
        softwareEase: 0,
        workloadManagement: 0,
        overallExperience: 0,
        issuesFaced: '',
        improvementSuggestions: '',
        additionalComments: '',
    });

    const ratedCount = RATING_CRITERIA.filter(c => (form[c.key] as number) > 0).length;
    const textFilled = FEEDBACK_TEXT_FIELDS.every(f => (form[f.key] as string).trim().length > 0);
    const isFormComplete = ratedCount === RATING_CRITERIA.length && textFilled;

    const resetForm = () => setForm({
        clarityOfInstructions: 0, hrCooperation: 0, organizationOfSchedule: 0,
        softwareEase: 0, workloadManagement: 0, overallExperience: 0,
        issuesFaced: '', improvementSuggestions: '', additionalComments: '',
    });

    const handleSubmit = async () => {
        if (!isFormComplete) {
            toast.error("Form Incomplete", { description: "Please answer all questions before submitting." });
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/volunteer/feedback', form);
            setSubmitted(true);
        } catch {
            toast.error("Submission Failed", { description: "Could not submit your feedback. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Success screen ── */
    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[65vh] text-center px-6"
            >
                <div className="relative mb-7">
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-300">
                        <CheckCircle2 size={44} className="text-white" strokeWidth={1.75} />
                    </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-3">
                    Feedback Received
                </div>
                <h2 className="text-[28px] font-extrabold text-slate-900 mb-2 leading-tight">Thank you for your input!</h2>
                <p className="text-[14px] text-slate-500 max-w-xs leading-relaxed mb-8">
                    Your feedback has been recorded and will help us improve future placement drives.
                </p>
                <button
                    onClick={() => { setSubmitted(false); resetForm(); }}
                    className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                    Submit Another Response
                </button>
            </motion.div>
        );
    }

    /* ── Main form ── */
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full pb-20"
        >

            {/* ── Section 1: Ratings ── */}
            <div className="w-full max-w-3xl mb-2 mt-4">
                <div className="flex items-center gap-2.5 mb-4 px-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shrink-0">1</div>
                    <div>
                        <h2 className="text-[14px] font-extrabold text-slate-800 leading-none">Performance Ratings</h2>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">All six criteria are required. Select a score from 1–10.</p>
                    </div>
                </div>

                <div className="space-y-2.5">
                    {RATING_CRITERIA.map((c, i) => (
                        <RatingRow
                            key={c.key}
                            index={i}
                            label={c.label}
                            sub={c.sub}
                            value={form[c.key] as number}
                            onChange={v => setForm(p => ({ ...p, [c.key]: v }))}
                        />
                    ))}
                </div>
            </div>

            {/* ── Section 2: Text Feedback ── */}
            <div className="w-full max-w-3xl mt-7">
                <div className="flex items-center gap-2.5 mb-4 px-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shrink-0">2</div>
                    <div>
                        <h2 className="text-[14px] font-extrabold text-slate-800 leading-none">Written Feedback</h2>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Please share your detailed thoughts. All fields are required.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                    {FEEDBACK_TEXT_FIELDS.map((field) => (
                        <div key={field.key} className="px-6 py-5">
                            <div className="flex items-center gap-2 mb-1">
                                <label className="text-[13px] font-bold text-slate-700">{field.label}</label>
                                <span className="ml-auto text-[10px] text-blue-500 font-bold uppercase tracking-wider">Required</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mb-3">{field.description}</p>
                            <textarea
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-700 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder-slate-300 leading-relaxed"
                                placeholder={field.placeholder}
                                value={form[field.key] as string}
                                onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Submit bar ── */}
            <div className="w-full max-w-3xl mt-8">
                <div className={`rounded-2xl border px-8 py-5 flex items-center justify-between gap-4 transition-all ${isFormComplete
                        ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-200'
                        : 'bg-white border-slate-100 shadow-sm outline outline-1 outline-slate-50'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isFormComplete ? 'bg-white animate-pulse' : 'bg-slate-200'}`} />
                        <span className={`text-[13px] font-bold ${isFormComplete ? 'text-white' : 'text-slate-400'}`}>
                            {isFormComplete ? 'Ready to Submit' : 'Incomplete Form'}
                        </span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !isFormComplete}
                        className={`h-11 px-10 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all active:scale-95 shrink-0 ${isFormComplete
                                ? 'bg-white text-blue-700 hover:bg-blue-50 hover:shadow-lg'
                                : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                            }`}
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </div>
            </div>

        </motion.div>
    );
};

export default VolunteerDashboard;