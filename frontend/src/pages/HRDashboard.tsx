import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  LogOut,
  Loader2,
  LayoutGrid,
  Star,
  ChevronLeft,
  Clock,
  X,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import api from "../api/axios";

// ─── Types & Definitions ──────────────────────────────────────────────────────

type InterviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "NO_SHOW";

interface StudentWithAssignment {
  id: number;
  assignmentId: number;
  name: string;
  register_number: string;
  department: string;
  status: InterviewStatus;
  resumeUrl: string;
  evaluation_status: string;
}

interface FeedbackFormState {
  technicalKnowledge: number;
  serviceAndCoordination: number;
  communicationSkills: number;
  futureParticipation: number;
  punctualityAndInterest: number;
  suggestions: string;
  issuesFaced: string;
  improvementSuggestions: string;
}

// ─── UI Components ────────────────────────────────────────────────────────────

function Badge({ status }: { status: InterviewStatus }) {
  const styles = {
    PENDING: "bg-slate-50 text-slate-400 border-slate-200",
    IN_PROGRESS: "bg-blue-50 text-blue-600 border-blue-100 animate-pulse",
    COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    NO_SHOW: "bg-rose-50 text-rose-600 border-rose-100",
  }[status];

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${styles}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function RatingMatrix({ label, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between py-6 border-b border-slate-50 group">
      <span className="text-[11px] font-bold text-slate-900 tracking-tight">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
              value >= s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

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

export default function HRDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "feedback">("overview");
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [students, setStudents] = useState<StudentWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | InterviewStatus>("ALL");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormState>({
    technicalKnowledge: 0,
    serviceAndCoordination: 0,
    communicationSkills: 0,
    futureParticipation: 0,
    punctualityAndInterest: 0,
    suggestions: "",
    issuesFaced: "",
    improvementSuggestions: "",
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, assignmentId: null as number | null, studentName: "" });

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, studentsRes] = await Promise.all([
        api.get("/hr/stats"),
        api.get("/hr/students")
      ]);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoShow = (assignmentId: number, studentName: string) => {
    setConfirmModal({ show: true, assignmentId, studentName });
  };

  const executeNoShow = async () => {
    if (!confirmModal.assignmentId) return;
    try {
      await api.post(`/hr/no-show/${confirmModal.assignmentId}`);
      fetchData();
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setConfirmModal({ show: false, assignmentId: null, studentName: "" });
    }
  };

  const submitFeedback = async () => {
    const allRated = [
      feedbackForm.technicalKnowledge,
      feedbackForm.communicationSkills
    ].every(v => v > 0);

    if (!allRated) return alert("Please rate all criteria.");
    setSubmittingFeedback(true);
    try {
      await api.post("/hr/feedback", feedbackForm);
      alert("Feedback submitted. Thank you!");
      setFeedbackForm({
        technicalKnowledge: 0,
        serviceAndCoordination: 0,
        communicationSkills: 0,
        futureParticipation: 0,
        punctualityAndInterest: 0,
        suggestions: "",
        issuesFaced: "",
        improvementSuggestions: "",
      });
      setActiveTab("overview");
    } catch {
      alert("Submission failed.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) || s.register_number.toLowerCase().includes(q);
    const matchesFilter = filterStatus === "ALL" || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const noShows = students.filter(s => s.status === 'NO_SHOW').length;
  const completed = stats.completed;
  const pending = stats.pending;
  const total = stats.total;

  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(currentTime);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans text-slate-900 selection:bg-indigo-600/10 relative">
      {/* ── Sidebar ── */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 z-50 p-4 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex items-center gap-3 px-2 mb-12 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
            <span className="text-white font-black text-xs"></span>
          </div>
          {!isSidebarCollapsed && <span className="font-bold text-slate-900 text-sm tracking-tight whitespace-nowrap">HR Portal</span>}
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <p className="px-3 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isSidebarCollapsed ? "" : "Main"}</p>
            <div className="space-y-1">
              <SidebarLink active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutGrid} label={isSidebarCollapsed ? "" : "Overview"} />
              <SidebarLink active={activeTab === "students"} onClick={() => setActiveTab("students")} icon={Users} label={isSidebarCollapsed ? "" : "Candidates"} />
            </div>
          </div>

          <div>
            <p className="px-3 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isSidebarCollapsed ? "" : "Reporting"}</p>
            <div className="space-y-1">
              <SidebarLink active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")} icon={Star} label={isSidebarCollapsed ? "" : "Feedback"} />
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-50">
          <div className={`flex items-center gap-3 px-3 py-4 rounded-2xl bg-slate-50 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
              {user?.name?.[0] || 'H'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-black text-slate-900 truncate">{user?.name || 'HR Portal'}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HR Panel</p>
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
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Workspace Overview</h1>
                        <p className="text-slate-500 font-medium text-[14px]">Real-time analytics for the ongoing mock drive.</p>
                      </div>

                      <div className="flex gap-3">
                         <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-sm text-[12px] font-bold text-slate-600">
                            <Clock size={16} className="text-slate-400" />
                            {formattedDate}
                         </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <ModernStatCard label="Total Students" value={total} total={total} color="#6366f1" />
                      <ModernStatCard label="Evaluated" value={completed} total={total} color="#10b981" />
                      <ModernStatCard label="Pending" value={pending} total={total} color="#f59e0b" />
                      <ModernStatCard label="No Show" value={noShows} total={total} color="#ef4444" />
                    </div>

                    {/* Control Bar */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                       <div className="relative flex-1 group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                          <input 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-[14px] h-12 pl-12 pr-12 text-[14px] font-medium text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-200 outline-none transition-all shadow-sm"
                            placeholder="Find candidates by name, SID, or dept..."
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-bold text-slate-400 bg-slate-50">
                             ⌘K
                          </div>
                       </div>

                       <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-[16px]">
                          <FilterPill active={filterStatus === "ALL"} onClick={() => setFilterStatus("ALL")} label="All" />
                          <FilterPill active={filterStatus === "PENDING"} onClick={() => setFilterStatus("PENDING")} label="Pending" />
                          <FilterPill active={filterStatus === "COMPLETED"} onClick={() => setFilterStatus("COMPLETED")} label="Completed" />
                          <FilterPill active={filterStatus === "NO_SHOW"} onClick={() => setFilterStatus("NO_SHOW")} label="Absentees" />
                       </div>
                    </div>

                    {/* Table */}
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] pl-1">{filteredStudents.length} CANDIDATES DISCOVERED</p>
                       <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-x-auto">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="border-b border-slate-50 bg-slate-50/20">
                                     <th className="pl-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">S.no</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Department</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Resume (drive link)</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                     <th className="pr-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {filteredStudents.map((s, idx) => (
                                     <tr key={s.id} className="group hover:bg-slate-50/40 transition-all cursor-pointer" onClick={() => navigate(`/hr/evaluate/${s.id}`)}>
                                        <td className="pl-10 py-6 text-[12px] font-bold text-slate-300 text-center">{idx + 1}</td>
                                        <td className="py-6">
                                           <div>
                                              <div className="text-[14px] font-black text-slate-900 tracking-tight leading-tight">{s.name}</div>
                                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.register_number}</div>
                                           </div>
                                        </td>
                                        <td className="py-6 text-center">
                                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{s.department || "General"}</span>
                                        </td>
                                        <td className="py-6 text-center">
                                           {s.resumeUrl ? (
                                              <a href={s.resumeUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-slate-100 shadow-sm">
                                                 <ExternalLink size={12} /> DRIVE LINK
                                              </a>
                                           ) : (
                                              <span className="text-[10px] font-bold text-slate-300 italic uppercase">Not Provided</span>
                                           )}
                                        </td>
                                        <td className="py-6 text-center">
                                           <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                              <Badge status={s.status} />
                                           </div>
                                        </td>
                                        <td className="pr-10 py-6 text-right">
                                           <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                              {s.status === 'COMPLETED' ? (
                                                <span className="text-emerald-600 font-black text-[10px] tracking-widest flex items-center gap-1.5 px-4 underline decoration-emerald-600/30 decoration-2 underline-offset-4">✓ EVALUATED</span>
                                              ) : (
                                                <button onClick={() => navigate(`/hr/evaluate/${s.id}`)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10 active:scale-95">Evaluate</button>
                                              )}
                                              <button 
                                                 onClick={() => handleNoShow(s.assignmentId, s.name)} 
                                                 className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 rounded-xl transition-all"
                                                 title="Mark No-Show"
                                              >
                                                 <X size={16} strokeWidth={3} />
                                              </button>
                                           </div>
                                        </td>
                                     </tr>
                                  ))}
                              </tbody>
                          </table>
                          {filteredStudents.length === 0 && (
                            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
                               <Search size={32} strokeWidth={1.5} />
                               <p className="text-[10px] font-black uppercase tracking-[0.25em]">No matching candidates detected</p>
                            </div>
                          )}
                       </div>
                       <p className="text-[10px] font-bold text-slate-300 text-center py-8 tracking-wide">MockPlacement Software Infrastructure · HR Access</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === "students" && (
                   <motion.div key="students" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                      <header className="px-2">
                         <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student List</h1>
                         <p className="text-slate-400 font-bold text-[13px] mt-1">Managed repository of assigned evaluation targets.</p>
                      </header>

                      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                         <div className="p-10 border-b border-slate-50">
                            <div className="relative group max-w-md">
                               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                               <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl h-11 pl-12 pr-6 text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all" placeholder="Quick search candidates..." />
                            </div>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left">
                               <thead>
                                  <tr className="border-b border-slate-50 bg-slate-50/20">
                                     <th className="pl-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">S.no</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Department</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Resume (drive link)</th>
                                     <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                     <th className="pr-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                   {filteredStudents.map((s, idx) => (
                                      <tr key={s.id} className="group hover:bg-slate-50/30 transition-all">
                                         <td className="pl-10 py-6 text-[12px] font-bold text-slate-300 text-center">{idx + 1}</td>
                                         <td className="py-6">
                                            <div>
                                               <div className="text-[14px] font-black text-slate-900 tracking-tight leading-tight">{s.name}</div>
                                               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.register_number}</div>
                                            </div>
                                         </td>
                                         <td className="py-6 text-center">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{s.department || "General"}</span>
                                         </td>
                                         <td className="py-6 text-center">
                                            {s.resumeUrl ? (
                                               <a href={s.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-slate-100 shadow-sm">
                                                  <ExternalLink size={12} /> DRIVE LINK
                                               </a>
                                            ) : (
                                               <span className="text-[10px] font-bold text-slate-300 italic uppercase">Not Provided</span>
                                            )}
                                         </td>
                                         <td className="py-6 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                               (s.evaluation_status === 'COMPLETED' || s.status === 'COMPLETED') 
                                               ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                               : "bg-amber-50 text-amber-600 border-amber-100"
                                            }`}>
                                               {(s.evaluation_status === 'COMPLETED' || s.status === 'COMPLETED') ? 'Completed' : 'Incomplete'}
                                            </span>
                                         </td>
                                         <td className="pr-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                               <button 
                                                  onClick={() => navigate(`/hr/evaluate/${s.id}`)} 
                                                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
                                               >
                                                  Evaluate
                                               </button>
                                               <button 
                                                  onClick={() => handleNoShow(s.assignmentId, s.name)} 
                                                  className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 rounded-xl transition-all"
                                                  title="Mark No-Show"
                                               >
                                                  <X size={16} strokeWidth={3} />
                                               </button>
                                            </div>
                                         </td>
                                      </tr>
                                   ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </motion.div>
                )}

                {activeTab === "feedback" && (
                  <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 max-w-3xl mx-auto">
                     <header className="text-center">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">Event Feedback</h1>
                        <p className="text-slate-400 font-bold text-[13px] tracking-tight">Your insights drive sequential optimization of the mock drive experience.</p>
                     </header>

                     <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-12 space-y-16">
                        <div className="space-y-2">
                           <RatingMatrix label="Candidate Technical Proficiency" value={feedbackForm.technicalKnowledge} onChange={(v: number) => setFeedbackForm(p => ({ ...p, technicalKnowledge: v }))} />
                           <RatingMatrix label="Platform Performance & UI" value={feedbackForm.communicationSkills} onChange={(v: number) => setFeedbackForm(p => ({ ...p, communicationSkills: v }))} />
                        </div>
                        <div className="flex justify-center pt-6">
                           <button onClick={submitFeedback} disabled={submittingFeedback} className="px-12 py-5 bg-indigo-600 text-white rounded-full text-[13px] font-black uppercase tracking-[0.15em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 min-w-[280px]">
                             {submittingFeedback ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Submit Experience Report"}
                           </button>
                        </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* ── Custom Confirmation Modal ── */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ show: false, assignmentId: null, studentName: "" })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl shadow-slate-900/20 w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Confirm Absence</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                  Are you sure you want to mark <span className="text-slate-900 font-bold">{confirmModal.studentName}</span> as a <span className="text-rose-500 font-bold uppercase tracking-wider">No Show</span>?
                </p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setConfirmModal({ show: false, assignmentId: null, studentName: "" })}
                  className="flex-1 px-6 py-3 rounded-2xl text-[12px] font-black text-slate-400 uppercase tracking-widest hover:bg-white hover:text-slate-600 transition-all"
                >
                  Return
                </button>
                <button 
                  onClick={executeNoShow}
                  className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
          ? "bg-indigo-50/50 text-indigo-600" 
          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/50"
      }`}
    >
      <div className={`transition-all ${active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-900"}`}>
        <Icon size={18} strokeWidth={active ? 3 : 2} />
      </div>
      {!label ? null : <span className={`text-[12px] tracking-tight transition-all font-bold whitespace-nowrap`}>{label}</span>}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-600 rounded-r-full" />}
    </button>
  );
}

function FilterPill({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-[12px] text-[12px] font-bold transition-all shadow-sm ${
        active 
          ? "bg-white text-indigo-600 shadow-slate-200" 
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}
