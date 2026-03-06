import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Star,
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
  ChevronDown,
  PanelLeft,
  Menu,
  LayoutDashboard,
  User,
  Filter,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuthStore } from "../store/useAuthStore";
import api, { BASE_URL } from "../api/axios";
import { socket } from "../api/socket";
import { toast } from "sonner";

type InterviewStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

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

interface Notification {
  id: string;
  title: string | null;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const STATUS_CONFIG: Record<InterviewStatus, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  NO_SHOW: { label: "No Show", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  CANCELLED: { label: "Cancelled", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

const DEPARTMENTS = [
  "Computer Science", "Information Technology", "Artificial Intelligence and Data Science",
  "Electronics and Communication Engineering", "Electrical and Electronics Engineering",
  "Civil Engineering", "Chemical Engineering", "Mechanical and Automation Engineering",
  "Mechanical Engineering", "Automobile Engineering", "Biotechnology",
];

function Badge({ status }: { status: InterviewStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function RatingMatrix({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 gap-4 border-b border-slate-100 last:border-0">
      <span className="text-[13px] font-medium text-slate-700 lg:w-56 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg text-[12px] font-semibold transition-all border ${
              value === n
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function SidebarLink({ active, onClick, icon: Icon, label, collapsed }: any) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      <Icon size={17} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
      {!collapsed && (
        <span className={`text-[13px] truncate ${active ? "font-semibold text-blue-600" : "font-medium"}`}>
          {label}
        </span>
      )}
      {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
    </button>
  );
}

const CARD_THEMES = [
  { bg: "bg-emerald-50", icon: "bg-emerald-500", value: "text-emerald-800", label: "text-emerald-600" },
  { bg: "bg-blue-50",    icon: "bg-blue-500",    value: "text-blue-800",    label: "text-blue-600"    },
  { bg: "bg-violet-50",  icon: "bg-violet-500",  value: "text-violet-800",  label: "text-violet-600"  },
];

function SummaryCard({ title, value, subtext, icon: Icon, themeIndex = 0 }: any) {
  const t = CARD_THEMES[themeIndex % CARD_THEMES.length];
  return (
    <div className={`${t.bg} rounded-2xl p-6 flex items-center gap-5`}>
      <div className={`w-12 h-12 rounded-xl ${t.icon} flex items-center justify-center shrink-0`}>
        <Icon size={22} className="text-white" strokeWidth={2} />
      </div>
      <div>
        <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${t.label}`}>{title}</p>
        <p className={`text-3xl font-bold leading-none ${t.value}`}>
          {value}
          <span className="text-lg font-medium ml-1 opacity-60">{subtext}</span>
        </p>
      </div>
    </div>
  );
}

export default function HRDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "feedback" | "notifications">("overview");
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [students, setStudents] = useState<StudentWithAssignment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | InterviewStatus>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormState>({
    technicalKnowledge: 0, serviceAndCoordination: 0, communicationSkills: 0,
    futureParticipation: 0, punctualityAndInterest: 0, suggestions: "", issuesFaced: "", improvementSuggestions: "",
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchData();
    if (user?.id) {
      socket.connect();
      socket.emit("join_room", { room: user.id });
      socket.on("student_transferred", (data: { message: string; count: number; timestamp?: string }) => {
        toast.success("New Student Added", { description: data.message });
        fetchData();
      });
      socket.on("admin_notification", (data: { title: string; message: string }) => {
        toast.info(data.title, { description: data.message });
      });
    }
    return () => {
      socket.off("student_transferred");
      socket.off("admin_notification");
      socket.disconnect();
    };
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, studentsRes, notifRes] = await Promise.all([
        api.get("/hr/stats"),
        api.get("/hr/students"),
        api.get("/hr/notifications"),
      ]);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setNotifications(notifRes.data);
    } catch (err) { console.error("Fetch failed", err); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/hr/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error("Failed to mark as read", err); }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/hr/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All caught up!");
    } catch (err) { console.error("Failed to mark all as read", err); }
  };

  const handleNoShow = async (assignmentId: number) => {
    if (!confirm("Mark this student as No Show?")) return;
    try { await api.post(`/hr/no-show/${assignmentId}`); fetchData(); }
    catch { alert("Request failed."); }
  };

  const submitFeedback = async () => {
    const allRated = [feedbackForm.technicalKnowledge, feedbackForm.serviceAndCoordination,
      feedbackForm.communicationSkills, feedbackForm.futureParticipation, feedbackForm.punctualityAndInterest,
    ].every(v => v > 0);
    if (!allRated) return alert("Please rate all criteria.");
    setSubmittingFeedback(true);
    try {
      await api.post("/hr/feedback", feedbackForm);
      alert("Feedback submitted. Thank you!");
      setFeedbackForm({ technicalKnowledge: 0, serviceAndCoordination: 0, communicationSkills: 0,
        futureParticipation: 0, punctualityAndInterest: 0, suggestions: "", issuesFaced: "", improvementSuggestions: "" });
      setActiveTab("overview");
    } catch { alert("Submission failed."); }
    finally { setSubmittingFeedback(false); }
  };

  const filteredStudents = students.filter(s => {
    const q = searchTerm.toLowerCase();
    return (
      (s.name.toLowerCase().includes(q) || s.register_number.toLowerCase().includes(q)) &&
      (filterStatus === "ALL" || s.status === filterStatus) &&
      (filterDept === "ALL" || s.department === filterDept)
    );
  });

  const chartData = [
    { name: "Evaluated", value: stats.completed, color: "#2563eb" },
    { name: "Awaiting", value: stats.pending, color: "#93c5fd" },
    { name: "Total", value: stats.total, color: "#dbeafe" },
  ];

  const tabLabel = 
    activeTab === "overview" ? "Dashboard" : 
    activeTab === "students" ? "Student Directory" : 
    activeTab === "notifications" ? "Notifications" :
    "Event Feedback";

  return (
    <div className="bg-slate-100 font-sans text-slate-900 md:p-2 flex gap-0" style={{ height: "100vh" }}>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-slate-100 transition-all duration-300 overflow-hidden shrink-0 ${sidebarOpen ? "md:w-56" : "md:w-0"}`}>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200/60">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
            <LayoutGrid className="text-white" size={18} strokeWidth={2.5} />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-[15px] font-black tracking-tight text-slate-900 uppercase leading-none">FORESE</div>
              <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mt-0.5">HR Portal</div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <SidebarLink active={activeTab === "overview"} collapsed={!sidebarOpen} onClick={() => setActiveTab("overview")} icon={LayoutDashboard} label="Dashboard" />
          
          {sidebarOpen && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-5 pb-1.5">Management</p>}
          {!sidebarOpen && <div className="my-3 border-t border-slate-200" />}

          <SidebarLink active={activeTab === "students"} collapsed={!sidebarOpen} onClick={() => setActiveTab("students")} icon={Users} label="Students" />
          <SidebarLink active={activeTab === "feedback"} collapsed={!sidebarOpen} onClick={() => setActiveTab("feedback")} icon={Star} label="Event Feedback" />
          <SidebarLink active={activeTab === "notifications"} collapsed={!sidebarOpen} onClick={() => setActiveTab("notifications")} icon={Bell} label="Notifications" />

          {sidebarOpen && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-5 pb-1.5">Support</p>}
          {!sidebarOpen && <div className="my-3 border-t border-slate-200" />}
          <SidebarLink active={false} collapsed={!sidebarOpen} onClick={() => {}} icon={HelpCircle} label="Help & Docs" />
        </nav>

        {sidebarOpen && (
          <div className="px-4 pb-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <HelpCircle size={16} className="text-blue-600" />
              </div>
              <p className="text-[12px] font-semibold text-slate-800 mb-0.5">Need help?</p>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">Contact our support team.</p>
              <button className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-white transition-all">
                Contact Support
              </button>
            </div>
          </div>
        )}

        <div className="px-3 pb-5">
          <button onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ${!sidebarOpen ? "justify-center" : ""}`}>
            <LogOut size={17} />
            {sidebarOpen && "Log Out"}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-100 md:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <LayoutGrid className="text-white" size={16} />
          </div>
          <span className="font-bold text-slate-900">HR Portal</span>
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <SidebarLink active={activeTab === "overview"} collapsed={false} onClick={() => { setActiveTab("overview"); setMobileOpen(false); }} icon={LayoutDashboard} label="Dashboard" />
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-4 pb-1">Management</p>
          <SidebarLink active={activeTab === "students"} collapsed={false} onClick={() => { setActiveTab("students"); setMobileOpen(false); }} icon={Users} label="Students" />
          <SidebarLink active={activeTab === "feedback"} collapsed={false} onClick={() => { setActiveTab("feedback"); setMobileOpen(false); }} icon={Star} label="Event Feedback" />
          <SidebarLink active={false} collapsed={false} onClick={() => {}} icon={Bell} label="Notifications" />
        </nav>
        <div className="px-3 pb-6">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={17} />Log Out
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
              <span className="text-slate-400 font-medium">HR Workspace</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-semibold">{tabLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[12px] text-slate-500">
              <Clock size={13} className="text-slate-400" />
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <User size={15} className="text-slate-400" />
              </div>
              <span className="text-[13px] font-semibold text-slate-800 hidden sm:block">{user?.name || "HR Executive"}</span>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 pb-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-[12px] text-slate-400 font-medium">Loading dashboard...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">

              {/* ── Overview Tab ── */}
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Dashboard</h1>
                    <p className="text-[13px] text-slate-500">Live status and evaluation overview.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SummaryCard themeIndex={0} title="Total Students" value={stats.total} subtext="students" icon={Users} />
                    <SummaryCard themeIndex={1} title="Completed" value={stats.completed} subtext="evaluated" icon={CheckCircle2} />
                    <SummaryCard themeIndex={2} title="Awaiting" value={stats.pending} subtext="pending" icon={Clock} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-[14px] font-semibold text-slate-800">Evaluation Sequence</h3>
                        <button onClick={() => setActiveTab("students")} className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                          View All →
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                          <colgroup>
                            <col style={{ width: "52px" }} />
                            <col style={{ width: "38%" }} />
                            <col />
                            <col style={{ width: "130px" }} />
                          </colgroup>
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">#</th>
                              <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                              <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                              <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {students.slice(0, 8).map((s, idx) => (
                              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-[12px] text-slate-300 font-mono">{String(idx + 1).padStart(2, "0")}</td>
                                <td className="px-3 py-4">
                                  <div className="text-[13px] font-semibold text-slate-900 truncate">{s.name}</div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">{s.register_number}</div>
                                </td>
                                <td className="px-3 py-4 text-[12px] text-slate-500 truncate">{s.department || "General"}</td>
                                <td className="px-6 py-4">
                                  {s.status === "COMPLETED" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-semibold">
                                      <CheckCircle2 size={11} /> Done
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-semibold">
                                      <Clock size={11} /> Pending
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[14px] font-semibold text-slate-800">Completion Status</h3>
                        <MoreHorizontal size={18} className="text-slate-300" />
                      </div>
                      <div className="h-48 relative mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl font-bold text-slate-900">{stats.completed}</span>
                          <span className="text-[11px] text-slate-400 font-medium mt-0.5">Evaluated</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {chartData.map(item => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[13px] text-slate-600 font-medium">{item.name}</span>
                            </div>
                            <span className="text-[13px] font-semibold text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Students Tab ── */}
              {activeTab === "students" && (
                <motion.div key="students" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Student Directory</h1>
                    <p className="text-[13px] text-slate-500">All students assigned to your evaluation queue.</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {/* Search + Filter bar */}
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                          placeholder="Search by name or register number..."
                        />
                      </div>
                      <button
                        onClick={() => setShowFilters(true)}
                        className={`flex items-center gap-2 h-10 px-4 rounded-xl border text-[13px] font-medium transition-all ${
                          filterDept !== "ALL" || filterStatus !== "ALL"
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <Filter size={15} /> Filters
                        {(filterDept !== "ALL" || filterStatus !== "ALL") && (
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
                                    {["ALL", ...DEPARTMENTS].map(d => <option key={d} value={d}>{d === "ALL" ? "All Departments" : d}</option>)}
                                  </select>
                                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                <div className="relative">
                                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-9 text-[13px] text-slate-700 font-medium outline-none appearance-none cursor-pointer">
                                    <option value="ALL">All Status</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="NO_SHOW">No Show</option>
                                  </select>
                                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                              <button onClick={() => { setFilterDept("ALL"); setFilterStatus("ALL"); }}
                                className="flex-1 h-10 rounded-xl text-[13px] font-medium text-slate-500 hover:text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-all">
                                Reset
                              </button>
                              <button onClick={() => setShowFilters(false)}
                                className="flex-[2] h-10 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all">
                                Apply Filters
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* ── UPDATED TABLE: # | Student | Department | Resume | Interview | Actions ── */}
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed">
                        <colgroup>
                          <col style={{ width: "52px" }} />
                          <col style={{ width: "22%" }} />
                          <col />
                          <col style={{ width: "100px" }} />
                          <col style={{ width: "140px" }} />
                          <col style={{ width: "150px" }} />
                        </colgroup>
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">#</th>
                            <th className="px-3 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                            <th className="px-3 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                            <th className="px-3 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resume</th>
                            <th className="px-3 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Interview</th>
                            <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredStudents.map((s, index) => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-[12px] text-slate-300 font-mono">{String(index + 1).padStart(2, "0")}</td>
                              <td className="px-3 py-4">
                                <div className="text-[13px] font-semibold text-slate-900 truncate">{s.name}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">{s.register_number}</div>
                              </td>
                              <td className="px-3 py-4 text-[12px] text-slate-500 truncate">{s.department || "General"}</td>
                              {/* Resume column */}
                              <td className="px-3 py-4">
                                {s.resumeUrl ? (
                                  <a
                                    href={s.resumeUrl.startsWith('http') ? s.resumeUrl : `${BASE_URL}${s.resumeUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-semibold hover:bg-black transition-all"
                                  >
                                    <FileText size={12} />
                                    View
                                  </a>
                                ) : (
                                  <span className="text-[12px] text-slate-300 font-medium">—</span>
                                )}
                              </td>
                              {/* Interview status badge */}
                              <td className="px-3 py-4"><Badge status={s.status} /></td>
                              {/* Actions */}
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  {s.status !== "COMPLETED" && (
                                    <button
                                      onClick={() => navigate(`/hr/evaluate/${s.id}`)}
                                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-semibold hover:bg-blue-700 transition-all shadow-sm"
                                    >
                                      Evaluate
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleNoShow(s.assignmentId)}
                                    title="Mark No-Show"
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                                  >
                                    <X size={15} strokeWidth={2.5} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredStudents.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-16 text-center text-[13px] text-slate-400">No students match your filters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Notifications Tab ── */}
              {activeTab === "notifications" && (
                <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Notifications</h1>
                      <p className="text-[13px] text-slate-500">Stay updated on student transfers and platform alerts.</p>
                    </div>
                    {notifications.some(n => !n.isRead) && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
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
                          className={`group p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
                            n.isRead ? "border-slate-100 opacity-75" : "border-blue-100 bg-blue-50/10 shadow-sm"
                          } hover:border-blue-200`}
                        >
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                              n.isRead ? "bg-slate-50 text-slate-400" : "bg-blue-600 text-white shadow-md shadow-blue-600/20"
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
                              {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-600" />}
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
              )}

              {/* ── Feedback Tab ── */}
              {activeTab === "feedback" && (
                <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Event Feedback</h1>
                    <p className="text-[13px] text-slate-500">Share your experience from this mock placement drive.</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                    <div className="px-8 py-6">
                      <h3 className="text-[13px] font-semibold text-slate-700 mb-5">Performance Ratings</h3>
                      <div>
                        <RatingMatrix label="Student Technical Knowledge" value={feedbackForm.technicalKnowledge} onChange={v => setFeedbackForm(p => ({ ...p, technicalKnowledge: v }))} />
                        <RatingMatrix label="Service & Coordination" value={feedbackForm.serviceAndCoordination} onChange={v => setFeedbackForm(p => ({ ...p, serviceAndCoordination: v }))} />
                        <RatingMatrix label="Communication Quality" value={feedbackForm.communicationSkills} onChange={v => setFeedbackForm(p => ({ ...p, communicationSkills: v }))} />
                        <RatingMatrix label="Future Participation Likelihood" value={feedbackForm.futureParticipation} onChange={v => setFeedbackForm(p => ({ ...p, futureParticipation: v }))} />
                        <RatingMatrix label="Punctuality & Student Interest" value={feedbackForm.punctualityAndInterest} onChange={v => setFeedbackForm(p => ({ ...p, punctualityAndInterest: v }))} />
                      </div>
                    </div>

                    <div className="px-8 py-6">
                      <h3 className="text-[13px] font-semibold text-slate-700 mb-5">Written Feedback</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Suggestions</label>
                          <textarea value={feedbackForm.suggestions} onChange={e => setFeedbackForm(p => ({ ...p, suggestions: e.target.value }))}
                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder-slate-400"
                            placeholder="Any operational suggestions..." />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Issues Faced</label>
                          <textarea value={feedbackForm.issuesFaced} onChange={e => setFeedbackForm(p => ({ ...p, issuesFaced: e.target.value }))}
                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder-slate-400"
                            placeholder="Any pain points or blockers..." />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Improvement Suggestions</label>
                          <textarea value={feedbackForm.improvementSuggestions} onChange={e => setFeedbackForm(p => ({ ...p, improvementSuggestions: e.target.value }))}
                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder-slate-400"
                            placeholder="How could future drives be improved..." />
                        </div>
                      </div>
                    </div>

                    <div className="px-8 py-5 bg-slate-50 flex justify-end">
                      <button onClick={submitFeedback} disabled={submittingFeedback}
                        className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {submittingFeedback ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                        Submit Feedback
                      </button>
                    </div>
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