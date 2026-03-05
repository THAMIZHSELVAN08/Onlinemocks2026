import { useState, useEffect } from "react";
import {
  Search,
  LogOut,
  Loader2,
  LayoutGrid,
  Clock,
  UserPlus,
  Users,
  CheckCircle2,
  HelpCircle,
  Bell,
  Info,
  ChevronDown,
  PanelLeft,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuthStore } from "../store/useAuthStore";
import api from "../api/axios";
import { socket } from "../api/socket";
import { toast } from "sonner";

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function VolunteerDashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "enroll">("overview");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "COMPLETED" | "NO_SHOW"
  >("ALL");
  const [formData, setFormData] = useState({
    name: "",
    register_number: "",
    department: "",
    resume_url: "",
  });

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
    "Biotechnology",
  ];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);

    // Connect to socket for real-time notifications
    if (user?.id) {
      socket.connect();
      socket.emit("join_room", { room: user.id });

      socket.on("student_transferred", (data: { message: string; count: number }) => {
        toast.success("New Student Added", {
          description: data.message,
        });
        fetchData(); // auto-refresh
      });

      socket.on("admin_notification", (data: { title: string; message: string }) => {
        toast.info(data.title, {
          description: data.message,
        });
      });
    }

    return () => {
      clearInterval(interval);
      socket.off("student_transferred");
      socket.off("admin_notification");
      socket.disconnect();
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
      alert("Please enter a valid Google Drive link.");
      return;
    }
    try {
      await api.post("/volunteer/enroll", formData);
      alert("Student identity successfully registered.");
      setFormData({
        name: "",
        register_number: "",
        department: "",
        resume_url: "",
      });
      fetchData();
      setActiveTab("overview");
    } catch {
      alert("Enrolment protocol failed.");
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.register_number.toLowerCase().includes(q);
    const status = s.evaluation_status || s.status;
    const matchesFilter = filterStatus === "ALL" || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const noShows = students.filter((s) => s.status === "NO_SHOW").length;
  const completed = students.filter(
    (s) => s.status === "COMPLETED" || s.evaluation_status === "COMPLETED",
  ).length;
  const pending = students.filter(
    (s) =>
      (s.status === "PENDING" || s.status === "IN_PROGRESS") &&
      s.evaluation_status !== "COMPLETED",
  ).length;
  const total = students.length;

  const chartData = [
    { name: "Evaluated", value: completed, color: "#10b981" },
    { name: "Pending", value: pending, color: "#334155" },
    { name: "Absent", value: noShows, color: "#ef4444" },
  ];

  return (
    <div className="bg-[#F7F8FA] font-sans text-slate-900 selection:bg-emerald-600/10 selection:text-emerald-600">
      {/* ── Mobile Backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Inset Container ── */}
      <div
        className="relative mx-auto bg-white shadow-xl shadow-slate-200/50 flex overflow-hidden"
        style={{ height: "100vh" }}
      >
        {/* ── Sidebar (desktop) ── */}
        <aside
          className={[
            "flex flex-col bg-white border-r border-slate-100 transition-all duration-300 overflow-hidden z-50",
            "hidden md:flex",
            sidebarOpen ? "md:w-64" : "md:w-[72px]",
          ].join(" ")}
        >
          <div
            className={`flex items-center gap-3 px-4 pt-5 pb-7 ${sidebarOpen ? "" : "justify-center px-0"}`}
          >
            <div className="w-8 h-8 shrink-0 bg-emerald-600 rounded-lg flex items-center justify-center">
              <LayoutGrid size={18} className="text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-slate-900 tracking-tight whitespace-nowrap flex-1">
                Volunteer Portal
              </span>
            )}
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            <SidebarLink
              active={activeTab === "overview"}
              collapsed={!sidebarOpen}
              onClick={() => setActiveTab("overview")}
              icon={LayoutGrid}
              label="Dashboard"
              badge
            />
            {sidebarOpen && (
              <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">
                Management
              </div>
            )}
            {!sidebarOpen && <div className="my-3 border-t border-slate-100" />}
            <SidebarLink
              active={activeTab === "enroll"}
              collapsed={!sidebarOpen}
              onClick={() => setActiveTab("enroll")}
              icon={UserPlus}
              label="Enroll Student"
            />
            <SidebarLink
              active={false}
              collapsed={!sidebarOpen}
              onClick={() => {}}
              icon={Bell}
              label="Notifications"
            />
            {sidebarOpen && (
              <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">
                Support
              </div>
            )}
            {!sidebarOpen && <div className="my-3 border-t border-slate-100" />}
            <SidebarLink
              active={false}
              collapsed={!sidebarOpen}
              onClick={() => {}}
              icon={HelpCircle}
              label="Documentation"
            />
          </nav>

          {sidebarOpen && (
            <div className="px-3 pb-6 pt-4 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle size={14} className="text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-900">
                    Need Support?
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium mb-3 leading-relaxed">
                  Get in touch with our platform agents.
                </p>
                <button className="w-full bg-white border border-slate-200 py-2 rounded-xl text-[10px] font-bold text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
                  Contact us
                </button>
              </div>
              <div className="px-1 flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-[9px] font-medium text-slate-400 cursor-pointer hover:text-slate-600">
                  Privacy policy
                </span>
                <span className="text-[9px] font-medium text-slate-400 cursor-pointer hover:text-slate-600">
                  Terms of service
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* ── Mobile Drawer ── */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-100 md:hidden",
            "transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center gap-3 px-5 pt-5 pb-7 border-b border-slate-100">
            <div className="w-8 h-8 shrink-0 bg-emerald-600 rounded-lg flex items-center justify-center">
              <LayoutGrid size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">
              Volunteer Portal
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <SidebarLink
              active={activeTab === "overview"}
              collapsed={false}
              onClick={() => {
                setActiveTab("overview");
                setMobileOpen(false);
              }}
              icon={LayoutGrid}
              label="Dashboard"
              badge
            />
            <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">
              Management
            </div>
            <SidebarLink
              active={activeTab === "enroll"}
              collapsed={false}
              onClick={() => {
                setActiveTab("enroll");
                setMobileOpen(false);
              }}
              icon={UserPlus}
              label="Enroll Student"
            />
            <SidebarLink
              active={false}
              collapsed={false}
              onClick={() => {}}
              icon={Bell}
              label="Notifications"
            />
            <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">
              Support
            </div>
            <SidebarLink
              active={false}
              collapsed={false}
              onClick={() => {}}
              icon={HelpCircle}
              label="Documentation"
            />
          </nav>
          <div className="px-4 pb-6">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[12px] font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0 z-30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Menu size={20} />
              </button>
              <nav className="hidden sm:flex items-center gap-6">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all shrink-0"
                >
                  <PanelLeft size={18} />
                </button>
                <nav className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold">
                  <span className="text-slate-400">Volunteer Portal</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-black">
                    {activeTab === "overview" && "Dashboard"}
                    {activeTab === "enroll" && "Enroll Student"}
                  </span>
                </nav>
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <div className="h-8 w-[1px] bg-slate-200 mx-2" />

              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-slate-200 transition-all">
                  {user?.name?.[0] || "V"}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-slate-900">
                    {user?.name || "Volunteer"}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
              </div>

              <div className="p-2 text-slate-400 hover:text-slate-900 cursor-pointer transition-colors relative">
                <Bell size={20} />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-[#F7F8FA] rounded-full" />
              </div>

              <div
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8 pb-16 relative">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                  Synchronizing Pipeline...
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <SummaryCard
                        title="Total Students"
                        value={total}
                        subtext="Students Directory"
                        icon={Users}
                      />
                      <SummaryCard
                        title="Evaluated"
                        value={completed}
                        subtext="Students Evaluated"
                        icon={CheckCircle2}
                      />
                      <SummaryCard
                        title="Pending"
                        value={pending}
                        subtext="Students Pending"
                        icon={Clock}
                      />
                      <SummaryCard
                        title="Absentee"
                        value={noShows}
                        subtext="No Show Count"
                        icon={X}
                      />
                    </div>

                    {/* Table + Chart Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Student Table */}
                      <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 md:items-center justify-between bg-white sticky top-0">
                          <div className="relative group flex-1 max-w-md">
                            <Search
                              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                              size={16}
                            />
                            <input
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full bg-slate-50 border-none rounded-2xl h-12 pl-12 pr-6 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all"
                              placeholder="Search students..."
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(
                              [
                                ["ALL", "All"],
                                ["PENDING", "Pending"],
                                ["COMPLETED", "Verified"],
                                ["NO_SHOW", "Absentees"],
                              ] as const
                            ).map(([key, label]) => (
                              <button
                                key={key}
                                onClick={() => setFilterStatus(key as any)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === key ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20" : "bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-200"}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 overflow-x-auto min-h-[400px]">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-slate-50/50">
                                <th className="pl-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-14 text-center">
                                  S.no
                                </th>
                                <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Student Name
                                </th>
                                <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                  Department
                                </th>
                                <th className="pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredStudents.map((s, idx) => (
                                <tr
                                  key={s.id}
                                  className="group hover:bg-slate-50/30 transition-all"
                                >
                                  <td className="pl-8 py-5 text-[12px] font-bold text-slate-300 text-center">
                                    {idx + 1}
                                  </td>
                                  <td className="py-5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                        {s.name[0]}
                                      </div>
                                      <div>
                                        <div className="text-[13px] font-bold text-slate-900 tracking-tight">
                                          {s.name}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                          {s.register_number}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-5 text-center">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                      {s.department || "General"}
                                    </span>
                                  </td>
                                  <td className="pr-8 py-5 text-center">
                                    {s.evaluation_status === "COMPLETED" ||
                                    s.status === "COMPLETED" ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                        <CheckCircle2 size={11} /> Verified
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                        <Clock size={11} /> Awaiting HR
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {filteredStudents.length === 0 && (
                            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
                              <Search size={32} strokeWidth={1.5} />
                              <p className="text-[10px] font-black uppercase tracking-[0.25em]">
                                No matching students detected
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pie Chart Panel */}
                      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col h-fit">
                        <div className="flex justify-between items-center mb-10">
                          <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            Session Status{" "}
                            <Info size={14} className="text-slate-300" />
                          </h3>
                        </div>

                        <div className="h-64 relative mb-12">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={75}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-slate-900">
                              {total}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Total
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6">
                          {chartData.map((item) => (
                            <div
                              key={item.name}
                              className="flex items-center gap-2.5"
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-900 leading-none mb-1">
                                  {item.name}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  {item.value} Units
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "enroll" && (
                  <motion.div
                    key="enroll"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl space-y-10"
                  >
                    <header className="mb-10">
                      <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">
                        Enroll{" "}
                        <span className="text-emerald-600">Student</span>
                      </h1>
                      <p className="text-slate-400 font-medium text-[15px]">
                        Initialize student identity for the evaluation pipeline.
                      </p>
                    </header>

                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-12 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] pointer-events-none" />

                      <form
                        onSubmit={handleEnrollSubmit}
                        className="space-y-10"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                              Student Name
                            </label>
                            <input
                              value={formData.name}
                              onChange={(e) =>
                                setFormData((p) => ({
                                  ...p,
                                  name: e.target.value,
                                }))
                              }
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 text-sm font-bold placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all"
                              placeholder="Full Name"
                              required
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                              Reg Number
                            </label>
                            <input
                              value={formData.register_number}
                              onChange={(e) =>
                                setFormData((p) => ({
                                  ...p,
                                  register_number: e.target.value,
                                }))
                              }
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 text-sm font-bold placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all"
                              placeholder="Format: 212723xxxxxxx"
                              required
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                              Department
                            </label>
                            <select
                              value={formData.department}
                              onChange={(e) =>
                                setFormData((p) => ({
                                  ...p,
                                  department: e.target.value,
                                }))
                              }
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all appearance-none"
                              required
                            >
                              <option value="" disabled>
                                Select Department
                              </option>
                              {departments.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                              Resume (Drive Link)
                            </label>
                            <input
                              value={formData.resume_url}
                              onChange={(e) =>
                                setFormData((p) => ({
                                  ...p,
                                  resume_url: e.target.value,
                                }))
                              }
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-14 px-6 text-sm font-bold placeholder-slate-400 focus:ring-4 focus:ring-emerald-600/5 outline-none transition-all"
                              placeholder="drive.google.com/..."
                              required
                            />
                          </div>
                        </div>

                        <div className="pt-6 flex justify-end">
                          <button
                            type="submit"
                            className="px-16 py-5 bg-emerald-600 text-white rounded-full text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-4 active:scale-95 font-sans"
                          >
                            <UserPlus size={18} />
                            Enroll Student
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
    </div>
  );
}

// ─── Support Components ───────────────────────────────────────────────────────

function SidebarLink({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
  collapsed,
}: any) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all relative group ${
        collapsed ? "justify-center px-0" : ""
      } ${
        active
          ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/50"
          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/50"
      }`}
    >
      <div
        className={`p-1.5 rounded-lg shrink-0 transition-all ${active ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900"}`}
      >
        <Icon size={16} strokeWidth={active ? 3 : 2} />
      </div>
      {!collapsed && (
        <span
          className={`text-[12px] tracking-tight transition-all whitespace-nowrap ${active ? "font-black" : "font-bold text-slate-400"}`}
        >
          {label}
        </span>
      )}

      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-600 rounded-r-full" />
      )}
      {badge && !collapsed && (
        <div className="ml-auto w-1.5 h-1.5 bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(5,150,105,0.4)]" />
      )}
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
          <span className="text-4xl font-black text-slate-900 tracking-tighter">
            {value}
          </span>
        </div>
        <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white rounded-2xl transition-all duration-500 shadow-sm">
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 relative z-10 group-hover:text-emerald-600 transition-colors">
        {subtext}{" "}
        <span className="text-lg leading-none translate-x-0 group-hover:translate-x-1 transition-transform">
          →
        </span>
      </div>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-600/5 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
    </div>
  );
}
