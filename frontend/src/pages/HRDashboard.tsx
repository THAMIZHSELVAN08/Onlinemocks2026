import { useState, useEffect } from "react";
import {
  Search,
  Star,
  Check,
  X,
  Users,
  Clock,
  LogOut,
  Loader2,
  LayoutGrid,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  Bell,
  MoreHorizontal,
  Info,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuthStore } from "../store/useAuthStore";
import api from "../api/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

interface StudentWithAssignment {
  id: string;
  name: string;
  register_number: string;
  department: string;
  section: string;
  status: InterviewStatus;
  assignmentId: number;
  order: number;
  resumeUrl?: string;
  evaluation_status: string;
}

interface EvaluationRatings {
  appearanceAttitude: number;
  managerialAptitude: number;
  generalAwareness: number;
  technicalKnowledge: number;
  communicationSkills: number;
  ambition: number;
  selfConfidence: number;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InterviewStatus, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  NO_SHOW: {
    label: "No Show",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-400",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-slate-100",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
};

// ─── UI Components ────────────────────────────────────────────────────────────

function Badge({ status }: { status: InterviewStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function RatingMatrix({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between py-5 gap-6 group border-b border-slate-50 last:border-0">
      <div className="text-[13px] font-bold text-slate-700 tracking-tight w-full lg:w-1/3 text-left">
        {label}
      </div>
      <div className="flex gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-[11px] font-black transition-all ${
              value === n
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtext, icon: Icon }: any) {
  return (
    <div className="bg-white p-7 rounded-[24px] shadow-sm border border-slate-100 relative group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          {title} <Info size={12} className="text-slate-300" />
        </h4>
        <div className="text-slate-300 group-hover:text-slate-900 transition-colors">
          <MoreHorizontal size={18} />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-black text-slate-900 tracking-tight">{value}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
        {subtext} <span className="text-lg leading-none">→</span>
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function EvaluateModal({
  student,
  onClose,
  onSubmit,
}: {
  student: StudentWithAssignment;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [ratings, setRatings] = useState<EvaluationRatings>({
    appearanceAttitude: 0,
    managerialAptitude: 0,
    generalAwareness: 0,
    technicalKnowledge: 0,
    communicationSkills: 0,
    ambition: 0,
    selfConfidence: 0,
  });
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRated = Object.values(ratings).every((v) => v > 0);
  const overallScore = allRated
    ? parseFloat((Object.values(ratings).reduce((a, b) => a + b, 0) / 7).toFixed(2))
    : 0;

  const handleSubmit = async () => {
    if (!allRated || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post("/hr/evaluate", {
        studentId: student.id,
        criteria: ratings,
        strengths,
        improvements,
        comments,
        overallScore,
      });
      onSubmit(student.id);
    } catch (err) {
      alert("Evaluation submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl`}>
              {student.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{student.name}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.register_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0">
          <div className="mt-8 mb-4">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Assessment Matrix</h3>
             <div className="space-y-1">
                <RatingMatrix label="Appearance & Attitude" value={ratings.appearanceAttitude} onChange={(v) => setRatings(p => ({ ...p, appearanceAttitude: v }))} />
                <RatingMatrix label="Managerial Aptitude" value={ratings.managerialAptitude} onChange={(v) => setRatings(p => ({ ...p, managerialAptitude: v }))} />
                <RatingMatrix label="General Awareness" value={ratings.generalAwareness} onChange={(v) => setRatings(p => ({ ...p, generalAwareness: v }))} />
                <RatingMatrix label="Technical Knowledge" value={ratings.technicalKnowledge} onChange={(v) => setRatings(p => ({ ...p, technicalKnowledge: v }))} />
                <RatingMatrix label="Communication Skills" value={ratings.communicationSkills} onChange={(v) => setRatings(p => ({ ...p, communicationSkills: v }))} />
                <RatingMatrix label="Ambition Scale" value={ratings.ambition} onChange={(v) => setRatings(p => ({ ...p, ambition: v }))} />
                <RatingMatrix label="Self-Confidence" value={ratings.selfConfidence} onChange={(v) => setRatings(p => ({ ...p, selfConfidence: v }))} />
             </div>
          </div>

          <div className="space-y-6 mt-8">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Audit Synthesis</h3>
             <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Candidate Strengths</label>
                  <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium h-24 resize-none focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="Document core operational strengths..." />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Areas for Optimization</label>
                  <textarea value={improvements} onChange={(e) => setImprovements(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium h-24 resize-none focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="Identify vectors for professional growth..." />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">General Executive Summary</label>
                  <textarea value={comments} onChange={(e) => setComments(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium h-24 resize-none focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="Synthesis of overall candidate potential..." />
                </div>
             </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Aggregate</span>
            <span className="text-2xl font-black text-blue-600">{overallScore} <span className="text-slate-400 text-xs font-bold -ml-1">/ 10.0</span></span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allRated || isSubmitting}
            className="px-12 py-4 bg-blue-600 text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-20 shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
            Finalize Protocol
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function HRDashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "feedback">("overview");
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [students, setStudents] = useState<StudentWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | InterviewStatus>("ALL");
  const [evaluateStudent, setEvaluateStudent] = useState<StudentWithAssignment | null>(null);
  
  // Feedback Tab State
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

  useEffect(() => {
    fetchData();
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

  const handleNoShow = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to mark this candidate as a No Show?")) return;
    try {
      await api.post(`/hr/no-show/${assignmentId}`);
      fetchData();
    } catch {
      alert("Request failed.");
    }
  };

  const submitFeedback = async () => {
    const allRated = [
      feedbackForm.technicalKnowledge,
      feedbackForm.serviceAndCoordination,
      feedbackForm.communicationSkills,
      feedbackForm.futureParticipation,
      feedbackForm.punctualityAndInterest
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

  const chartData = [
    { name: "Verified", value: stats.completed, color: "#10b981" },
    { name: "Awaiting", value: stats.pending, color: "#334155" },
    { name: "Total", value: stats.total, color: "#CBD5E1" },
  ];

  return (
    <div className="flex bg-[#F7F8FA] min-h-screen font-sans text-slate-900 selection:bg-blue-600/10 selection:text-blue-600">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 z-50 p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutGrid size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Nexus HR Portal</span>
        </div>

        <nav className="space-y-1">
          <SidebarLink active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutGrid} label="Dashboard" badge />
          
          <div className="mt-8 mb-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Management</div>
          <SidebarLink active={activeTab === "students"} onClick={() => setActiveTab("students")} icon={Users} label="Students Directory" />
          <SidebarLink active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")} icon={Star} label="Event Feedback" />
          <SidebarLink active={false} onClick={() => {}} icon={Bell} label="Notifications" />
          
          <div className="mt-8 mb-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Support</div>
          <SidebarLink active={false} onClick={() => {}} icon={HelpCircle} label="Documentation" />
        </nav>

        <div className="mt-auto pt-10">
           <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                 <HelpCircle size={16} className="text-slate-400" />
                 <span className="text-[11px] font-bold text-slate-900">Need Support?</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">Get in touch with our platform agents.</p>
              <button className="w-full bg-white border border-slate-200 py-2.5 rounded-xl text-[10px] font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
                Contact us
              </button>
           </div>
           
           <div className="mt-6 px-3 flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-[9px] font-medium text-slate-400 cursor-pointer hover:text-slate-600">Privacy policy</span>
              <span className="text-[9px] font-medium text-slate-400 cursor-pointer hover:text-slate-600">Terms of service</span>
           </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex flex-col flex-1 pl-64">
        <header className="h-20 bg-[#F7F8FA] border-b border-slate-200/40 px-10 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
           <div className="flex items-center gap-8">
              <nav className="flex items-center gap-6">
                 {['Integrations', 'Learn', 'Resources', 'Help'].map(item => (
                   <span key={item} className="text-[12px] font-bold text-slate-400 cursor-pointer hover:text-slate-900 transition-colors">{item}</span>
                 ))}
              </nav>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-900">All systems normal</span>
              </div>

              <div className="h-8 w-[1px] bg-slate-200 mx-2" />

              <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-slate-200 transition-all">
                    {user?.name?.[0] || 'H'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-slate-900">{user?.name || 'Interviewer'}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
              </div>

              <div className="p-2 text-slate-400 hover:text-slate-900 cursor-pointer transition-colors relative">
                 <Bell size={20} />
                 <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-[#F7F8FA] rounded-full" />
              </div>
              
              <div onClick={logout} className="p-2 text-slate-400 hover:text-red-500 cursor-pointer transition-colors" title="Logout">
                 <LogOut size={20} />
              </div>
           </div>
        </header>

        <main className="p-10 pb-20 relative">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Pipeline...</p>
             </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SummaryCard title="Total Candidates" value={stats.total} subtext="Directory Size" icon={Users} />
                    <SummaryCard title="Verified Protocol" value={stats.completed} subtext="Audited Targets" icon={CheckCircle2} />
                    <SummaryCard title="Awaiting Audit" value={stats.pending} subtext="Audit Backlog" icon={Clock} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0">
                           <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Active Audit Sequence</h3>
                           <button onClick={() => setActiveTab("students")} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4 tracking-tight uppercase">View Directory →</button>
                        </div>
                        
                        <div className="flex-1 overflow-x-auto min-h-[400px]">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="bg-slate-50/50">
                                    <th className="pl-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                                    <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                                    <th className="pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {students.slice(0, 8).map((s) => (
                                    <tr key={s.id} className="group hover:bg-slate-50/30 transition-all cursor-pointer">
                                       <td className="pl-8 py-5">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {s.name[0]}
                                             </div>
                                             <div>
                                                <div className="text-[13px] font-bold text-slate-900 tracking-tight">{s.name}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.register_number}</div>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="py-5">
                                          <Badge status={s.status} />
                                       </td>
                                       <td className="py-5">
                                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{s.department || "General"}</span>
                                       </td>
                                       <td className="pr-8 py-5 text-right">
                                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             {s.status !== 'COMPLETED' && (
                                               <button onClick={(e) => { e.stopPropagation(); setEvaluateStudent(s); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Star size={16} /></button>
                                             )}
                                             <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal size={16} /></button>
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>

                     <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col h-fit">
                        <div className="flex justify-between items-center mb-10">
                           <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">Protocol Status <Info size={14} className="text-slate-300" /></h3>
                           <MoreHorizontal size={18} className="text-slate-300" />
                        </div>
                        
                        <div className="h-64 relative mb-12">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie data={chartData} cx="50%" cy="50%" innerRadius={75} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                                    {chartData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                 </Pie>
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-4xl font-black text-slate-900">{stats.completed}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6">
                           {chartData.map((item) => (
                              <div key={item.name} className="flex items-center gap-2.5">
                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                 <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-900 leading-none mb-1">{item.name}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.value} Units</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "students" && (
                 <motion.div key="students" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <header className="mb-10">
                       <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">Student <span className="text-blue-600">Directory</span></h1>
                       <p className="text-slate-400 font-medium text-[15px]">Managed repository of assigned evaluation targets.</p>
                    </header>

                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-4 overflow-hidden">
                       <div className="px-6 py-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                          <div className="relative group flex-1 max-w-lg">
                             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                             <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl h-14 pl-14 pr-8 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" placeholder="Search by name or register number..." />
                          </div>
                          <div className="flex flex-wrap gap-2">
                             {["ALL", "PENDING", "COMPLETED"].map(f => (
                               <button key={f} onClick={() => setFilterStatus(f as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === f ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-200"}`}>
                                 {f}
                               </button>
                             ))}
                          </div>
                       </div>
                       
                       <div className="overflow-x-auto">
                          <table className="w-full text-left">
                             <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                   <th className="pl-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Matrix</th>
                                   <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Status</th>
                                   <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Specialization</th>
                                   <th className="pr-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((s) => (
                                   <tr key={s.id} className="group hover:bg-[#FBFBFD] transition-all duration-300">
                                      <td className="pl-10 py-10">
                                         <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                              {s.name[0]}
                                            </div>
                                            <div>
                                              <div className="text-[14px] font-black text-slate-900 tracking-tight">{s.name}</div>
                                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">{s.register_number}</div>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="py-10 text-center">
                                         <Badge status={s.status} />
                                      </td>
                                      <td className="py-10 text-center">
                                         <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 uppercase tracking-widest">{s.department || "General"}</span>
                                      </td>
                                      <td className="pr-10 py-10 text-right">
                                         <div className="flex items-center justify-end gap-3">
                                            {s.status === "COMPLETED" ? (
                                              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                                <CheckCircle2 size={14} /> Finalized
                                              </div>
                                            ) : (
                                              <>
                                                <button onClick={() => setEvaluateStudent(s)} className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95">Evaluate</button>
                                                <button onClick={() => handleNoShow(s.assignmentId)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 rounded-2xl transition-all" title="Mark No-Show"><X size={16} strokeWidth={3} /></button>
                                              </>
                                            )}
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
                <motion.div key="feedback" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl space-y-10">
                   <header className="mb-10">
                      <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">Event <span className="text-blue-600">Feedback</span></h1>
                      <p className="text-slate-400 font-medium text-[15px]">Rate your experience during this mock placement drive.</p>
                   </header>

                   <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-12 space-y-16">
                      <div>
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-10 border-b border-slate-50 pb-5">Assessment Matrix</h3>
                         <div className="space-y-1">
                           <RatingMatrix label="Student Technical Knowledge" value={feedbackForm.technicalKnowledge} onChange={(v) => setFeedbackForm(p => ({ ...p, technicalKnowledge: v }))} />
                           <RatingMatrix label="Service & Coordination" value={feedbackForm.serviceAndCoordination} onChange={(v) => setFeedbackForm(p => ({ ...p, serviceAndCoordination: v }))} />
                           <RatingMatrix label="Communication Quality" value={feedbackForm.communicationSkills} onChange={(v) => setFeedbackForm(p => ({ ...p, communicationSkills: v }))} />
                           <RatingMatrix label="Future Participation Likelihood" value={feedbackForm.futureParticipation} onChange={(v) => setFeedbackForm(p => ({ ...p, futureParticipation: v }))} />
                           <RatingMatrix label="Punctuality & Student Interest" value={feedbackForm.punctualityAndInterest} onChange={(v) => setFeedbackForm(p => ({ ...p, punctualityAndInterest: v }))} />
                         </div>
                      </div>

                      <div className="space-y-10">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 border-b border-slate-50 pb-5">Qualitative Synthesis</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Suggestions</label>
                               <textarea value={feedbackForm.suggestions} onChange={(e) => setFeedbackForm(p => ({ ...p, suggestions: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-sm font-medium h-40 resize-none focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" placeholder="Operational suggestions..." />
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Issues Faced</label>
                               <textarea value={feedbackForm.issuesFaced} onChange={(e) => setFeedbackForm(p => ({ ...p, issuesFaced: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-sm font-medium h-40 resize-none focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" placeholder="Pain points or system bottlenecks..." />
                            </div>
                            <div className="md:col-span-2 space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Future Optimization</label>
                               <textarea value={feedbackForm.improvementSuggestions} onChange={(e) => setFeedbackForm(p => ({ ...p, improvementSuggestions: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-sm font-medium h-40 resize-none focus:ring-4 focus:ring-blue-600/5 outline-none transition-all" placeholder="Proposals for subsequent drive iterations..." />
                            </div>
                         </div>
                      </div>

                      <div className="pt-6 flex justify-end">
                         <button onClick={submitFeedback} disabled={submittingFeedback} className="px-16 py-5 bg-blue-600 text-white rounded-full text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-20 font-sans">
                            {submittingFeedback ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
                            Transmit Assessment
                         </button>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Modals */}
      {evaluateStudent && (
        <EvaluateModal
          student={evaluateStudent}
          onClose={() => setEvaluateStudent(null)}
          onSubmit={() => {
            setEvaluateStudent(null);
            fetchData();
          }}
        />
      )}
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
          ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50" 
          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/50"
      }`}
    >
      <div className={`p-1.5 rounded-lg transition-all ${active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900"}`}>
        <Icon size={16} strokeWidth={active ? 3 : 2} />
      </div>
      <span className={`text-[12px] tracking-tight transition-all ${active ? "font-black" : "font-bold text-slate-400"}`}>{label}</span>
      
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />}
      {badge && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />}
    </button>
  );
}

function SummaryCard({ title, value, subtext, icon: Icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative group hover:shadow-xl hover:shadow-black/5 transition-all duration-500 overflow-hidden">
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex flex-col gap-1">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            {title} <Info size={12} className="text-slate-200" />
          </h4>
          <span className="text-4xl font-black text-slate-900 tracking-tighter">{value}</span>
        </div>
        <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-2xl transition-all duration-500 shadow-sm">
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 relative z-10 group-hover:text-blue-600 transition-colors">
        {subtext} <span className="text-lg leading-none translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
      </div>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/5 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
    </div>
  );
}
