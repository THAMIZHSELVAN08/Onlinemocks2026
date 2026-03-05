import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ShieldCheck, ClipboardCheck, 
    FileText, Save, Activity, Target, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const EvaluationPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    interface Student {
        id: string;
        name: string;
        register_number?: string;
        registerNumber?: string;
        department?: string;
        section?: string;
        hr_name?: string;
        resume_url?: string;
        overallScore?: number;
    }

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [evaluation, setEvaluation] = useState({
        criteria: {
            appearanceAttitude: 0,
            managerialAptitude: 0,
            generalAwareness: 0,
            technicalKnowledge: 0,
            communicationSkills: 0,
            ambition: 0,
            selfConfidence: 0
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
                navigate('/hr/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
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
            alert(`Please provide a rating for: ${unrated[0].replace(/([A-Z])/g, ' $1').toUpperCase()}`);
            return;
        }
        if (evaluation.overallScore === 0) {
            alert('Please provide an overall score.');
            return;
        }

        try {
            await api.post('/hr/evaluate', { studentId, ...evaluation });
            alert('Evaluation protocol successfully finalized.');
            navigate('/hr/dashboard');
        } catch {
            alert('Critial system error: protocol rejected.');
        }
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(currentTime);

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
            <Activity className="w-10 h-10 text-indigo-600 animate-pulse" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initializing Audit Environment...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-600/10">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-24 px-6">
                <header className="flex items-center justify-between py-8">
                    <button onClick={() => navigate('/hr/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all group">
                        <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-slate-300 transition-all shadow-sm">
                            <ChevronLeft size={16} strokeWidth={3} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">Workspace</span>
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-sm text-[12px] font-bold text-slate-600">
                            <Clock size={16} className="text-slate-400" />
                            {formattedDate}
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck size={14} /> Protocol active
                        </div>
                    </div>
                </header>

                {/* Candidate Selection Card */}
                <div className="bg-white border border-slate-200/60 rounded-[32px] p-8 mb-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-600/20">
                                {student?.name?.[0]}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">{student?.name}</h1>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black border border-slate-100 rounded uppercase tracking-widest">{student?.register_number || student?.registerNumber}</span>
                                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{student?.department || 'Specialization Domain'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {student?.resume_url && (
                                <a href={student.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-900/10">
                                    <FileText size={14} /> Open Repository
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Matrix Card */}
                    <div className="bg-white border border-slate-200/60 rounded-[32px] p-8 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100"><ClipboardCheck size={20} /></div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-slate-900">Assessment Matrix</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Quantitative Evaluation Filters</p>
                            </div>
                        </div>
                        
                        <div className="divide-y divide-slate-50 -mx-8 px-8">
                            <RatingRow label="Appearance & Attitude" value={evaluation.criteria.appearanceAttitude} onChange={(v) => handleRating('appearanceAttitude', v)} />
                            <RatingRow label="Managerial Aptitude" value={evaluation.criteria.managerialAptitude} onChange={(v) => handleRating('managerialAptitude', v)} />
                            <RatingRow label="General Awareness" value={evaluation.criteria.generalAwareness} onChange={(v) => handleRating('generalAwareness', v)} />
                            <RatingRow label="Technical Knowledge" value={evaluation.criteria.technicalKnowledge} onChange={(v) => handleRating('technicalKnowledge', v)} />
                            <RatingRow label="Communication Skills" value={evaluation.criteria.communicationSkills} onChange={(v) => handleRating('communicationSkills', v)} />
                            <RatingRow label="Ambition Scale" value={evaluation.criteria.ambition} onChange={(v) => handleRating('ambition', v)} />
                            <RatingRow label="Self-Confidence" value={evaluation.criteria.selfConfidence} onChange={(v) => handleRating('selfConfidence', v)} />
                        </div>
                    </div>

                    {/* Synthesis Card */}
                    <div className="bg-white border border-slate-200/60 rounded-[32px] p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100"><Activity size={20} /></div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-slate-900">Audit Synthesis</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Qualitative Candidate Logic</p>
                            </div>
                        </div>
                        
                        <div className="space-y-8">
                            <FormTextarea 
                                required 
                                label="Core Strengths"
                                value={evaluation.strengths} 
                                onChange={(e: any) => setEvaluation(prev => ({ ...prev, strengths: e.target.value }))} 
                                placeholder="Analyze primary performance metrics..."
                            />
                            <FormTextarea 
                                required 
                                label="Optimization Areas"
                                value={evaluation.improvements} 
                                onChange={(e: any) => setEvaluation(prev => ({ ...prev, improvements: e.target.value }))} 
                                placeholder="Identify vectors for talent development..."
                            />
                            <FormTextarea 
                                required 
                                label="Executive Summary"
                                value={evaluation.comments} 
                                onChange={(e: any) => setEvaluation(prev => ({ ...prev, comments: e.target.value }))} 
                                placeholder="Consolidated synthesis of potential..."
                            />
                        </div>
                    </div>

                    {/* Finalization Card */}
                    <div className="bg-white border border-slate-200/60 rounded-[32px] p-8 shadow-xl shadow-indigo-600/5 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] pointer-events-none group-hover:bg-indigo-600/10 transition-colors duration-700" />
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/10 transition-transform group-hover:scale-110 duration-500">
                                <Target size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Final Result Aggregate</p>
                                <div className="flex items-baseline gap-2">
                                    <div className="relative group/score">
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="10" 
                                            step="0.1" 
                                            value={evaluation.overallScore} 
                                            onChange={(e) => setEvaluation(prev => ({ ...prev, overallScore: Math.min(10, parseFloat(e.target.value) || 0) }))} 
                                            className="w-20 bg-slate-50 border border-slate-200 rounded-xl py-2 text-2xl font-black text-indigo-600 text-center outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all tabular-nums" 
                                        />
                                    </div>
                                    <span className="text-slate-400 text-lg font-black tracking-tighter">/ 10</span>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="w-full md:w-auto px-12 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[18px] font-black text-[12px] uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 group-hover:-translate-y-1 duration-300">
                            <Save size={18} />
                            Finalize Evaluation
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const RatingRow = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="flex flex-col lg:flex-row items-center justify-between py-6 gap-6 group">
        <div className="text-[14px] font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{label}</div>
        <div className="flex items-center gap-4">
            <div className="flex gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button 
                        key={n} 
                        type="button" 
                        onClick={() => onChange(n)} 
                        className={`w-9 h-9 rounded-lg text-[11px] font-black transition-all ${value === n 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-110' 
                            : 'text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                        }`}
                    >
                        {n}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

const FormTextarea = ({ label, required, value, onChange, placeholder }: any) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label} {required && <span className="text-rose-500">*</span>}</label>
        </div>
        <textarea 
            required={required}
            value={value}
            onChange={onChange}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-32 p-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-200 outline-none resize-none transition-all leading-relaxed"
            placeholder={placeholder}
        />
    </div>
);

export default EvaluationPage;
