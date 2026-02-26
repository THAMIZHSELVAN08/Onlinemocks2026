import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Save, ShieldCheck, ClipboardCheck,
    Activity, Target, Zap, TrendingUp, UserCheck,
    Award, ChevronRight, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const EvaluationPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    interface Student {
        id: string;
        name: string;
        register_number: string;
        department?: string;
        section?: string;
        hr_name?: string;
        resume_url?: string;
    }

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    const [evaluation, setEvaluation] = useState({
        criteria: {
            appearance_attitude: 0,
            managerial_aptitude: 0,
            general_awareness: 0,
            technical_knowledge: 0,
            communication_skills: 0,
            ambition: 0,
            self_confidence: 0
        },
        strengths: '',
        improvements: '',
        comments: '',
        overallScore: 0
    });

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const res = await api.get(`/hr/student/${studentId}`);
                setStudent(res.data);
            } catch {
                navigate('/hr/students');
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [studentId, navigate]);

    const handleRating = (key: string, value: number) => {
        setEvaluation(prev => ({
            ...prev,
            criteria: { ...prev.criteria, [key]: value }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const unrated = Object.entries(evaluation.criteria).find(([_, value]) => value === 0);
        if (unrated) {
            alert(`Please provide a rating for: ${unrated[0].replace(/_/g, ' ').toUpperCase()}`);
            return;
        }
        if (evaluation.overallScore === 0) {
            alert('Please provide an overall score.');
            return;
        }

        try {
            await api.post('/hr/evaluate', { studentId, ...evaluation });
            alert('Evaluation protocol successfully finalized.');
            navigate('/hr/students');
        } catch {
            alert('Critial system error: protocol rejected.');
        }
    };

    if (loading) return <div className="p-20 text-slate-400 font-black uppercase tracking-widest animate-pulse text-center italic">Calibrating Audit Environment...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto pb-24 px-6 md:px-0 font-sans">
            <header className="flex items-center justify-between mb-12 mt-8">
                <button onClick={() => navigate('/hr/students')} className="flex items-center gap-4 text-slate-400 hover:text-[#2563eb] transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-all shadow-sm">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Return to Repository</span>
                </button>
                <div className="flex items-center gap-4 bg-white px-8 py-3 rounded-2xl border border-blue-50 text-[10px] font-black uppercase tracking-widest text-[#2563eb] shadow-sm italic transition-all hover:shadow-blue-500/10">
                    <ShieldCheck size={18} /> Audit Integrity: Guaranteed
                </div>
            </header>

            <div className="bg-[#0f172a] rounded-[4rem] p-16 mb-16 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[130px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-60"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-12 mb-12 pb-12 border-b border-white/5">
                        <motion.div whileHover={{ scale: 1.05, rotate: -2 }} className="w-32 h-32 rounded-[2.5rem] bg-[#2563eb] flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-blue-900/40 border-4 border-white/10 italic">
                            {student?.name?.[0]}
                        </motion.div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic mb-5">{student?.name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] bg-white/5 px-6 py-2.5 rounded-xl border border-white/5 italic">REG-ID: {student?.register_number}</span>
                                <span className="text-[10px] font-black text-[#2563eb] uppercase tracking-[0.25em] bg-blue-500/10 px-6 py-2.5 rounded-xl border border-blue-500/20 shadow-sm italic flex items-center gap-2">
                                    <Activity size={12} className="animate-pulse" /> Live Audit
                                </span>
                            </div>
                        </div>
                        {student?.resume_url && (
                            <a href={student.resume_url} target="_blank" rel="noreferrer" className="px-10 py-5 bg-white text-[#2563eb] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-4 active:scale-95 shadow-xl italic">
                                <FileText size={18} /> Dossier
                            </a>
                        )}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <InfoBox label="Specialization" value={student?.department} icon={Award} />
                        <InfoBox label="Deployment Territory" value={student?.section || 'NA'} icon={Activity} />
                        <InfoBox label="Lead Executive" value={student?.hr_name} icon={UserCheck} />
                        <InfoBox label="Audit Status" value="Authorized" icon={ShieldCheck} />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
                <Card className="p-16 relative overflow-hidden group bg-white border-0 shadow-xl shadow-blue-500/5">
                    <div className="absolute top-0 right-0 p-12 text-blue-50 opacity-20 group-hover:rotate-12 transition-transform">
                        <Target size={200} />
                    </div>
                    <div className="relative z-10 flex items-center gap-6 mb-16 border-l-8 border-[#2563eb] pl-8">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Assessment Matrix</h2>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic">numerical calibration of candidate intelligence</p>
                        </div>
                    </div>
                    <div className="relative z-10 space-y-4">
                        <RatingRow label="Appearance & Attitude Calibration" value={evaluation.criteria.appearance_attitude} onChange={(v) => handleRating('appearance_attitude', v)} />
                        <RatingRow label="Managerial & Strategic Aptitude" value={evaluation.criteria.managerial_aptitude} onChange={(v) => handleRating('managerial_aptitude', v)} />
                        <RatingRow label="Intelligence & Logistical Awareness" value={evaluation.criteria.general_awareness} onChange={(v) => handleRating('general_awareness', v)} />
                        <RatingRow label="Technical Infrastructure Knowledge" value={evaluation.criteria.technical_knowledge} onChange={(v) => handleRating('technical_knowledge', v)} />
                        <RatingRow label="Linguistic & Communication Protocol" value={evaluation.criteria.communication_skills} onChange={(v) => handleRating('communication_skills', v)} />
                        <RatingRow label="Vision & Career Trajectory" value={evaluation.criteria.ambition} onChange={(v) => handleRating('ambition', v)} />
                        <RatingRow label="Self-Confidence & Impact Factor" value={evaluation.criteria.self_confidence} onChange={(v) => handleRating('self_confidence', v)} />
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <InsightCard label="Operational Strengths" value={evaluation.strengths} onChange={(v: string) => setEvaluation(prev => ({ ...prev, strengths: v }))} icon={Target} color="blue" placeholder="Identify primary efficiency drivers..." />
                    <InsightCard label="Optimization Areas" value={evaluation.improvements} onChange={(v: string) => setEvaluation(prev => ({ ...prev, improvements: v }))} icon={Zap} color="indigo" placeholder="Identify critical growth territories..." />
                </div>

                <Card className="p-12 border-0 shadow-lg shadow-blue-500/5 hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#0f172a] shadow-sm border border-slate-100">
                            <ClipboardCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.25em] italic">Executive Commentary</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase mt-1 italic tracking-widest">Global summary of candidate potential</p>
                        </div>
                    </div>
                    <textarea required value={evaluation.comments} onChange={(e) => setEvaluation(prev => ({ ...prev, comments: e.target.value }))} className="input-field h-40 resize-none italic shadow-inner bg-slate-50/50 border-slate-100" placeholder="Provide global commentary..." />
                </Card>

                <motion.div whileHover={{ y: -10 }} className="bg-[#0f172a] rounded-[4.5rem] p-20 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
                    <div className="flex-1 relative z-10">
                        <div className="flex items-center gap-8 mb-10">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-[#2563eb] border border-white/10 shadow-inner group">
                                <TrendingUp size={40} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-5xl font-black text-white tracking-widest uppercase italic leading-none">Master Calibration</h3>
                                <p className="text-[11px] font-black text-blue-500/60 uppercase tracking-[0.4em] mt-4 leading-none italic">Aggregated auditory scoring protocol</p>
                            </div>
                        </div>
                        <div className="flex gap-8 items-center pl-2">
                            <div className="relative">
                                <input type="number" min="1" max="10" step="0.1" value={evaluation.overallScore} onChange={(e) => setEvaluation(prev => ({ ...prev, overallScore: Math.min(10, parseFloat(e.target.value) || 0) }))} className="w-64 bg-white/5 border border-white/10 rounded-[3rem] p-12 text-8xl font-black text-[#2563eb] outline-none focus:border-blue-500/40 transition-all text-center shadow-2xl font-mono" />
                                <div className="absolute -top-3 -right-3 w-10 h-10 bg-white text-[#0f172a] rounded-full flex items-center justify-center text-[11px] font-black shadow-lg">!</div>
                            </div>
                            <div className="text-white/10 text-6xl font-black italic tracking-tighter">/ 10.0</div>
                        </div>
                    </div>
                    <div className="w-full lg:w-auto relative z-10">
                        <button type="submit" className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-20 py-12 rounded-[4rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-blue-900/40 transition-all active:scale-95 group flex items-center justify-center gap-6 italic">
                            <Save size={32} className="group-hover:rotate-12 transition-transform" />
                            Finalize Audit
                            <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </form>
        </motion.div>
    );
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white border border-slate-200 rounded-[3.5rem] ${className}`}>{children}</div>
);

const InfoBox = ({ label, value, icon: Icon }: { label: string, value?: string, icon: React.ElementType }) => (
    <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col gap-4 group hover:bg-white/10 transition-all">
        <div className="flex items-center gap-3 text-slate-500 uppercase tracking-[0.3em] text-[9px] font-black italic">
            <Icon size={14} className="group-hover:text-[#2563eb] transition-colors" /> {label}
        </div>
        <div className="text-lg font-black text-white uppercase tracking-tight truncate pl-1">{value || 'SIGNAL LOST'}</div>
    </div>
);

const RatingRow = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="flex flex-col md:flex-row items-center justify-between p-10 bg-slate-50/50 rounded-[3.5rem] border border-slate-100 hover:border-blue-100 hover:bg-white transition-all group gap-10">
        <div className="flex items-center gap-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl italic transition-all duration-300 border-2 ${value > 0 ? 'bg-[#2563eb] text-white border-blue-400 shadow-xl shadow-blue-100' : 'bg-white text-slate-200 border-slate-100'}`}>
                {value || '!'}
            </div>
            <div>
                <div className="text-[15px] font-black text-slate-600 uppercase tracking-wide group-hover:text-slate-900 transition-colors italic leading-none">{label}</div>
                <div className="flex items-center gap-4 mt-4">
                    <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${value * 10}%` }} className="h-full bg-[#2563eb]" />
                    </div>
                    <span className="text-[11px] font-black text-[#2563eb]/60 uppercase tracking-widest italic">{value || 0} / 10.0</span>
                </div>
            </div>
        </div>
        <div className="flex flex-wrap gap-3 bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button key={n} type="button" onClick={() => onChange(n)} className={`w-12 h-12 rounded-2xl text-[12px] font-black transition-all ${value === n ? 'bg-[#2563eb] text-white shadow-xl shadow-blue-200 rotate-6' : 'text-slate-300 hover:text-[#2563eb] hover:bg-blue-50'}`}>
                    {n}
                </button>
            ))}
        </div>
    </div>
);

const InsightCard = ({ label, value, onChange, icon: Icon, color, placeholder }: {
    label: string,
    value: string,
    onChange: (v: string) => void,
    icon: React.ElementType,
    color: string,
    placeholder: string
}) => (
    <Card className="p-12 space-y-8 group hover:border-blue-200 transition-all border-0 shadow-lg shadow-blue-500/5">
        <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 shadow-sm border border-${color}-100 group-hover:scale-110 transition-transform`}>
                <Icon size={32} />
            </div>
            <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.25em] italic">{label}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-1 italic tracking-widest">Efficiency drivers</p>
            </div>
        </div>
        <textarea required value={value} onChange={(e) => onChange(e.target.value)} className="input-field h-56 resize-none italic shadow-inner bg-slate-50/50 border-slate-100" placeholder={placeholder} />
    </Card>
);

export default EvaluationPage;
