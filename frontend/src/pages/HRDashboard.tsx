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
  Settings,
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
    label: "Passing", // Using "Passing" to match reference UI style
    bg: "bg-green-50",
    text: "text-green-600",
    dot: "bg-green-500",
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
                ? "bg-slate-900 text-white shadow-lg"
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
      alert("Evaluation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl`}>
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
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Criteria Audit</h3>
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
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Qualitative Data</h3>
             <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Key Strengths</label>
                  <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium h-24 resize-none focus:ring-4 focus:ring-slate-900/5 transition-all outline-none" placeholder="Document candidate's core strengths..." />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Critical Improvements</label>
                  <textarea value={improvements} onChange={(e) => setImprovements(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium h-24 resize-none focus:ring-4 focus:ring-slate-900/5 transition-all outline-none" placeholder="Document vectors for optimization..." />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">General Observations</label>
                  <textarea value={comments} onChange={(e) => setComments(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium h-24 resize-none focus:ring-4 focus:ring-slate-900/5 transition-all outline-none" placeholder="General Auditor summary..." />
                </div>
             </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Score</span>
            <span className="text-2xl font-black text-slate-900">{overallScore} <span className="text-slate-400 text-xs font-bold -ml-1">/ 10.0</span></span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allRated || isSubmitting}
            className="px-12 py-4 bg-slate-900 text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-20 shadow-xl shadow-slate-900/20 active:scale-95 flex items-center gap-3"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
            Finalize Evaluation
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
      console.error("Fetch Error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoShow = async (assignmentId: number) => {
    if (!confirm("Confirm candidate no-show status?")) return;
    try {
      await api.post(`/hr/no-show/${assignmentId}`);
      fetchData();
    } catch {
      alert("No-show mark failed.");
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

    if (!allRated) return alert("Please audit all experience criteria.");
    setSubmittingFeedback(true);
    try {
      await api.post("/hr/feedback", feedbackForm);
      alert("Feedback synchronized successfully.");
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
      alert("Feedback submission failed.");
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
    { name: "Passing", value: stats.completed, color: "#22C55E" },
    { name: "Failing", value: stats.pending, color: "#334155" }, // Using Slate-700 for Failing to match chart look
    { name: "Need Repair", value: 0, color: "#CBD5E1" },
    { name: "Disabled", value: 0, color: "#CBD5E1" },
  ];

  return (
    <div className="flex bg-[#F7F8FA] min-h-screen font-sans text-slate-900 selection:bg-slate-900/10 selection:text-slate-900">
      {/* ── Sidebar (Design from Reference) ── */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 z-50 p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <LayoutGrid size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Nexus HR Audit</span>
        </div>

        <nav className="space-y-1">
          <SidebarLink active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutGrid} label="Dashboard" badge />
          
          <div className="mt-8 mb-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Management</div>
          <SidebarLink active={activeTab === "students"} onClick={() => setActiveTab("students")} icon={Users} label="Students Directory" />
          <SidebarLink active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")} icon={Star} label="Session Audit" />
          <SidebarLink active={false} onClick={() => {}} icon={Bell} label="Notifications" />
          
          <div className="mt-8 mb-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Support</div>
          <SidebarLink active={false} onClick={() => {}} icon={HelpCircle} label="Documentation" />
        </nav>

        {/* Support Section from design */}
        <div className="mt-auto pt-10">
           <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                 <HelpCircle size={16} className="text-slate-400" />
                 <span className="text-[11px] font-bold text-slate-900">Need Support?</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">Reach out to our platform technical specialists.</p>
              <button className="w-full bg-white border border-slate-200 py-2.5 rounded-xl text-[10px] font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
                Technical Repo
              </button>
           </div>
           
           <div className="mt-6 px-3 flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-[9px] font-medium text-slate-400 cursor-pointer hover:text-slate-600">Privacy Policy</span>
              <span className="text-[9px] font-medium text-slate-400 cursor-pointer hover:text-slate-600">Terms of service</span>
           </div>
        </div>
      </aside>

      {/* ── Header Area ── */}
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
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-slate-200 transition-all">
                    {user?.name?.[0] || 'H'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-slate-900">{user?.name || 'Jordan'}</span>
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

        {/* ── Main Content Area ── */}
        <main className="p-10 pb-20 relative">
          {/* Decorative leaves logic removed but visual style maintained */}
          <div className="absolute bottom-10 right-10 opacity-30 pointer-events-none grayscale select-none">
             <div className="flex gap-4">
               {/* Leaf SVG placeholder style */}
               <svg width="100" height="150" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 150C50 150 100 100 100 50C100 0 50 0 50 0C50 0 0 0 0 50C0 100 50 150 50 150Z" fill="#166534" />
               </svg>
             </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Establishing Audit Environment...</p>
             </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SummaryCard title="Total Students" value={stats.total} subtext="Directory Size" icon={Users} />
                    <SummaryCard title="Audited Targets" value={stats.completed} subtext="Protocol Verified" icon={CheckCircle2} />
                    <SummaryCard title="Efficiency Rate" value={`${Math.round((stats.completed/(stats.total||1))*100)}%`} subtext="Pipeline Speed" icon={Clock} />
                    <SummaryCard title="Awaiting Verification" value={stats.pending} subtext="Audit Backlog" icon={Clock} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Projects Table Style */}
                     <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0">
                           <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Active Audit Sequence</h3>
                           <button onClick={() => setActiveTab("students")} className="text-[11px] font-bold text-slate-400 hover:text-slate-900 underline decoration-slate-200 underline-offset-4 tracking-tight uppercase">Enter Directory →</button>
                        </div>
                        
                        <div className="flex-1 overflow-x-auto min-h-[400px]">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="bg-slate-50/50">
                                    <th className="pl-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                                    <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialization</th>
                                    <th className="pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sequence</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {students.slice(0, 8).map((s) => (
                                    <tr key={s.id} className="group hover:bg-slate-50/30 transition-all cursor-pointer" onClick={() => s.status !== 'COMPLETED' && setEvaluateStudent(s)}>
                                       <td className="pl-8 py-5">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                {s.name[0]}
                                             </div>
                                             <div>
                                                <div className="text-[13px] font-bold text-slate-900">{s.name}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.register_number}</div>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="py-5">
                                          <Badge status={s.status} />
                                       </td>
                                       <td className="py-5">
                                          <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{s.department || "General Audit"}</span>
                                       </td>
                                       <td className="pr-8 py-5 text-right">
                                          <div className="text-slate-300 group-hover:text-slate-900 transition-colors">
                                             <MoreHorizontal size={18} />
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>

                     {/* Donut Chart Style */}
                     <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                           <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">Status <Info size={14} className="text-slate-300" /></h3>
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
                              <span className="text-4xl font-black text-slate-900">{stats.pending}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failing Audit</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6">
                           {chartData.map((item) => (
                              <div key={item.name} className="flex items-center gap-2.5">
                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                 <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-900 leading-none mb-1">{item.name}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Metric Source</span>
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
                    <div className="flex items-center justify-between mb-8">
                       <div>
                          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Internal Directory</h1>
                          <p className="text-slate-400 text-[13px] font-medium tracking-tight">System managed repository of assigned student targets.</p>
                       </div>
                       <div className="flex gap-3">
                          <button onClick={fetchData} className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-900 shadow-sm hover:bg-slate-50 active:scale-95 transition-all">Reload Directory</button>
                       </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-4 overflow-hidden">
                       <div className="px-6 py-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                          <div className="relative group flex-1 max-w-lg">
                             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                             <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl h-14 pl-14 pr-8 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all" placeholder="Filter by unique register signature..." />
                          </div>
                          <div className="flex flex-wrap gap-2">
                             {["ALL", "PENDING", "COMPLETED"].map(f => (
                               <button key={f} onClick={() => setFilterStatus(f as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === f ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" : "bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-200"}`}>
                                 {f}
                               </button>
                             ))}
                          </div>
                       </div>
                       
                       <div className="overflow-x-auto">
                          <table className="w-full text-left">
                             <thead>
                                <tr className="bg-slate-50/50">
                                   <th className="pl-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Signature</th>
                                   <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Status</th>
                                   <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Domain</th>
                                   <th className="pr-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Executive Decision</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((s) => (
                                   <tr key={s.id} className="group hover:bg-slate-50/30 transition-all duration-300">
                                      <td className="pl-10 py-8">
                                         <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-sm group-hover:scale-110 transition-transform">
                                              {s.name[0]}
                                            </div>
                                            <div>
                                              <div className="text-[14px] font-black text-slate-900 tracking-tight">{s.name}</div>
                                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">{s.register_number}</div>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="py-8">
                                         <Badge status={s.status} />
                                      </td>
                                      <td className="py-8">
                                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{s.department || "General Audit"}</span>
                                      </td>
                                      <td className="pr-10 py-8 text-right">
                                         <div className="flex items-center justify-end gap-3">
                                            {s.status === "COMPLETED" ? (
                                              <div className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 shadow-sm">
                                                <CheckCircle2 size={14} /> Passed
                                              </div>
                                            ) : (
                                              <>
                                                <button onClick={() => setEvaluateStudent(s)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95">Initiate Audit</button>
                                                <button onClick={() => handleNoShow(s.assignmentId)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 rounded-2xl transition-all" title="Mark No-Show"><X size={16} strokeWidth={3} /></button>
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
                   <div className="flex flex-col gap-2">
                      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Experience Assessment</h1>
                      <p className="text-slate-400 text-[13px] font-medium tracking-tight">Quantify the operational quality of the placement sequence.</p>
                   </div>

                   <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-12 space-y-16">
                      <div>
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-10 border-b border-slate-50 pb-5">Core Metrics Matrix</h3>
                         <div className="space-y-2">
                           <RatingMatrix label="Student Domain Proficiency" value={feedbackForm.technicalKnowledge} onChange={(v) => setFeedbackForm(p => ({ ...p, technicalKnowledge: v }))} />
                           <RatingMatrix label="Logistical Coordination" value={feedbackForm.serviceAndCoordination} onChange={(v) => setFeedbackForm(p => ({ ...p, serviceAndCoordination: v }))} />
                           <RatingMatrix label="Interviewer Communication" value={feedbackForm.communicationSkills} onChange={(v) => setFeedbackForm(p => ({ ...p, communicationSkills: v }))} />
                           <RatingMatrix label="Retention Intent" value={feedbackForm.futureParticipation} onChange={(v) => setFeedbackForm(p => ({ ...p, futureParticipation: v }))} />
                           <RatingMatrix label="Temporal Punctuality" value={feedbackForm.punctualityAndInterest} onChange={(v) => setFeedbackForm(p => ({ ...p, punctualityAndInterest: v }))} />
                         </div>
                      </div>

                      <div className="space-y-10">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 border-b border-slate-50 pb-5">Qualitative Feedback Loop</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Proposals</label>
                               <textarea value={feedbackForm.suggestions} onChange={(e) => setFeedbackForm(p => ({ ...p, suggestions: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-sm font-medium h-40 resize-none focus:ring-4 focus:ring-slate-900/5 outline-none transition-all" placeholder="Submit architectural suggestions..." />
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Friction Points</label>
                               <textarea value={feedbackForm.issuesFaced} onChange={(e) => setFeedbackForm(p => ({ ...p, issuesFaced: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-sm font-medium h-40 resize-none focus:ring-4 focus:ring-slate-900/5 outline-none transition-all" placeholder="Document encountered bottlenecks..." />
                            </div>
                            <div className="md:col-span-2 space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Strategic Optimization</label>
                               <textarea value={feedbackForm.improvementSuggestions} onChange={(e) => setFeedbackForm(p => ({ ...p, improvementSuggestions: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] p-6 text-sm font-medium h-40 resize-none focus:ring-4 focus:ring-slate-900/5 outline-none transition-all" placeholder="Proposals for structural iteration..." />
                            </div>
                         </div>
                      </div>

                      <div className="pt-6 flex justify-end">
                         <button onClick={submitFeedback} disabled={submittingFeedback} className="px-16 py-5 bg-slate-900 text-white rounded-full text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-20">
                            {submittingFeedback ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
                            Synchronize Feedback
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
          ? "bg-slate-50 text-slate-900 shadow-sm border border-slate-100" 
          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/50"
      }`}
    >
      <div className={`p-1.5 rounded-lg transition-all ${active ? "bg-green-500 text-white" : "text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900"}`}>
        <Icon size={16} strokeWidth={active ? 3 : 2} />
      </div>
      <span className={`text-[12px] tracking-tight transition-all ${active ? "font-black" : "font-bold text-slate-400"}`}>{label}</span>
      
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-green-500 rounded-r-full" />}
      {badge && <div className="ml-auto w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
    </button>
  );
}
