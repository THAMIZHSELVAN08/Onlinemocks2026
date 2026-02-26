import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, UserCheck, User, Send, CloudUpload, Users,
    LogOut, Search, Building2,
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

/* --- UI COMPONENTS --- */

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));

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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {title} {highlight && <span className="text-[#2563eb]">{highlight}</span>}
        </h1>
        <div className="h-1 w-20 bg-[#2563eb] rounded-full mt-4" />
    </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}>
        {children}
    </div>
);

/* --- MAIN DASHBOARD --- */

const AdminDashboard = () => {
    const { logout, user } = useAuthStore();
    const location = useLocation();

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-[#0f172a] flex flex-col fixed h-screen z-50 shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#2563eb] rounded-2xl flex items-center justify-center text-white font-black italic">A</div>
                        <h1 className="text-xl font-black text-white tracking-tighter uppercase whitespace-nowrap">Admin <span className="text-[#2563eb]">Control</span></h1>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2 italic px-1">Logged in as {user?.username || 'admin'}</p>
                </div>

                <nav className="flex-1 mt-6">
                    <SidebarLink to="/admin" icon={LayoutGrid} label="Dashboard" />
                    <SidebarLink to="/admin/hrs" icon={UserCheck} label="HR Management" />
                    <SidebarLink to="/admin/volunteers" icon={Users} label="Volunteers" />
                    <SidebarLink to="/admin/transfer" icon={Send} label="Student Transfer" />
                    <SidebarLink to="/admin/uploads" icon={CloudUpload} label="Bulk Imports" />
                    <SidebarLink to="/admin/students" icon={User} label="Students" />
                </nav>

                <div className="p-6 border-t border-white/5">
                    <button
                        onClick={logout}
                        className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-red-400 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 transition-colors italic"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 ml-72 p-14 min-h-screen">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Overview />} />
                        <Route path="/hrs" element={<ManageHRs />} />
                        <Route path="/volunteers" element={<ManageVolunteers />} />
                        <Route path="/students" element={<StudentList />} />
                        <Route path="/transfer" element={<TransferStudents />} />
                        <Route path="/uploads" element={<BulkUploads />} />
                    </Routes>
                </AnimatePresence>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <SectionHeader title="System" highlight="Overview" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-blue-500/5 transition-all group">
                    <div className="p-4 bg-blue-50 text-[#2563eb] w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform"><Users size={28} /></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Students</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.students}</h3>
                </div>
                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-blue-500/5 transition-all group">
                    <div className="p-4 bg-indigo-50 text-indigo-600 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform"><UserCheck size={28} /></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">HR Executives</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.hrs}</h3>
                </div>
                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-blue-500/5 transition-all group">
                    <div className="p-4 bg-blue-50 text-[#2563eb] w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform"><Building2 size={28} /></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Volunteers</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.volunteers}</h3>
                </div>
            </div>

            <Card className="p-10 border-0 shadow-xl shadow-blue-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 text-blue-50 group-hover:rotate-12 transition-transform pointer-events-none">
                    <TrendingUp size={240} />
                </div>
                {/* Insights content removed as per user's latest manual edit preference */}
            </Card>
        </motion.div>
    );
};

const ManageHRs = () => {
    const [hrs, setHrs] = useState<any[]>([]);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', company_name: '' });

    useEffect(() => {
        api.get('/admin/hrs').then(res => setHrs(res.data)).catch(console.error);
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/register/hr', formData);
            alert('HR created successfully');
            setFormData({ name: '', username: '', password: '', company_name: '' });
            api.get('/admin/hrs').then(res => setHrs(res.data));
        } catch { alert('Unable to create HR'); }
    };

    return (
        <div className="space-y-12">
            <div>
                <SectionHeader title="HR" highlight="Management" />
                <Card className="p-12 border-0 shadow-lg shadow-blue-500/5">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 italic">Create a new HR account</h3>
                    <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full name</label>
                            <input className="input-field italic" placeholder="HR name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                            <input className="input-field italic" placeholder="e.g. hr_john" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <input type="password" className="input-field italic" placeholder="********" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company name</label>
                            <input className="input-field italic" placeholder="e.g. Google" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} required />
                        </div>
                        <div className="md:col-span-2 pt-6">
                            <button className="btn-primary w-full py-5 rounded-2xl shadow-blue-200">Create HR</button>
                        </div>
                    </form>
                </Card>
            </div>

            <div>
                <SectionHeader title="HR" highlight="Directory" />
                <Card className="border-0 shadow-lg shadow-blue-500/5">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="w-20 pl-10">S.NO</th>
                                    <th>HR</th>
                                    <th>COMPANY</th>
                                    <th>USERNAME</th>
                                    <th>PASSWORD</th>
                                    <th className="text-center pr-10">LOGS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {hrs.map((hr, idx) => (
                                    <tr key={hr.id} className="group transition-colors hover:bg-slate-50/50">
                                        <td className="pl-10 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="font-extrabold text-slate-900 uppercase tracking-tight italic">{hr.name}</td>
                                        <td><span className="badge-blue">{hr.company_name}</span></td>
                                        <td className="text-slate-500 font-mono text-xs">{hr.username}</td>
                                        <td className="text-slate-400 font-mono text-xs">{hr.plain_password || '••••••••'}</td>
                                        <td className="text-center pr-10">
                                            <span className="text-[10px] font-black text-slate-300 uppercase italic">0</span>
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
        api.get('/admin/volunteers').then(res => setVolunteers(res.data));
        api.get('/admin/hrs').then(res => setHrs(res.data));
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/register/volunteer', formData);
            alert('Volunteer created successfully');
            setFormData({ name: '', username: '', password: '', hrId: '' });
            api.get('/admin/volunteers').then(res => setVolunteers(res.data));
        } catch { alert('Unable to create volunteer'); }
    };

    return (
        <div className="space-y-12">
            <div>
                <SectionHeader title="Volunteers" highlight="Management" />
                <Card className="p-12 border-0 shadow-lg shadow-blue-500/5">
                    <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                            <input className="input-field italic" placeholder="Volunteer Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                            <input className="input-field italic" placeholder="v_john" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <input type="password" className="input-field italic" placeholder="********" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned HR</label>
                            <select className="input-field italic" value={formData.hrId} onChange={e => setFormData({ ...formData, hrId: e.target.value })} required>
                                <option value="">Select HR...</option>
                                {hrs.map(hr => <option key={hr.id} value={hr.id}>{hr.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2 pt-6">
                            <button className="btn-primary w-full py-5 rounded-2xl shadow-blue-200">Create volunteer</button>
                        </div>
                    </form>
                </Card>
            </div>

            <div>
                <SectionHeader title="Volunteers" highlight="Directory" />
                <Card className="border-0 shadow-lg shadow-blue-500/5">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="w-20 pl-10">S.NO</th>
                                    <th>VOLUNTEER</th>
                                    <th>USERNAME</th>
                                    <th>PASSWORD</th>
                                    <th>ASSIGNED HR</th>
                                    <th className="text-center pr-10">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {volunteers.map((v, idx) => (
                                    <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="pl-10 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="font-extrabold text-slate-900 uppercase tracking-tight italic">{v.name}</td>
                                        <td className="text-slate-500 font-mono text-xs">{v.username}</td>
                                        <td className="text-slate-400 font-mono text-xs">{v.plain_password || '••••••••'}</td>
                                        <td className="text-[#2563eb] text-xs font-black uppercase tracking-widest italic">{v.hr_name}</td>
                                        <td className="text-center pr-10">
                                            <span className="badge-blue bg-blue-50 text-[#2563eb] border-blue-100">Active</span>
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

    useEffect(() => {
        api.get('/admin/students/all').then(res => {
            setStudents(res.data);
        }).catch(() => { });
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <SectionHeader title="Students" highlight="Overview" />
            <Card className="border-0 shadow-xl shadow-blue-500/5">
                <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <div className="relative w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563eb] transition-colors" size={20} />
                        <input
                            className="input-field pl-16 h-14 bg-white border-white shadow-sm"
                            placeholder="Search Candidate Identity..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="w-24 pl-10">S.NO</th>
                                <th>STUDENT NAME</th>
                                <th>DEPARTMENT</th>
                                <th>ASSIGNED HR</th>
                                <th className="text-center pr-10">STATUS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.filter(s =>
                                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.register_number.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="pl-10 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                    <td className="font-extrabold text-slate-900 uppercase tracking-tight italic group-hover:text-[#2563eb] transition-colors">{s.name}</td>
                                    <td className="text-slate-500 font-bold text-xs uppercase tracking-widest">{s.department}</td>
                                    <td className="text-[#2563eb] text-xs font-black uppercase tracking-widest italic">{s.hr_name || "Unallocated"}</td>
                                    <td className="text-center pr-10">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic ${s.evaluation_status === 'COMPLETED' ? 'bg-blue-50 text-[#2563eb] border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                            }`}>
                                            {s.evaluation_status === 'COMPLETED' ? 'Finalized' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
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

    useEffect(() => {
        api.get('/admin/hrs').then(res => setHrs(res.data));
    }, []);

    const fetchStudents = (hrId: string) => {
        api.get(`/admin/hrs/${hrId}/students`).then(res => setStudents(res.data));
    };

    const handleTransfer = async () => {
        if (!targetHrId || selectedStudentIds.length === 0) return;
        try {
            await api.post('/admin/students/transfer', {
                studentIds: selectedStudentIds,
                targetHrId
            });
            alert('Transfer completed');
            fetchStudents(selectedHrId);
            setSelectedStudentIds([]);
        } catch { alert('Transfer failed'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <SectionHeader title="Student" highlight="Transfer" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 p-10 shadow-lg border-0">
                    <div className="flex justify-between items-center mb-10">
                        <select
                            className="input-field italic max-w-sm h-14"
                            value={selectedHrId}
                            onChange={(e) => { setSelectedHrId(e.target.value); fetchStudents(e.target.value); }}
                        >
                            <option value="">Select HR...</option>
                            {hrs.map(hr => <option key={hr.id} value={hr.id}>{hr.name}</option>)}
                        </select>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedStudentIds.length} Matched</div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-4 custom-scrollbar">
                        {students.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedStudentIds.includes(s.id)
                                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]'
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'
                                    }`}
                            >
                                <div className="font-extrabold uppercase tracking-tight italic text-sm">{s.name}</div>
                                <div className="text-[10px] font-mono opacity-60">{s.register_number}</div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-10 shadow-lg border-0 h-fit sticky top-10">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 italic">Transfer summary</h3>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Target HR</label>
                            <select className="input-field h-14 italic" value={targetHrId} onChange={(e) => setTargetHrId(e.target.value)}>
                                <option value="">Select Target HR</option>
                                {hrs.filter(h => h.id !== selectedHrId).map(hr => <option key={hr.id} value={hr.id}>{hr.name}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={handleTransfer}
                            disabled={!targetHrId || selectedStudentIds.length === 0}
                            className="btn-primary w-full py-5 rounded-2xl shadow-blue-200 disabled:opacity-30 disabled:shadow-none transition-all uppercase tracking-widest text-[11px] font-black italic"
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <SectionHeader title="Bulk" highlight="Imports" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Card className="p-12 border-0 shadow-lg shadow-blue-500/5 group hover:shadow-xl transition-all">
                    <div className="p-4 bg-blue-50 text-[#2563eb] w-fit rounded-2xl mb-8 group-hover:scale-110 transition-transform"><CloudUpload size={32} /></div>
                    <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight italic">Student import (CSV)</h3>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
                        <p className="text-slate-500 text-xs font-mono">CSV Format: name, username, department</p>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <label className="btn-primary cursor-pointer py-3 px-6 text-[10px] bg-blue-600 text-white hover:bg-blue-700 shadow-none">
                            Choose File
                            <input type="file" className="hidden" onChange={e => e.target.files && setStudentFile(e.target.files[0])} />
                        </label>
                        <span className="text-xs text-slate-400 font-medium italic">{studentFile ? studentFile.name : 'No file chosen'}</span>
                    </div>

                    <button
                        onClick={() => handleUpload('students', studentFile)}
                        disabled={!studentFile}
                        className="btn-primary w-full py-5 rounded-2xl shadow-blue-200 uppercase tracking-widest text-[11px] font-black italic disabled:opacity-30"
                    >
                        Upload Students CSV
                    </button>
                </Card>

                <Card className="p-12 border-0 shadow-lg shadow-blue-500/5 group hover:shadow-xl transition-all">
                    <div className="p-4 bg-blue-50 text-[#2563eb] w-fit rounded-2xl mb-8 group-hover:scale-110 transition-transform"><CloudUpload size={32} /></div>
                    <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight italic">Resume import (PDF)</h3>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
                        <p className="text-slate-500 text-xs font-mono italic leading-relaxed">
                            Format: reg_number.pdf (e.g. 2127230601090.pdf)
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <label className="btn-primary cursor-pointer py-3 px-6 text-[10px] bg-blue-600 text-white hover:bg-blue-700 shadow-none">
                            Choose Files
                            <input type="file" className="hidden" multiple onChange={e => setResumeFiles(e.target.files)} />
                        </label>
                        <span className="text-xs text-slate-400 font-medium italic">
                            {resumeFiles ? `${resumeFiles.length} file(s) selected` : 'No file chosen'}
                        </span>
                    </div>

                    <button
                        onClick={handleBulkResumeUpload}
                        disabled={!resumeFiles}
                        className="btn-primary w-full py-5 rounded-2xl shadow-blue-200 uppercase tracking-widest text-[11px] font-black italic disabled:opacity-30"
                    >
                        Upload Resumes
                    </button>
                </Card>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
