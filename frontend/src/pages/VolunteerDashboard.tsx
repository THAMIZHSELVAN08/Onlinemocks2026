import { useState, useEffect } from "react";
import {
  Search,
  LogOut,
  Loader2,
  LayoutGrid,
  ChevronLeft,
  Clock,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import api from "../api/axios";

// ─── UI Components ────────────────────────────────────────────────────────────

function ModernStatCard({ 
  label, 
  value, 
  total, 
  color
}: { 
  label: string; 
  value: number; 
  total: number; 
  color: string; 
}) {
  const radius = 40;
  const strokeWidth = 8;
  const size = (radius + strokeWidth) * 2 + 4;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total || 1;
  const percentage = Math.min(value, safeTotal) / safeTotal;
  const offset = circumference - percentage * circumference;

  return (
    <div className="bg-white rounded-[20px] border border-slate-200/60 py-8 px-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle cx={center} cy={center} r={radius} stroke="#f1f5f9" strokeWidth={strokeWidth} fill="transparent" />
          <circle 
            cx={center} cy={center} r={radius} 
            stroke={color} strokeWidth={strokeWidth} 
            strokeDasharray={circumference} 
            strokeDashoffset={isNaN(offset) ? circumference : offset} 
            strokeLinecap="round" fill="transparent" 
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-black text-slate-900 tracking-tighter tabular-nums leading-none">{value}</span>
          <span className="text-[8px] font-black text-slate-400 mt-1.5 uppercase tracking-[0.15em] text-center leading-tight max-w-[70px]">{label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function VolunteerDashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "enroll">("overview");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "COMPLETED" | "NO_SHOW">("ALL");
  const [formData, setFormData] = useState({ name: '', register_number: '', department: '', resume_url: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

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
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const fetchData = async () => {
    try {
      const studentsRes = await api.get("/volunteer/students");
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
    const matchesSearch = s.name.toLowerCase().includes(q) || s.register_number.toLowerCase().includes(q);
    const status = s.evaluation_status || s.status;
    const matchesFilter = filterStatus === "ALL" || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const noShows = students.filter(s => s.status === 'NO_SHOW').length;
  const completed = students.filter(s => s.status === 'COMPLETED' || s.evaluation_status === 'COMPLETED').length;
  const pending = students.filter(s => (s.status === 'PENDING' || s.status === 'IN_PROGRESS') && s.evaluation_status !== 'COMPLETED').length;
  const total = students.length;

  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(currentTime);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans text-slate-900 selection:bg-emerald-600/10 relative">
      {/* ── Sidebar ── */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 z-50 p-4 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex items-center gap-3 px-2 mb-12 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20">
            <span className="text-white font-black text-xs">VP</span>
          </div>
          {!isSidebarCollapsed && <span className="font-bold text-slate-900 text-sm tracking-tight whitespace-nowrap">Volunteer Portal</span>}
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <p className="px-3 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isSidebarCollapsed ? "" : "Operations"}</p>
            <div className="space-y-1">
              <SidebarLink active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutGrid} label={isSidebarCollapsed ? "" : "Overview"} />
            </div>
          </div>

          <div>
            <p className="px-3 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isSidebarCollapsed ? "" : "Management"}</p>
            <div className="space-y-1">
              <SidebarLink active={activeTab === "enroll"} onClick={() => setActiveTab("enroll")} icon={UserPlus} label={isSidebarCollapsed ? "" : "Enroll Student"} />
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-50">
          <div className={`flex items-center gap-3 px-3 py-4 rounded-2xl bg-slate-50 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[10px]">
              {user?.name?.[0] || 'V'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-black text-slate-900 truncate">{user?.name || 'Volunteer'}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Support Team</p>
              </div>
            )}
            {!isSidebarCollapsed && <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors"><LogOut size={14} /></button>}
          </div>
          {isSidebarCollapsed && (
             <button onClick={logout} className="w-full flex justify-center py-4 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={16} /></button>
          )}
        </div>
      </aside>

      {/* ── Sidebar Toggle Button ── */}
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={`fixed top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-lg z-[60] flex items-center justify-center hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all group ${isSidebarCollapsed ? 'left-[96px]' : 'left-[256px]'} -translate-x-1/2`}
      >
        <ChevronLeft size={16} className={`text-slate-400 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Main Content Area ── */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <main className="p-8 pb-20">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing...</p>
             </div>
          ) : (
            <div className="max-w-5xl mx-auto px-4">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Support Overview</h1>
                        <p className="text-slate-500 font-medium text-[14px]">Tracking candidate enrollment and session status.</p>
                      </div>

                      <div className="flex gap-3">
                         <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-sm text-[12px] font-bold text-slate-600">
                            <Clock size={16} className="text-slate-400" />
                            {formattedDate}
                         </div>
                      </div>
                    </div>

                    {/* Stat Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <ModernStatCard label="Total Candidates" value={total} total={total} color="#10b981" />
                      <ModernStatCard label="Evaluation Done" value={completed} total={total} color="#059669" />
                      <ModernStatCard label="In Progress" value={pending} total={total} color="#f59e0b" />
                      <ModernStatCard label="Absentee" value={noShows} total={total} color="#ef4444" />
                    </div>

                    {/* Control Bar */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                       <div className="relative flex-1 group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                          <input 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-[14px] h-12 pl-12 pr-12 text-[14px] font-medium text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-200 outline-none transition-all shadow-sm"
                            placeholder="Find candidates by name or register number..."
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-bold text-slate-400 bg-slate-50">
                             ⌘K
                          </div>
                       </div>

                       <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-[16px]">
                          <FilterPill active={filterStatus === "ALL"} onClick={() => setFilterStatus("ALL")} label="All" />
                          <FilterPill active={filterStatus === "PENDING"} onClick={() => setFilterStatus("PENDING")} label="Pending" />
                          <FilterPill active={filterStatus === "COMPLETED"} onClick={() => setFilterStatus("COMPLETED")} label="Verified" />
                          <FilterPill active={filterStatus === "NO_SHOW"} onClick={() => setFilterStatus("NO_SHOW")} label="Absentees" />
                       </div>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{filteredStudents.length} RECORDS DISCOVERED</p>
                       </div>
                       <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-x-auto">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="border-b border-slate-50 bg-slate-50/20">
                                     <th className="pl-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">S.no</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Department</th>
                                     <th className="pr-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {filteredStudents.map((s, idx) => (
                                     <tr key={s.id} className="group hover:bg-slate-50/40 transition-all cursor-pointer">
                                        <td className="pl-10 py-6 text-[12px] font-bold text-slate-300 text-center">
                                           {idx + 1}
                                        </td>
                                         <td className="py-6">
                                            <div>
                                               <div className="text-[14px] font-black text-slate-900 tracking-tight leading-tight">{s.name}</div>
                                               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.register_number}</div>
                                            </div>
                                         </td>
                                        <td className="py-6 text-center">
                                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{s.department || "General"}</span>
                                        </td>
                                        <td className="pr-10 py-6 text-right">
                                           <div className="flex items-center justify-end gap-3 px-1">
                                              <div className={`w-1.5 h-1.5 rounded-full ${(s.evaluation_status === 'COMPLETED' || s.status === 'COMPLETED') ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                              <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${(s.evaluation_status === 'COMPLETED' || s.status === 'COMPLETED') ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                  {(s.evaluation_status === 'COMPLETED' || s.status === 'COMPLETED') ? 'Verified' : 'Awaiting HR'}
                                              </span>
                                           </div>
                                        </td>
                                     </tr>
                                  ))}
                              </tbody>
                          </table>
                       </div>
                       <p className="text-[10px] font-bold text-slate-300 text-center py-8 tracking-wide">MockPlacement Software Infrastructure · Volunteer Access</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === "enroll" && (
                  <motion.div key="enroll" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl mx-auto">
                     <header className="text-center">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Enroll Candidate</h1>
                        <p className="text-slate-400 font-bold text-[13px] mt-2 tracking-tight">Initialize student identity for the evaluation pipeline.</p>
                     </header>

                     <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] pointer-events-none" />
                        
                        <form onSubmit={handleEnrollSubmit} className="space-y-10">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Candidate Name</label>
                                 <input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 text-sm font-bold placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all" placeholder="Full Name" required />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Reg Number</label>
                                 <input value={formData.register_number} onChange={(e) => setFormData(p => ({ ...p, register_number: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 text-sm font-bold placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all" placeholder="12-digit SID" required />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Department</label>
                                 <select value={formData.department} onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all appearance-none" required>
                                    <option value="" disabled>Select Department</option>
                                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Resume (Drive Link)</label>
                                 <input value={formData.resume_url} onChange={(e) => setFormData(p => ({ ...p, resume_url: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 text-sm font-bold placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all" placeholder="drive.google.com/..." required />
                              </div>
                           </div>

                           <div className="flex justify-center pt-6">
                              <button type="submit" className="px-16 py-5 bg-emerald-600 text-white rounded-full text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 group min-w-[300px]">
                                 Enroll Student
                              </button>
                           </div>
                        </form>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Support Components ───────────────────────────────────────────────────────

function SidebarLink({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative group ${
        active 
          ? "bg-emerald-50/50 text-emerald-600" 
          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/50"
      }`}
    >
      <div className={`transition-all ${active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-900"}`}>
        <Icon size={18} strokeWidth={active ? 3 : 2} />
      </div>
      {!label ? null : <span className={`text-[12px] tracking-tight transition-all font-bold whitespace-nowrap`}>{label}</span>}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-600 rounded-r-full" />}
    </button>
  );
}

function FilterPill({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-[12px] text-[12px] font-bold transition-all shadow-sm ${
        active 
          ? "bg-white text-emerald-600 shadow-slate-200" 
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}
