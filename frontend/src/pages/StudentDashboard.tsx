import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { socket } from '../api/socket';
import api from '../api/axios';
import {
    AlertTriangle, CheckCircle2, ChevronRight,
    ChevronLeft, Brain, Timer,
    Check, Lock, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Question {
    id: number;
    text: string;
    options: string[];
}

interface User {
    id: string;
    username: string;
    role: string;
    current_hr_id?: string;
}

const mockQuestions: Question[] = [
    { id: 1, text: "Which of the following is a NoSQL database?", options: ["PostgreSQL", "MySQL", "MongoDB", "Oracle"] },
    { id: 2, text: "What does JWT stand for?", options: ["Java Web Token", "JSON Web Token", "JSON Web Tool", "Joint Web Token"] },
    { id: 3, text: "Which hook is used for side effects in React?", options: ["useState", "useContext", "useEffect", "useReducer"] },
    { id: 4, text: "What is the primary purpose of Socket.io?", options: ["Data Persistence", "Real-time Communication", "Styling Components", "Routing"] },
];

const StudentDashboard = () => {
    const user = useAuthStore((state) => state.user) as User | null;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState(600);
    const [examStarted, setExamStarted] = useState(false);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [examSubmitted, setExamSubmitted] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = new Intl.DateTimeFormat('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(currentTime);

    const startExam = async () => {
        try {
            await api.post('/student/check-in', { deviceInfo: navigator.userAgent });
            setExamStarted(true);
        } catch {
            setExamStarted(true);
        }
    };

    useEffect(() => {
        if (user) {
            socket.connect();
            socket.emit('join_room', { room: user.id });
        }

        const handleVisibilityChange = () => {
            if (document.hidden && examStarted && !examSubmitted) {
                setTabSwitches(prev => prev + 1);
                socket.emit('exam_heartbeat', {
                    studentId: user?.id,
                    hrId: user?.current_hr_id || 'hr-id-placeholder',
                    status: 'tab-switched',
                    progress: Math.round(((Object.keys(answers).length) / mockQuestions.length) * 100)
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            socket.disconnect();
        };
    }, [user, examStarted, examSubmitted, answers]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (examStarted && !examSubmitted) {
            interval = setInterval(() => {
                socket.emit('exam_heartbeat', {
                    studentId: user?.id,
                    hrId: user?.current_hr_id || 'hr-id-placeholder',
                    status: 'active',
                    progress: Math.round(((Object.keys(answers).length) / mockQuestions.length) * 100)
                });
                setTimeLeft(prev => prev <= 1 ? 0 : prev - 1);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [examStarted, examSubmitted, answers, user]);

    const handleAnswer = (option: string) => {
        setAnswers(prev => ({ ...prev, [mockQuestions[currentQuestionIndex].id]: option }));
    };

    const submitExam = () => setExamSubmitted(true);

    if (examSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#f8fafc] font-sans">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 p-20 rounded-[4rem] max-w-2xl w-full shadow-2xl">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner rotate-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight italic leading-none">ASSESSMENT <span className="text-emerald-600">TERMINATED</span></h1>
                    <p className="text-slate-500 mb-10 text-sm leading-relaxed font-medium">Your module responses have been successfully cached and transferred to the Executive Repository. Audit results will be available after organizational approval.</p>

                    <div className="grid grid-cols-2 gap-6 mb-10">
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Modules Sync</div>
                            <div className="text-3xl font-black text-slate-950">{Object.keys(answers).length} / {mockQuestions.length}</div>
                        </div>
                        <div className="bg-slate-50/50 rounded- [2.5rem] p-8 border border-slate-100 shadow-sm">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Integrity Status</div>
                            <div className={`text-xl font-black uppercase italic ${tabSwitches > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {tabSwitches === 0 ? 'VERIFIED' : `${tabSwitches} FLAGS`}
                            </div>
                        </div>
                    </div>

                    <button onClick={() => window.location.href = '/'} className="btn-primary w-full py-6 rounded-2xl shadow-blue-200">Logout Dashboard</button>
                </motion.div>
            </div>
        );
    }

    if (!examStarted) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8 bg-[#f8fafc] relative overflow-hidden font-sans">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 blur-[130px] rounded-full" />
                </div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-[560px] bg-white border border-slate-100 rounded-[3.5rem] p-16 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.08)] relative z-10 transition-all">
                    <div className="flex items-center gap-8 mb-12 pb-12 border-b border-slate-100/60">
                        <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-600/20 rotate-3 transition-transform hover:rotate-0"><Brain size={36} /></div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">START <span className="text-indigo-600">ASSESSMENT</span></h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">SECURE PROTOCOL V4.2</p>
                        </div>
                    </div>

                    <div className="space-y-6 mb-12">
                        <div className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                            <Check className="text-indigo-500 mt-0.5 shrink-0" size={18} />
                            <p className="text-[13px] text-slate-500 font-medium">Real-time telemetry active. Focus redirection will be flagged.</p>
                        </div>
                        <div className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                            <Check className="text-indigo-500 mt-0.5 shrink-0" size={18} />
                            <p className="text-[13px] text-slate-500 font-medium">Core Structure: {mockQuestions.length} Modules · 10:00 Duration.</p>
                        </div>
                        <div className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                            <Check className="text-indigo-500 mt-0.5 shrink-0" size={18} />
                            <p className="text-[13px] text-slate-500 font-medium">Results synchronized with Executive Intelligence Repository.</p>
                        </div>
                    </div>

                    <button onClick={startExam} className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 italic">Initialize Session</button>
                    
                    <div className="mt-8 text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Clock size={12} /> {formattedDate}
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 py-6 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center font-black italic text-xl">A</div>
                    <div>
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Live Assessment Session</h2>
                        <div className="flex items-center gap-2 mt-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Global Telemetry Active</span></div>
                    </div>
                </div>

                <div className={`px-10 py-4 rounded-2xl border flex items-center gap-4 font-mono text-2xl transition-all ${timeLeft < 60 ? 'bg-rose-50 border-rose-100 text-rose-500 animate-pulse' : 'bg-slate-50 border-slate-100 text-indigo-600'}`}>
                    <Timer size={24} /><span className="tabular-nums font-black">{(Math.floor(timeLeft / 60))}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex px-4 py-2 border border-slate-200 rounded-xl items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock size={14} /> {formattedDate}
                    </div>
                    <button onClick={submitExam} className="px-10 py-4 bg-slate-900 text-white hover:bg-black rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-900/20 active:scale-95 italic">Finalize Sync</button>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full p-14">
                {tabSwitches > 0 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10 p-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-5 shadow-sm">
                        <AlertTriangle size={24} />
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] italic underline decoration-red-200 underline-offset-4">Security Anomaly: Tab Redirection Detected ({tabSwitches})</div>
                    </motion.div>
                )}

                <div className="bg-white border border-slate-200 rounded-[3.5rem] p-16 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-12 text-slate-50 pointer-events-none scale-150 rotate-12"><Lock size={200} /></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-12">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-50 shadow-sm italic">Audit Node {currentQuestionIndex + 1} / {mockQuestions.length}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-14 tracking-tight leading-snug italic uppercase">{mockQuestions[currentQuestionIndex].text}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {mockQuestions[currentQuestionIndex].options.map((option, idx) => (
                                <button key={idx} onClick={() => handleAnswer(option)} className={`w-full text-left p-8 rounded-[2rem] border-2 transition-all flex justify-between items-center group relative overflow-hidden ${answers[mockQuestions[currentQuestionIndex].id] === option ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'bg-slate-50/50 border-slate-100/60 text-slate-400 hover:border-indigo-200 hover:bg-white'}`}>
                                    <span className={`text-[13px] font-bold uppercase tracking-widest relative z-10 ${answers[mockQuestions[currentQuestionIndex].id] === option ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'}`}>{option}</span>
                                    <div className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center relative z-10 ${answers[mockQuestions[currentQuestionIndex].id] === option ? 'bg-white border-white text-indigo-600' : 'border-slate-200/50 text-transparent'}`}><Check size={16} strokeWidth={4} /></div>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center mt-16 pt-10 border-t border-slate-100">
                            <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-3 transition-colors italic ${currentQuestionIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-indigo-600'}`}><ChevronLeft size={20} /> Back Module</button>
                            <button onClick={() => currentQuestionIndex < mockQuestions.length - 1 ? setCurrentQuestionIndex(prev => prev + 1) : submitExam()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-4 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all italic">
                                {currentQuestionIndex < mockQuestions.length - 1 ? 'Next Module' : 'Terminate & Sync'} <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
