import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ShieldCheck, ClipboardCheck, 
    FileText, Save, Activity, Target
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
            navigate('/hr/students');
        } catch {
            alert('Critial system error: protocol rejected.');
        }
    };

    if (loading) return <div className="p-20 text-slate-400 font-black uppercase tracking-widest animate-pulse text-center italic">Calibrating Audit Environment...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto pb-20 px-6 font-sans text-[#111111] bg-[#FBFBFD] min-h-screen">
            <header className="flex items-center justify-between py-6">
                <button onClick={() => navigate('/hr/students')} className="flex items-center gap-2 text-[#86868B] hover:text-black transition-all group">
                    <div className="p-1.5 rounded-lg bg-white border border-[#D2D2D7]/30 group-hover:bg-[#F5F5F7] transition-all">
                        <ChevronLeft size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold tracking-tight">Return to Dashboard</span>
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D2D2D7]/30 rounded-full text-[9px] font-black uppercase tracking-[0.1em] text-[#0055ff] shadow-sm">
                    <ShieldCheck size={14} strokeWidth={2} />
                    Evaluation Protocol
                </div>
            </header>

            <div className="bg-white border border-[#D2D2D7]/30 rounded-[2rem] p-8 mb-8 shadow-sm">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0055ff] to-[#9d00ff] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/10">
                            {student?.name?.[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-black mb-1">{student?.name}</h1>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 bg-[#F5F5F7] text-[#86868B] text-[9px] font-bold rounded border border-[#D2D2D7]/20 uppercase tracking-widest">{student?.register_number || student?.registerNumber}</span>
                                <div className="w-1 h-1 bg-[#D2D2D7] rounded-full" />
                                <span className="text-xs font-semibold text-[#86868B]">{student?.department || 'Specialization Domain'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {student?.resume_url && (
                            <a href={student.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#1C1C1E] transition-all active:scale-95 shadow-lg shadow-black/5">
                                <FileText size={14} /> Repository
                            </a>
                        )}
                    </div>
                </div>
            </div>



            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white border border-[#D2D2D7]/30 rounded-[2rem] p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8 border-b border-[#F2F2F7] pb-6">
                        <div className="p-2 bg-blue-50 text-[#0055ff] rounded-lg"><ClipboardCheck size={20} /></div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-black">Assessment Matrix</h2>
                            <p className="text-[9px] font-semibold text-[#86868B] uppercase tracking-widest mt-0.5">Quantitative Performance Indicators</p>
                        </div>
                    </div>
                    <div className="divide-y divide-[#F2F2F7]">
                        <RatingRow label="Appearance & Attitude" value={evaluation.criteria.appearanceAttitude} onChange={(v) => handleRating('appearanceAttitude', v)} />
                        <RatingRow label="Managerial Aptitude" value={evaluation.criteria.managerialAptitude} onChange={(v) => handleRating('managerialAptitude', v)} />
                        <RatingRow label="General Awareness" value={evaluation.criteria.generalAwareness} onChange={(v) => handleRating('generalAwareness', v)} />
                        <RatingRow label="Technical Knowledge" value={evaluation.criteria.technicalKnowledge} onChange={(v) => handleRating('technicalKnowledge', v)} />
                        <RatingRow label="Communication Skills" value={evaluation.criteria.communicationSkills} onChange={(v) => handleRating('communicationSkills', v)} />
                        <RatingRow label="Ambition Scale" value={evaluation.criteria.ambition} onChange={(v) => handleRating('ambition', v)} />
                        <RatingRow label="Self-Confidence" value={evaluation.criteria.selfConfidence} onChange={(v) => handleRating('selfConfidence', v)} />
                    </div>
                </div>

                <div className="bg-white border border-[#D2D2D7]/30 rounded-[2rem] p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8 border-b border-[#F2F2F7] pb-6">
                        <div className="p-2 bg-indigo-50 text-[#5E5CE6] rounded-lg"><Activity size={20} /></div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-black">Audit Synthesis</h2>
                            <p className="text-[9px] font-semibold text-[#86868B] uppercase tracking-widest mt-0.5">Qualitative Auditor Synthesis</p>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        <FormTextarea 
                            required 
                            label="Students Strengths"
                            value={evaluation.strengths} 
                            onChange={(e: any) => setEvaluation(prev => ({ ...prev, strengths: e.target.value }))} 
                            placeholder="Document core operational strengths..."
                        />
                        <FormTextarea 
                            required 
                            label="Areas for Optimization"
                            value={evaluation.improvements} 
                            onChange={(e: any) => setEvaluation(prev => ({ ...prev, improvements: e.target.value }))} 
                            placeholder="Identify vectors for professional growth..."
                        />
                        <FormTextarea 
                            required 
                            label="General Executive Summary"
                            value={evaluation.comments} 
                            onChange={(e: any) => setEvaluation(prev => ({ ...prev, comments: e.target.value }))} 
                            placeholder="Synthesis of overall students potential..."
                        />
                    </div>
                </div>

                <div className="bg-black text-white rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="p-3 bg-white/10 rounded-xl border border-white/10"><Target size={24} className="text-[#0055ff]" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Audit Aggregate</p>
                            <div className="flex items-baseline gap-2">
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="10" 
                                    step="0.1" 
                                    value={evaluation.overallScore} 
                                    onChange={(e) => setEvaluation(prev => ({ ...prev, overallScore: Math.min(10, parseFloat(e.target.value) || 0) }))} 
                                    className="w-16 bg-white/5 border border-white/10 rounded-lg py-1 text-2xl font-black text-[#0055ff] text-center outline-none focus:ring-2 focus:ring-[#0055ff]/50 transition-all tabular-nums" 
                                />
                                <span className="text-slate-500 text-lg font-bold">/ 10</span>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full md:w-auto px-10 h-12 bg-[#0055ff] hover:bg-blue-600 text-white rounded-full font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 group">
                        <Save size={16} />
                        Submit
                    </button>
                </div>
            </form>
        </motion.div>
    );
};





const RatingRow = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="flex flex-col lg:flex-row items-center justify-between py-6 gap-6 group">
        <div className="text-[14px] font-bold text-black tracking-tight group-hover:text-[#0055ff] transition-colors">{label}</div>
        <div className="flex items-center gap-4">
            <div className="flex gap-1 p-1 bg-[#F5F5F7]/50 border border-[#D2D2D7]/20 rounded-lg">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button 
                        key={n} 
                        type="button" 
                        onClick={() => onChange(n)} 
                        className={`w-8 h-8 rounded text-[11px] font-bold transition-all ${value === n 
                            ? 'bg-black text-white shadow' 
                            : 'text-[#86868B] hover:bg-white hover:text-black hover:shadow-sm'
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
            <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
        </div>
        <textarea 
            required={required}
            value={value}
            onChange={onChange}
            className="w-full bg-[#FBFBFD] border border-[#D2D2D7]/50 rounded-xl h-32 p-4 text-xs font-medium text-[#111111] placeholder-[#86868B]/40 focus:ring-4 focus:ring-[#0055ff]/5 focus:border-[#0055ff] outline-none resize-none transition-all leading-relaxed"
            placeholder={placeholder}
        />
    </div>
);



export default EvaluationPage;
