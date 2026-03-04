import { useState, useEffect } from "react";
import {
  Search,
  Users,
  LogOut,
  Loader2,
  LayoutGrid,
  HelpCircle,
  ChevronDown,
  UserPlus,
  Activity,
  ChevronRight,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import api from "../api/axios";

// ─── UI Components ────────────────────────────────────────────────────────────

function SectionHeader({ title, highlight }: { title: string; highlight?: string }) {
  return (
    <header className="mb-10">
      <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">
        {title} <span className="text-emerald-600">{highlight}</span>
      </h1>
      <p className="text-slate-400 font-medium text-[15px]">Volunteer administrative control center.</p>
    </header>
  );
}

function CircularStatCard({ 
  label, 
  value, 
  total, 
  icon: Icon, 
  colorClass, 
  ringColorClass, 
  iconBgClass, 
}: { 
  label: string; 
  value: number; 
  total: number; 
  icon: any; 
  colorClass: string;
  ringColorClass: string;
  iconBgClass: string;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const displayPercentage = label === "Total Assigned" ? 100 : percentage;
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 flex flex-col items-center justify-center gap-4 group hover:shadow-xl hover:shadow-black/5 transition-all duration-500">
      <div className="w-full flex justify-start">
        <div className={`p-2 rounded-xl ${iconBgClass} ${colorClass}`}>
          <Icon size={16} strokeWidth={3} />
        </div>
      </div>
      
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-50"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
            strokeLinecap="round"
            className={`${ringColorClass}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black text-slate-900 tracking-tighter">{value}</span>
        </div>
      </div>

      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function VolunteerDashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "enroll">("overview");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes] = await Promise.all([
        api.get("/volunteer/students")
      ]);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const isValidDriveLink = (url: string) => {
    if (!url) return true;
    return /^https:\/\/(drive\.google\.com|docs\.google\.com)\/.+/i.test(url);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.resume_url && !isValidDriveLink(formData.resume_url)) {
      alert('Please enter a valid Google Drive link.');
      return;
    }
    try {
      await api.post('/volunteer/enroll', formData);
      alert('Student identity successfully registered.');
      setFormData({ name: '', register_number: '', department: '', resume_url: '' });
      fetchData();
      setActiveTab("overview");
    } catch { 
      alert('Enrolment protocol failed.'); 
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.register_number.toLowerCase().includes(q);
  });

  return (
    <div className="flex bg-[#F7F8FA] min-h-screen font-sans text-slate-900 selection:bg-emerald-600/10 selection:text-emerald-600">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 z-50 p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Volunteer Portal</span>
        </div>

        <nav className="space-y-1">
          <SidebarLink active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutGrid} label="Dashboard" badge />
          
          <div className="mt-8 mb-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Registration</div>
          <SidebarLink active={activeTab === "enroll"} onClick={() => setActiveTab("enroll")} icon={UserPlus} label="Add Student" />
          
          <div className="mt-8 mb-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Support</div>
          <SidebarLink active={false} onClick={() => {}} icon={HelpCircle} label="Documentation" />
        </nav>

        <div className="mt-auto pt-10">
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex flex-col flex-1 pl-64">
        <header className="h-20 bg-[#F7F8FA] border-b border-slate-200/40 px-10 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
           <div className="flex items-center gap-8">
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-slate-200 transition-all">
                    {user?.name?.[0] || 'V'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-slate-900">{user?.name || 'Volunteer'}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
              </div>
              
              <div onClick={logout} className="p-2 text-slate-400 hover:text-red-500 cursor-pointer transition-colors" title="Logout">
                 <LogOut size={20} />
              </div>
           </div>
        </header>

        <main className="p-10 pb-20 relative">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-pulse">Initializing Interface...</p>
             </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <SectionHeader title="Evaluation" highlight="Overview" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
                    <CircularStatCard 
                      label="Total Assigned" 
                      value={students.length} 
                      total={students.length} 
                      icon={Users} 
                      colorClass="text-indigo-600" 
                      ringColorClass="text-indigo-500"
                      iconBgClass="bg-indigo-50"
                    />
                    <CircularStatCard 
                      label="Evaluated" 
                      value={students.filter(s => s.evaluation_status === 'COMPLETED').length} 
                      total={students.length} 
                      icon={CheckCircle2} 
                      colorClass="text-emerald-600" 
                      ringColorClass="text-emerald-500"
                      iconBgClass="bg-emerald-50"
                    />
                    <CircularStatCard 
                      label="Pending" 
                      value={students.filter(s => s.evaluation_status !== 'COMPLETED' && s.evaluation_status !== 'NO_SHOW').length} 
                      total={students.length} 
                      icon={Clock} 
                      colorClass="text-amber-600" 
                      ringColorClass="text-amber-400"
                      iconBgClass="bg-amber-50"
                    />
                    <CircularStatCard 
                      label="No Show" 
                      value={students.filter(s => s.evaluation_status === 'NO_SHOW').length} 
                      total={students.length} 
                      icon={X} 
                      colorClass="text-red-600" 
                      ringColorClass="text-red-500"
                      iconBgClass="bg-red-50"
                    />
                  </div>

                  <div className="max-w-6xl bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0">
                       <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Assigned Students Stream</h3>
                       <div className="relative group flex-1 max-w-xs mx-8">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={14} />
                          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl h-10 pl-10 pr-4 text-[12px] font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all" placeholder="Quick search..." />
                       </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                              <tr className="bg-slate-50/50">
                                 <th className="pl-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">S.No</th>
                                 <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                                 <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                                 <th className="pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Evaluation Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredStudents.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching records found</td>
                                </tr>
                              ) : (
                                filteredStudents.map((s, idx) => (
                                   <tr key={s.id} className="group hover:bg-slate-50/30 transition-all">
                                      <td className="pl-8 py-5 text-center text-[11px] font-bold text-slate-400">
                                         {(idx + 1).toString().padStart(2, '0')}
                                      </td>
                                      <td className="py-5">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                               {s.name[0]}
                                            </div>
                                            <div>
                                               <div className="text-[13px] font-bold text-slate-900 tracking-tight">{s.name}</div>
                                               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.register_number}</div>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="py-5 lowercase first-letter:uppercase">
                                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{s.department || "General"}</span>
                                      </td>
                                      <td className="pr-8 py-5 text-center">
                                         <div className="flex items-center justify-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${s.evaluation_status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`} />
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${s.evaluation_status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
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
              )}

              {activeTab === "enroll" && (
                <motion.div key="enroll" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-10">
                   <SectionHeader title="Add" highlight="Student" />

                   <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-12 space-y-16 overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                      
                      <form onSubmit={handleEnrollSubmit} className="space-y-12">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Student Full Name</label>
                               <input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-8 text-sm font-bold placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all" placeholder="Full legal name" required />
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Register Number</label>
                               <input value={formData.register_number} onChange={(e) => setFormData(p => ({ ...p, register_number: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-8 text-sm font-bold placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all" placeholder="12-digit student ID" required />
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Department</label>
                               <select value={formData.department} onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-8 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all appearance-none" required>
                                  <option value="" disabled>Select Department</option>
                                  {departments.map(dept => (
                                      <option key={dept} value={dept}>{dept}</option>
                                  ))}
                               </select>
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Resume Link (Google Drive)</label>
                               <input value={formData.resume_url} onChange={(e) => setFormData(p => ({ ...p, resume_url: e.target.value }))} className={`w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-8 text-sm font-bold placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all ${formData.resume_url && !isValidDriveLink(formData.resume_url) ? 'border-red-500' : ''}`} placeholder="Drive link" required />
                               {formData.resume_url && !isValidDriveLink(formData.resume_url) && (
                                   <p className="text-[9px] text-red-500 font-black uppercase tracking-widest ml-1 animate-pulse">Invalid Google Drive Link Format</p>
                               )}
                            </div>
                         </div>

                         <div className="pt-6 flex justify-end">
                            <button type="submit" className="px-16 py-5 bg-emerald-600 text-white rounded-full text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-4 active:scale-95 group">
                               Enroll Student
                               <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                         </div>
                      </form>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Support Components ───────────────────────────────────────────────────────

function SidebarLink({ active, onClick, icon: Icon, label, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative group ${
        active 
          ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/50" 
          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/50"
      }`}
    >
      <div className={`p-1.5 rounded-lg transition-all ${active ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900"}`}>
        <Icon size={16} strokeWidth={active ? 3 : 2} />
      </div>
      <span className={`text-[12px] tracking-tight transition-all ${active ? "font-black" : "font-bold text-slate-400"}`}>{label}</span>
      
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-600 rounded-r-full" />}
      {badge && <div className="ml-auto w-1.5 h-1.5 bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(5,150,105,0.4)]" />}
    </button>
  );
}
