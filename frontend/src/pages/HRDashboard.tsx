import { useState, useEffect } from "react";
import {
  Search,
  Star,
  Check,
  X,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  Menu,
  LogOut,
  Loader2,
  WifiOff,
  LayoutGrid,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-indigo-100 text-indigo-700",
];

// ─── UI Components ────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = (name || "H")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const color = AVATAR_COLORS[(name || "H").charCodeAt(0) % AVATAR_COLORS.length];
  const sz = size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-semibold flex-shrink-0 select-none`}>
      {initials}
    </div>
  );
}

function Badge({ status }: { status: InterviewStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
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
    <div className="flex flex-col lg:flex-row items-center justify-between py-6 gap-6 group border-b border-slate-50 last:border-0">
      <div className="text-[14px] font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors w-full lg:w-1/3 text-left">
        {label}
      </div>
      <div className="flex gap-1 p-1 bg-slate-50/50 border border-slate-200/50 rounded-xl w-full lg:w-auto overflow-x-auto overflow-y-hidden no-scrollbar">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-[11px] font-bold transition-all ${
              value === n
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
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

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-blue-600 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
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
      alert("Evaluation failed to submit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              {student.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student.register_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0">
          <div className="mt-8 mb-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Assessment Matrix</h3>
            <div className="divide-y divide-slate-50">
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
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Qualitative Synthesis</h3>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block mb-2 px-1">Strengths</label>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-600/10 outline-none h-24 resize-none transition-all"
                placeholder="Candidate's core strengths..."
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block mb-2 px-1">Areas for Growth</label>
              <textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-600/10 outline-none h-24 resize-none transition-all"
                placeholder="Vector identified for optimization..."
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Calculated Score</p>
            <div className="text-2xl font-black text-blue-600">{overallScore}<span className="text-slate-300 text-sm ml-1">/ 10.0</span></div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allRated || isSubmitting}
            className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-30 shadow-lg shadow-blue-500/20 active:scale-95"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
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
  const [error, setError] = useState(false);
  
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
      setError(false);
    } catch (err) {
      setError(true);
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

  return (
    <div className="flex h-screen bg-[#FBFBFD] overflow-hidden font-sans antialiased text-[#111111]">
      {/* ── Sidebar ── */}
      <aside className="w-80 bg-white border-r border-slate-200/50 flex flex-col fixed h-screen z-50">
        <div className="p-10 pt-12">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/10">N</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-black">Nexus <span className="text-blue-600">HR</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Mock Placement Portal</p>
            </div>
          </div>

          <nav className="space-y-2">
            <SidebarTab active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutGrid} label="Dashboard" />
            <SidebarTab active={activeTab === "students"} onClick={() => setActiveTab("students")} icon={Users} label="Students Directory" />
            <SidebarTab active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")} icon={Star} label="Event Feedback" />
          </nav>
        </div>

        <div className="mt-auto p-10 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">{user?.name?.[0] || 'H'}</div>
            <div>
              <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{user?.name || 'Interviewer'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user?.companyName || 'Corporate'}</p>
            </div>
          </div>
          <button onClick={logout} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 ml-80 h-screen overflow-y-auto custom-scrollbar p-16">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <header className="mb-12">
                <h1 className="text-5xl font-extrabold text-black tracking-tighter leading-none mb-3">Operational <span className="text-blue-600">Overview</span></h1>
                <p className="text-slate-400 font-medium text-lg">Real-time status of your assigned recruitment pipeline.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard label="Total Candidates" value={stats.total} icon={Users} type="blue" />
                <StatCard label="Verified Protocol" value={stats.completed} icon={CheckCircle2} type="emerald" />
                <StatCard label="Awaiting Audit" value={stats.pending} icon={Clock} type="amber" />
              </div>

              <div className="bg-white border border-slate-100 p-12 rounded-[3rem] shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Protocol Readiness</h3>
                  <p className="text-slate-400 text-sm font-medium">Your current progress across all assigned students for today's session.</p>
                </div>
                <div className="w-64">
                   <div className="flex justify-between mb-3 items-end">
                      <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{stats.completed} Verified</span>
                      <span className="text-2xl font-black text-slate-900 leading-none">{Math.round((stats.completed/stats.total ||0 ) * 100)}%</span>
                   </div>
                   <ProgressBar value={stats.completed} max={stats.total} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "students" && (
             <motion.div key="students" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <header className="mb-12">
                   <h1 className="text-5xl font-extrabold text-black tracking-tighter leading-none mb-3">Student <span className="text-blue-600">Directory</span></h1>
                   <p className="text-slate-400 font-medium text-lg">Managed repository of assigned evaluation targets.</p>
                </header>

                <div className="bg-white border border-slate-200/50 rounded-[3rem] shadow-sm overflow-hidden p-4">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="relative group w-full max-w-lg">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input
                        className="w-full bg-slate-50 border-none rounded-2xl h-14 pl-14 pr-8 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/5 transition-all outline-none"
                        placeholder="Filter by name or registration ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                       {["ALL", "PENDING", "COMPLETED"].map((st) => (
                         <button
                           key={st}
                           onClick={() => setFilterStatus(st as any)}
                           className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === st ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"}`}
                         >
                           {st}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/30">
                          <th className="pl-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Token</th>
                          <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Matrix</th>
                          <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                          <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                          <th className="pr-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStudents.map((s, i) => (
                          <tr key={s.id} className="group hover:bg-[#FBFBFD] transition-all duration-300">
                             <td className="pl-12 py-10 text-slate-300 font-black font-mono text-sm leading-none">{(i + 1).toString().padStart(2, '0')}</td>
                             <td className="py-10">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:border-blue-500">{s.name[0]}</div>
                                  <div>
                                    <div className="font-extrabold text-slate-900 text-base tracking-tight">{s.name}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">{s.register_number}</div>
                                  </div>
                               </div>
                             </td>
                             <td className="py-10">
                               <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 uppercase tracking-widest">{s.department || "General"}</span>
                             </td>
                             <td className="py-10">
                               <div className="flex items-center justify-center">
                                  <Badge status={s.status} />
                               </div>
                             </td>
                             <td className="pr-12 py-10 text-right">
                               <div className="flex items-center justify-end gap-3">
                                 {s.status === "COMPLETED" ? (
                                   <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                      <Check size={14} /> Finalized
                                   </div>
                                 ) : (
                                   <>
                                     <button onClick={() => setEvaluateStudent(s)} className="inline-flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 active:scale-95">
                                       Evaluate
                                     </button>
                                     <button onClick={() => handleNoShow(s.assignmentId)} className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-2xl border border-slate-100 transition-all active:scale-95" title="No Show">
                                       <X size={16} strokeWidth={3} />
                                     </button>
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
            <motion.div key="feedback" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 max-w-4xl">
              <header className="mb-12">
                <h1 className="text-5xl font-extrabold text-black tracking-tighter leading-none mb-3">Event <span className="text-blue-600">Feedback</span></h1>
                <p className="text-slate-400 font-medium text-lg">Rate your experience during this mock placement drive.</p>
              </header>

              <div className="bg-white border border-slate-200/50 rounded-[3rem] p-12 shadow-sm space-y-12">
                 <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-8 border-b border-slate-50 pb-4">Performance Metrics</h3>
                    <div className="divide-y divide-slate-50">
                      <RatingMatrix label="Student Technical Knowledge" value={feedbackForm.technicalKnowledge} onChange={(v) => setFeedbackForm(p => ({ ...p, technicalKnowledge: v }))} />
                      <RatingMatrix label="Service & Coordination" value={feedbackForm.serviceAndCoordination} onChange={(v) => setFeedbackForm(p => ({ ...p, serviceAndCoordination: v }))} />
                      <RatingMatrix label="Communication Quality" value={feedbackForm.communicationSkills} onChange={(v) => setFeedbackForm(p => ({ ...p, communicationSkills: v }))} />
                      <RatingMatrix label="Future Participation Likelihood" value={feedbackForm.futureParticipation} onChange={(v) => setFeedbackForm(p => ({ ...p, futureParticipation: v }))} />
                      <RatingMatrix label="Punctuality & Student Interest" value={feedbackForm.punctualityAndInterest} onChange={(v) => setFeedbackForm(p => ({ ...p, punctualityAndInterest: v }))} />
                    </div>
                 </div>

                 <div className="space-y-8">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-8 border-b border-slate-50 pb-4">Feedback Synthesis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest block ml-1">Suggestions</label>
                          <textarea
                            value={feedbackForm.suggestions}
                            onChange={(e) => setFeedbackForm(p => ({ ...p, suggestions: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm h-32 resize-none focus:ring-4 focus:ring-blue-600/5 outline-none transition-all"
                            placeholder="Operational suggestions..."
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest block ml-1">Issues Faced</label>
                          <textarea
                            value={feedbackForm.issuesFaced}
                            onChange={(e) => setFeedbackForm(p => ({ ...p, issuesFaced: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm h-32 resize-none focus:ring-4 focus:ring-blue-600/5 outline-none transition-all"
                            placeholder="Pain points or system bottlenecks..."
                          />
                       </div>
                       <div className="md:col-span-2 space-y-3">
                          <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest block ml-1">Future Optimization</label>
                          <textarea
                            value={feedbackForm.improvementSuggestions}
                            onChange={(e) => setFeedbackForm(p => ({ ...p, improvementSuggestions: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm h-32 resize-none focus:ring-4 focus:ring-blue-600/5 outline-none transition-all"
                            placeholder="Proposals for subsequent drive iterations..."
                          />
                       </div>
                    </div>
                 </div>

                 <div className="pt-10 flex justify-end">
                    <button
                      onClick={submitFeedback}
                      disabled={submittingFeedback}
                      className="px-16 py-5 bg-blue-600 text-white rounded-[2rem] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-30"
                    >
                      {submittingFeedback ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5 fill-white/10" />}
                      Transmit Assessment
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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

function SidebarTab({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-400 group ${
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
      }`}
    >
      <Icon size={19} strokeWidth={active ? 2.5 : 1.5} className={active ? "scale-110" : "group-hover:scale-110 group-hover:text-blue-600 transition-transform"} />
      <span className={`text-[13px] tracking-tight ${active ? "font-black" : "font-bold"}`}>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, type }: { label: string; value: number; icon: any; type: 'blue' | 'emerald' | 'amber' }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 shadow-blue-500/10 hover:bg-blue-600",
    emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-500/10 hover:bg-emerald-600",
    amber: "bg-amber-50 text-amber-600 shadow-amber-500/10 hover:bg-amber-600",
  };
  
  return (
    <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group overflow-hidden relative">
      <div className="relative z-10">
        <p className="text-slate-400 text-[10px] font-black tracking-widest mb-3 uppercase opacity-80">{label}</p>
        <h3 className="text-5xl font-black text-slate-900 tracking-tighter group-hover:text-white transition-colors duration-500">{value}</h3>
      </div>
      <div className={`absolute top-10 right-10 p-4 ${colors[type]} group-hover:text-white group-hover:scale-110 transition-all duration-500 rounded-2xl`}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 ${colors[type]} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full`} />
    </div>
  );
}
