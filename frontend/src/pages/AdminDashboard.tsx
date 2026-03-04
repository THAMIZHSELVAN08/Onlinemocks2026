import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, UserCheck, User, Send, CloudUpload, Users,
    LogOut, Search, Building2, UserPlus, Trash2,
    TrendingUp, ChevronRight, PieChart as PieChartIcon,
    Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell 
} from 'recharts';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

/* --- UI COMPONENTS --- */

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));

    return (
        <Link to={to} className="block px-4 mb-1">
            <div className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[13px] tracking-tight">{label}</span>
            </div>
        </Link>
    );
};

const SectionHeader = ({ title, highlight }: { title: string, highlight?: string }) => (
    <div className="mb-12">
        <h1 className="text-[40px] font-bold text-slate-900 tracking-tight leading-none mb-4">
            {title} <span className="text-blue-600">{highlight}</span>
        </h1>
        <div className="h-1.5 w-16 bg-blue-600 rounded-full" />
    </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 ${className}`}>
        {children}
    </div>
);

/* --- MAIN DASHBOARD --- */

const AdminDashboard = () => {
    const { logout, user } = useAuthStore();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans selection:bg-blue-500/20 overflow-x-hidden">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 bg-[#020617] flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'}`}>
                <div className="p-10">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/30">A</div>
                            <h1 className="text-[20px] font-bold text-white tracking-tight uppercase">
                                Admin <span className="text-blue-400">Panel</span>
                            </h1>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 lg:hidden">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-3 px-1 ml-0.5 opacity-80">Logged in as {user?.username || 'admin'}</p>
                </div>

                <nav className="flex-1 mt-4">
                    <SidebarLink to="/admin" icon={LayoutGrid} label="Dashboard" />
                    <SidebarLink to="/admin/hrs" icon={UserCheck} label="HR Management" />
                    <SidebarLink to="/admin/volunteers" icon={Users} label="Volunteers" />
                    <SidebarLink to="/admin/transfer" icon={Send} label="Student Transfer" />
                    <SidebarLink to="/admin/add-student" icon={UserPlus} label="Add Student" />
                    <SidebarLink to="/admin/uploads" icon={CloudUpload} label="Bulk Imports" />
                    <SidebarLink to="/admin/students" icon={User} label="Students" />
                </nav>

                <div className="px-4 pb-4 mt-auto">
                    <SidebarLink to="/admin/stats" icon={PieChartIcon} label="Statistics" />
                </div>
                
                <div className="p-8 border-t border-white/5">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3.5 px-6 py-4 w-full rounded-2xl text-red-400 font-bold uppercase tracking-[0.15em] text-[11px] hover:bg-red-500/10 transition-all group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
                <header className="h-20 bg-transparent px-8 flex items-center sticky top-0 z-40">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 hover:bg-white rounded-xl shadow-sm transition-all border border-slate-100 ${!isSidebarOpen ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}
                    >
                        <Menu size={20} />
                    </button>
                </header>
                <div className="px-16 pb-16">
                    <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Overview />} />
                        <Route path="/hrs" element={<ManageHRs />} />
                        <Route path="/volunteers" element={<ManageVolunteers />} />
                        <Route path="/students" element={<StudentList />} />
                        <Route path="/transfer" element={<TransferStudents />} />
                        <Route path="/add-student" element={<AddStudent />} />
                        <Route path="/uploads" element={<BulkUploads />} />
                        <Route path="/stats" element={<StatsDashboard />} />
                    </Routes>
                </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

/* --- PAGE COMPONENTS --- */

const Overview = () => {
    const [stats, setStats] = useState({ students: 0, hrs: 0, volunteers: 0 });

    useEffect(() => {
        api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
    }, []);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <SectionHeader title="System" highlight="Overview" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-100 p-8 rounded-[36px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_8px_30px_rgb(59,130,246,0.08)] transition-all duration-300">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <Users size={24} />
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Total Students</p>
                    <h3 className="text-[52px] font-bold text-slate-900 leading-none tracking-tight">{stats.students}</h3>
                </div>

                <div className="bg-white border border-slate-100 p-8 rounded-[36px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_8px_30px_rgb(79,70,229,0.08)] transition-all duration-300">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <UserCheck size={24} />
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">HR Executives</p>
                    <h3 className="text-[52px] font-bold text-slate-900 leading-none tracking-tight">{stats.hrs}</h3>
                </div>

                <div className="bg-white border border-slate-100 p-8 rounded-[36px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_8px_30px_rgb(59,130,246,0.08)] transition-all duration-300">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <Building2 size={24} />
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Volunteers</p>
                    <h3 className="text-[52px] font-bold text-slate-900 leading-none tracking-tight">{stats.volunteers}</h3>
                </div>
            </div>

            <Card className="min-h-[160px] bg-white border border-slate-100 relative overflow-hidden flex items-center px-12">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-slate-400 text-sm font-medium">Ready to manage your portal? Use the sidebar to navigate through management sections.</p>
                </div>
                <div className="absolute top-1/2 right-12 -translate-y-1/2 text-blue-100 opacity-50">
                    <TrendingUp size={120} />
                </div>
            </Card>
        </motion.div>
    );
};

const ManageHRs = () => {
    const [hrs, setHrs] = useState<any[]>([]);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', company_name: '' });

    useEffect(() => {
        api.get('/admin/hrs').then(res => setHrs(res.data)).catch(() => setHrs([]));
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/register/hr', formData);
            alert('HR created successfully');
            setFormData({ name: '', username: '', password: '', company_name: '' });
            api.get('/admin/hrs').then(res => setHrs(res.data));
        } catch (err: any) { 
            const msg = err.response?.data?.message || err.response?.data?.error || 'Unable to create HR';
            alert(msg); 
        }
    };

    const handleDeleteHr = async (hrId: string, hrName: string) => {
        if (!confirm(`Are you sure you want to delete HR "${hrName}"? This will remove all their assignments, evaluations, and feedbacks.`)) return;
        try {
            await api.delete(`/admin/hr/${hrId}`);
            alert('HR deleted successfully');
            setHrs(prev => prev.filter(h => h.id !== hrId));
        } catch { alert('Failed to delete HR.'); }
    };

    return (
        <div className="space-y-16">
            <div>
                <SectionHeader title="HR" highlight="Management" />
                <Card className="p-12">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Create a new HR account</h3>
                    <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-1">Full Name</label>
                            <input className="input-field" placeholder="e.g. Alexander Pierce" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-1">Username</label>
                            <input className="input-field" placeholder="e.g. hr_alex" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-1">Password</label>
                            <input className="input-field" placeholder="Set password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-1">Company Name</label>
                            <input className="input-field" placeholder="e.g. Apple Inc." value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} required />
                        </div>
                        <div className="md:col-span-2 pt-6">
                            <button className="btn-primary w-full">Create HR Account</button>
                        </div>
                    </form>
                </Card>
            </div>

            <div>
                <SectionHeader title="HR" highlight="Details" />
                <Card className="overflow-hidden border border-slate-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md">
                                <tr>
                                    <th className="pl-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">S.NO</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">HR Name</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">Company</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">Username</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">Password</th>
                                    <th className="pr-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">Evaluation</th>
                                    <th className="pr-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {hrs.map((hr, idx) => (
                                    <tr key={hr.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                        <td className="pl-10 py-6 text-[11px] font-bold text-slate-300 font-mono tracking-tighter">
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="py-6">
                                            <span className="font-bold text-slate-900 text-[14px] leading-tight group-hover:text-blue-600 transition-colors duration-200">{hr.name}</span>
                                        </td>
                                        <td className="py-6">
                                            <span className="px-2.5 py-1 bg-white text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 shadow-[0_2px_4px_rgba(37,99,235,0.04)] uppercase tracking-wider whitespace-nowrap">
                                                {hr.company_name || hr.companyName}
                                            </span>
                                        </td>
                                        <td className="py-6 text-slate-500 font-semibold text-[13px] tracking-tight">{hr.username}</td>
                                        <td className="py-6">
                                            <code className="bg-white px-3 py-1.5 rounded-lg text-slate-600 text-[12px] font-bold border border-slate-200/60 shadow-sm font-mono tracking-tighter group-hover:border-blue-200 group-hover:text-blue-700 transition-all duration-200">
                                                {hr.plain_password || 'Normal123'}
                                            </code>
                                        </td>
                                        <td className="pr-10 py-6 text-center">
                                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/50 rounded-full border border-slate-200/50">
                                                <div className="flex -space-x-1.5">
                                                    {[...Array(3)].map((_, i) => (
                                                        <div key={i} className={`w-1.5 h-1.5 rounded-full border border-white ${hr.completed_students > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-tighter">
                                                    {(hr.completed_students || 0)}/{(hr.total_students || 0)} CMPLT
                                                </span>
                                            </div>
                                        </td>
                                        <td className="pr-6 py-6 text-center">
                                            <button onClick={() => handleDeleteHr(hr.id, hr.name)} className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200" title="Delete HR">
                                                <Trash2 size={16} strokeWidth={2} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const ManageVolunteers = () => {
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
            alert('Volunteer created successfully');
            setFormData({ name: '', username: '', password: '', hrId: '' });
            api.get('/admin/volunteers').then(res => setVolunteers(res.data));
        } catch (err: any) { 
            const msg = err.response?.data?.message || err.response?.data?.error || 'Unable to create volunteer';
            alert(msg); 
        }
    };

    const handleDeleteVolunteer = async (volId: string, volName: string) => {
        if (!confirm(`Are you sure you want to delete volunteer "${volName}"?`)) return;
        try {
            await api.delete(`/admin/volunteer/${volId}`);
            alert('Volunteer deleted successfully');
            setVolunteers(prev => prev.filter(v => v.id !== volId));
        } catch { alert('Failed to delete volunteer.'); }
    };

    return (
        <div className="space-y-16">
            <div>
                <SectionHeader title="Volunteers" highlight="Management " />
                <Card className="p-12 shadow-sm border border-slate-200/50">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Create a new volunteer account</h3>
                    <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-1">Full Name</label>
                            <input className="input-field" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-1">Username</label>
                            <input className="input-field" placeholder="e.g. v_john" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-1">Password</label>
                            <input className="input-field" placeholder="Set password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest ml-1">Assigned HR</label>
                            <select className="input-field" value={formData.hrId} onChange={e => setFormData({ ...formData, hrId: e.target.value })} required>
                                <option value="">Select HR Executive...</option>
                                {hrs.map(hr => <option key={hr.id} value={hr.id}>{hr.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2 pt-6">
                            <button className="btn-primary w-full">Create Volunteer Account</button>
                        </div>
                    </form>
                </Card>
            </div>

            <div>
                <SectionHeader title="Volunteers" highlight="Details" />
                <Card className="overflow-hidden border border-slate-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md">
                                <tr>
                                    <th className="pl-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">S.NO</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">Volunteer Name</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">Username</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5">Password</th>
                                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5 pr-10">Assigned HR</th>
                                    <th className="pr-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {volunteers.map((v, idx) => (
                                    <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                        <td className="pl-10 py-6 text-[11px] font-bold text-slate-300 font-mono tracking-tighter">{(idx + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-6 font-bold text-slate-900 text-[14px] leading-tight group-hover:text-blue-600 transition-colors duration-200">{v.name}</td>
                                        <td className="py-6 text-slate-500 font-semibold text-[13px] tracking-tight">{v.username}</td>
                                        <td className="py-6">
                                            <code className="bg-white px-3 py-1.5 rounded-lg text-slate-600 text-[12px] font-bold border border-slate-200/60 shadow-sm font-mono tracking-tighter group-hover:border-blue-200 group-hover:text-blue-700 transition-all duration-200">
                                                {v.plain_password || 'Normal123'}
                                            </code>
                                        </td>
                                        <td className="py-6 pr-10">
                                            <span className="px-2.5 py-1 bg-white text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 shadow-[0_2px_4px_rgba(37,99,235,0.04)] uppercase tracking-wider whitespace-nowrap">
                                                {v.hr_name || 'Not Assigned'}
                                            </span>
                                        </td>
                                        <td className="pr-6 py-6 text-center">
                                            <button onClick={() => handleDeleteVolunteer(v.id, v.name)} className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200" title="Delete Volunteer">
                                                <Trash2 size={16} strokeWidth={2} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const StudentList = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/admin/students/all')
            .then(res => setStudents(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const filteredStudents = students.filter(s => {
        const name = s.name || '';
        const reg = s.register_number || s.registerNumber || '';
        const search = searchTerm.toLowerCase();
        return name.toLowerCase().includes(search) || reg.toLowerCase().includes(search);
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <SectionHeader title="Students" highlight="Directory" />
            <Card className="overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="relative w-full max-w-md group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                        <input
                            className="input-field pl-14 h-14 bg-white"
                            placeholder="Search by name or registration number (e.g. 60190)"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="pl-10 py-5 text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.15em] border-b border-slate-100">S.NO</th>
                                <th className="py-5 text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.15em] border-b border-slate-100">STUDENT NAME</th>
                                <th className="py-5 text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.15em] border-b border-slate-100">DEPARTMENT</th>
                                <th className="py-5 text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.15em] border-b border-slate-100">ASSIGNED HR</th>
                                <th className="pr-10 py-5 text-right text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.15em] border-b border-slate-100">EVALUATION STATUS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50/40 transition-colors group">
                                    <td className="pl-10 py-6 text-[11px] font-bold text-slate-400 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                                    <td className="py-6">
                                        <div className="font-bold text-slate-900 text-[14px] tracking-tight group-hover:text-blue-600 transition-colors">{s.name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{s.register_number || s.registerNumber}</div>
                                    </td>
                                    <td className="py-6">
                                        <span className="text-slate-600 font-bold text-[12px] uppercase tracking-tight">{s.department || "N/A"}</span>
                                    </td>
                                    <td className="py-6">
                                        <span className="text-slate-500 font-semibold text-[13px] tracking-tight">
                                            {s.hr_name || "Unallocated"}
                                        </span>
                                    </td>
                                    <td className="pr-10 py-6 text-right">
                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${s.evaluation_status === 'COMPLETED' 
                                            ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                                            }`}>
                                            {s.evaluation_status === 'COMPLETED' ? 'FINALIZED' : 'PENDING'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <Search size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No matching candidates found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>
    );
};

const TransferStudents = () => {
    const [hrs, setHrs] = useState<any[]>([]);
    const [selectedHrId, setSelectedHrId] = useState('');
    const [targetHrId, setTargetHrId] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        api.get('/admin/hrs').then(res => setHrs(res.data));
    }, []);

    const fetchStudents = (hrId: string) => {
        setSearchQuery('');
        api.get(`/admin/hrs/${hrId}/students`).then(res => {
            if (res.data && res.data.length > 0) setStudents(res.data);
            else setSampleData();
        }).catch(() => setSampleData());
    };

    const setSampleData = () => {
        setStudents([
            { id: 's1', name: 'Rahul Sharma', register_number: '212723060190', department: 'COMPUTER SCIENCE', hr_name: 'Alexander Pierce' },
            { id: 's2', name: 'Priya Patel', register_number: '212723060191', department: 'ELECTRONICS', hr_name: 'Unassigned' },
            { id: 's3', name: 'Vikram Singh', register_number: '212723060192', department: 'INFORMATION TECHNOLOGY', hr_name: 'Michael Chen' },
            { id: 's4', name: 'Sneha Reddy', register_number: '212723060193', department: 'CIVIL', hr_name: 'Emily Watts' },
            { id: 's5', name: 'Arjun Das', register_number: '212723060194', department: 'MECHANICAL', hr_name: 'David Miller' }
        ]);
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.trim()) {
            try {
                const res = await api.get(`/admin/students/global?query=${val}`);
                setStudents(res.data);
                setSelectedHrId('');
            } catch { }
        } else if (selectedHrId) {
            fetchStudents(selectedHrId);
        } else {
            setStudents([]);
        }
    };

    const handleTransfer = async () => {
        if (!targetHrId || selectedStudentIds.length === 0) return;
        try {
            await api.post('/admin/students/transfer', {
                studentIds: selectedStudentIds,
                targetHrId
            });
            alert('Transfer completed');
            if (searchQuery) handleSearch(searchQuery);
            else if (selectedHrId) fetchStudents(selectedHrId);
            setSelectedStudentIds([]);
        } catch { alert('Transfer failed'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <SectionHeader title="Student" highlight="Transfer" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 p-10">
                    <div className="space-y-8 mb-10 pb-10 border-b border-slate-100/50">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Search</label>
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    className="input-field pl-14 h-14 bg-slate-50/50 border-slate-200"
                                    placeholder="Enter name or last 5 digits (e.g. 60190)..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium ml-1">Tip: You can search by the full ID (2127230XXXXX) or just the unique end digits.</p>
                        </div>

                        <div className="flex justify-between items-end gap-6">
                            <div className="space-y-3 flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Filter by  HR</label>
                                <select
                                    className="input-field h-14"
                                    value={selectedHrId}
                                    onChange={(e) => { setSelectedHrId(e.target.value); fetchStudents(e.target.value); }}
                                >
                                    <option value="">Select  HR...</option>
                                    {hrs.map(hr => <option key={hr.id} value={hr.id}>{hr.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Selection</span>
                                <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-5 py-3 rounded-2xl uppercase tracking-[0.15em] border border-blue-100 shadow-sm">
                                    {selectedStudentIds.length} Students Selected
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-4 custom-scrollbar">
                        {students.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedStudentIds.includes(s.id)
                                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50/30'
                                    }`}
                            >
                                <div className="space-y-0.5">
                                    <div className="font-bold tracking-tight text-[15px]">{s.name}</div>
                                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{s.department || 'Not Assigned'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/50">{s.register_number}</div>
                                    <div className="text-[9px] font-bold text-slate-300 uppercase mt-1.5 tracking-tighter">Current: {s.hr_name || 'Unassigned'}</div>
                                </div>
                            </div>
                        ))}
                        {students.length === 0 && (selectedHrId || searchQuery) && (
                            <div className="text-center py-20">
                                <Users className="mx-auto text-slate-200 mb-4" size={48} />
                                <div className="text-slate-400 font-medium tracking-tight">No results found for your query.</div>
                            </div>
                        )}
                        {!selectedHrId && !searchQuery && (
                            <div className="text-center py-20">
                                <Search className="mx-auto text-slate-200 mb-4" size={48} />
                                <div className="text-slate-400 font-medium tracking-tight italic">Enter a Value or select an HR to view students.</div>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-10 h-fit sticky top-10 border border-slate-200/50">
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-10">Allocation Summary</h3>
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target HR </label>
                            <select className="input-field h-14" value={targetHrId} onChange={(e) => setTargetHrId(e.target.value)}>
                                <option value="">Select HR...</option>
                                {hrs.filter(h => h.id !== selectedHrId).map(hr => <option key={hr.id} value={hr.id}>{hr.name}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={handleTransfer}
                            disabled={!targetHrId || selectedStudentIds.length === 0}
                            className="btn-primary w-full disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none"
                        >
                            Execute Transfer
                        </button>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

const BulkUploads = () => {
    const [studentFile, setStudentFile] = useState<File | null>(null);
    const [resumeFiles, setResumeFiles] = useState<FileList | null>(null);

    const handleUpload = async (type: string, file: File | null) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post(`/admin/${type}/bulk`, formData);
            alert('Upload completed successfully');
            if (type === 'students') setStudentFile(null);
        } catch { alert('Upload failed. Please try again.'); }
    };

    const handleBulkResumeUpload = async () => {
        if (!resumeFiles) return;
        const formData = new FormData();
        Array.from(resumeFiles).forEach(file => formData.append('files', file));
        try {
            await api.post('/admin/resumes/bulk', formData);
            alert('Resumes uploaded successfully');
            setResumeFiles(null);
        } catch { alert('Resume upload failed.'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <SectionHeader title="Bulk" highlight="Imports" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Card className="p-12 group">
                    <div className="p-5 bg-blue-50 text-blue-600 w-fit rounded-2xl mb-10 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <CloudUpload size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Student Import</h3>
                    <p className="text-slate-400 text-sm mb-10">Upload a CSV file containing student names, registration numbers, and departments.</p>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6">
                        <p className="text-slate-500 text-xs font-mono leading-relaxed font-semibold italic uppercase tracking-tighter">Format: name, register_number, department, allocated hr, resume (Drive Link/URL)</p>
                    </div>

                    <button
                        onClick={() => {
                            const csvContent = "name,register_number,department,allocated_hr,resume\nJohn Doe,212723060001,Computer Science,HR-Alex,https://drive.google.com/example";
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'student_template.csv';
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="text-[11px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors mb-10 flex items-center gap-2 ml-1"
                    >
                        ↓ Download CSV Template
                    </button>

                    <div className="flex items-center gap-6 mb-10">
                        <label className="bg-blue-50 text-blue-600 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors">
                            Choose CSV File
                            <input type="file" className="hidden" accept=".csv" onChange={e => e.target.files && setStudentFile(e.target.files[0])} />
                        </label>
                        <span className="text-sm text-slate-500 font-medium truncate">{studentFile ? studentFile.name : 'No file chosen'}</span>
                    </div>

                    <button
                        onClick={() => handleUpload('students', studentFile)}
                        disabled={!studentFile}
                        className="btn-primary w-full disabled:opacity-30 disabled:shadow-none"
                    >
                        Upload
                    </button>
                </Card>

                <Card className="p-12 group">
                    <div className="p-5 bg-indigo-50 text-indigo-600 w-fit rounded-2xl mb-10 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <CloudUpload size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Resume Import</h3>
                    <p className="text-slate-400 text-sm mb-10">Upload multiple PDF resumes named after the student's registration number.</p>

                    <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-6 mb-10">
                        <p className="text-indigo-600 text-xs font-mono leading-relaxed font-semibold">
                            Example: 2127230601090.pdf
                        </p>
                    </div>

                    <div className="flex items-center gap-6 mb-10">
                        <label className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors">
                            Choose PDF Files
                            <input type="file" className="hidden" multiple accept=".pdf" onChange={e => setResumeFiles(e.target.files)} />
                        </label>
                        <span className="text-sm text-slate-500 font-medium truncate">
                            {resumeFiles ? `${resumeFiles.length} files selected` : 'No files chosen'}
                        </span>
                    </div>

                    <button
                        onClick={handleBulkResumeUpload}
                        disabled={!resumeFiles}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-5 rounded-2xl font-bold text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/10 transition-all disabled:opacity-30 active:scale-[0.98]"
                    >
                        Upload
                    </button>
                </Card>
            </div>
        </motion.div>
    );
};

const AddStudent = () => {
    const [formData, setFormData] = useState({ name: '', register_number: '', department: '', resume_url: '', hr_id: '' });
    const [hrs, setHrs] = useState<Array<{ id: string, name: string, companyName?: string }>>([]); 
    const [loading, setLoading] = useState(false);

    const departments = [
        "Computer Science",
        "Information Technology",
        "Artificial Intelligence and Data Science",
        "Electronics and Communication Engineering",
        "Electrical and Electronics Engineering",
        "Civil Engineering",
        "Chemical Engineering",
        "Mechanical and Automation Engineering",
        "Mechanical Engineering",
        "Automobile Engineering",
        "Biotechnology"
    ];

    useEffect(() => {
        api.get('/admin/hrs').then((res: any) => setHrs(res.data));
    }, []);

    const isValidDriveLink = (url: string) => {
        if (!url) return true; // empty is allowed
        return /^https:\/\/(drive\.google\.com|docs\.google\.com)\/.+/i.test(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.resume_url && !isValidDriveLink(formData.resume_url)) {
            alert('Please enter a valid Google Drive link.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/admin/add-student', formData);
            alert('Student added and assigned successfully.');
            setFormData({ name: '', register_number: '', department: '', resume_url: '', hr_id: '' });
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to add student.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <SectionHeader title="Add" highlight="Student" />
            <Card className="p-16">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Student Name</label>
                        <input
                            className="input-field h-14"
                            placeholder="Enter Full Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Register ID (12 Digits)</label>
                        <input
                            className="input-field h-14"
                            placeholder="e.g. 212723060190"
                            value={formData.register_number}
                            onChange={e => setFormData({ ...formData, register_number: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Department</label>
                        <select
                            className="input-field h-14"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select Department</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Add Resume Link</label>
                        <input
                            className={`input-field h-14 ${formData.resume_url && !isValidDriveLink(formData.resume_url) ? 'ring-2 ring-red-300 border-red-300' : ''}`}
                            placeholder="Google Drive Link"
                            value={formData.resume_url}
                            onChange={e => setFormData({ ...formData, resume_url: e.target.value })}
                        />
                        {formData.resume_url && !isValidDriveLink(formData.resume_url) && (
                            <p className="text-[10px] text-red-500 font-semibold ml-1">Only Google Drive links are accepted</p>
                        )}
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Select HR</label>
                        <select
                            className="input-field h-14"
                            value={formData.hr_id}
                            onChange={e => setFormData({ ...formData, hr_id: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select HR to assign...</option>
                            {hrs.map(hr => (
                                <option key={hr.id} value={hr.id}>{hr.name}{hr.companyName ? ` — ${hr.companyName}` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2 pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Student'}
                            {!loading && <ChevronRight size={18} strokeWidth={3} />}
                        </button>
                    </div>
                </form>
            </Card>
        </motion.div>
    );
};

const StatsDashboard = () => {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
    }, []);

    if (!stats) return <div className="p-10 font-bold text-slate-400">Loading Stats...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20">
            <SectionHeader title="System" highlight="Statistics" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="p-10 relative lg:col-span-1">
                    <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-10">Department Progress</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.departmentStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
                                <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                                <Bar dataKey="evaluated" stackId="a" fill="#0055ff" name="Evaluated" radius={[0, 0, 8, 8]} barSize={32} />
                                <Bar dataKey="pending" stackId="a" fill="#e2e8f0" name="Pending" radius={[8, 8, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-10 relative">
                    <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-10">Overall Distribution</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie 
                                    data={[
                                        { name: 'Evaluated', value: stats.overall?.evaluatedStudents || 0 },
                                        { name: 'Pending', value: stats.overall?.pendingStudents || 0 }
                                    ]} 
                                    cx="50%" cy="45%" innerRadius={90} outerRadius={125} 
                                    paddingAngle={5} dataKey="value" stroke="none"
                                >
                                    <Cell fill="#0055ff" />
                                    <Cell fill="#cbd5e1" />
                                </Pie>
                                <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
                                <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingTop: '20px'}} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-10 relative lg:col-span-1">
                    <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-10">Overall HR Performance</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie 
                                    data={[
                                        { name: 'Evaluated', value: stats.overall?.evaluatedStudents || 0 },
                                        { name: 'Pending', value: stats.overall?.pendingStudents || 0 }
                                    ]} 
                                    cx="50%" cy="45%" innerRadius={90} outerRadius={125} 
                                    paddingAngle={5} dataKey="value" stroke="none"
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#cbd5e1" />
                                </Pie>
                                <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
                                <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingTop: '20px'}} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <Card className="p-10">
                <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-10">Individual HR Performance</h3>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.hrStats} layout="vertical" margin={{ left: 60, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f8fafc" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#475569'}} />
                            <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
                            <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingBottom: '20px'}} verticalAlign="top" align="right" />
                            <Bar dataKey="evaluated" stackId="hr" fill="#10b981" name="Evaluated" radius={[0, 0, 0, 0]} barSize={24} />
                            <Bar dataKey="pending" stackId="hr" fill="#e2e8f0" name="Pending" radius={[0, 8, 8, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </motion.div>
    );
};

export default AdminDashboard;
