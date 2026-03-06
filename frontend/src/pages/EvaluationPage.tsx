import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ShieldCheck, ClipboardCheck,
    FileText, Save, Activity, Target, Clock, User
} from 'lucide-react';
import { motion } from 'framer-motion';
import api, { BASE_URL } from '../api/axios';

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
    evaluation?: any;
    aptitudeScore?: number;
    gdScore?: number;
}

const EvaluationPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

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
            selfConfidence: 0,
        },
        strengths: '',
        improvements: '',
        comments: '',
        overallScore: 0,
    });

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const res = await api.get(`/hr/student/${studentId}`);
                setStudent(res.data);
                if (res.data.evaluation) {
                    const e = res.data.evaluation;
                    setEvaluation({
                        criteria: {
                            appearanceAttitude: e.appearanceAttitude || 0,
                            managerialAptitude: e.managerialAptitude || 0,
                            generalAwareness: e.generalAwareness || 0,
                            technicalKnowledge: e.technicalKnowledge || 0,
                            communicationSkills: e.communicationSkills || 0,
                            ambition: e.ambition || 0,
                            selfConfidence: e.selfConfidence || 0,
                        },
                        strengths: e.strengths || '',
                        improvements: e.improvements || '',
                        comments: e.comments || '',
                        overallScore: e.overallScore || 0,
                    });
                }
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
            criteria: { ...prev.criteria, [key]: value },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const unrated = Object.entries(evaluation.criteria).find(([_, value]) => value === 0);
        if (unrated) {
            alert(`Please rate: ${unrated[0].replace(/([A-Z])/g, ' $1')}`);
            return;
        }
        if (evaluation.overallScore === 0) {
            alert('Please provide an overall score.');
            return;
        }
        try {
            await api.post('/hr/evaluate', { studentId, ...evaluation });
            alert('Evaluation submitted successfully.');
            navigate('/hr/dashboard');
        } catch {
            alert('Submission failed. Please try again.');
        }
    };

    const formattedTime = new Intl.DateTimeFormat('en-US', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(currentTime);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
            <Activity className="w-8 h-8 text-blue-600 animate-pulse" />
            <p className="text-[12px] text-slate-400 font-medium">Loading student data...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto pb-24 px-6"
            >
                {/* Header */}
                <header className="flex items-center justify-between py-7">
                    <button
                        onClick={() => navigate('/hr/dashboard')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
                    >
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-slate-300 transition-all shadow-sm">
                            <ChevronLeft size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[13px] font-medium">Back to Dashboard</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-[12px] text-slate-500">
                            <Clock size={14} className="text-slate-400" />
                            {formattedTime}
                        </div>
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[12px] font-medium">
                            <ShieldCheck size={14} /> Active Session
                        </div>
                    </div>
                </header>

                {/* Student Card */}
                <div className="bg-white border border-slate-200 rounded-2xl mb-6 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-stretch">
                        {/* Left accent bar */}
                        <div className="w-full sm:w-1 bg-blue-600 sm:rounded-l-2xl h-1 sm:h-auto" />

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 flex-1 px-6 py-5">
                            <div className="flex items-center gap-5">
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25 shrink-0">
                                    <User size={24} strokeWidth={2} />
                                </div>

                                {/* Info */}
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Candidate</p>
                                    <h1 className="text-[20px] font-bold text-slate-900 leading-none capitalize">{student?.name}</h1>
                                    <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                                        <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg border border-slate-200 tracking-wide font-mono">
                                            {student?.register_number || student?.registerNumber}
                                        </span>
                                        {student?.department && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-[12px] text-slate-500 font-medium">{student.department}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Aptitude Score</span>
                                            <span className="text-[14px] font-bold text-blue-600">{student?.aptitudeScore ?? 0}</span>
                                        </div>
                                        <div className="w-px h-5 bg-slate-200" />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">GD Score</span>
                                            <span className="text-[14px] font-bold text-amber-600">{student?.gdScore ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {student?.resume_url && (
                                <a
                                    href={student.resume_url.startsWith('http') ? student.resume_url : `${BASE_URL}${student.resume_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[12px] font-semibold hover:bg-black transition-all shadow-sm shrink-0"
                                >
                                    <FileText size={14} /> View Resume
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Assessment Ratings */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                <ClipboardCheck size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-semibold text-slate-900">Assessment Ratings</h2>
                                <p className="text-[12px] text-slate-400 mt-0.5">Rate each criterion from 1 to 10</p>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-50 px-6">
                            <RatingRow label="Appearance & Attitude"   value={evaluation.criteria.appearanceAttitude}   onChange={v => handleRating('appearanceAttitude', v)} />
                            <RatingRow label="Managerial Aptitude"     value={evaluation.criteria.managerialAptitude}   onChange={v => handleRating('managerialAptitude', v)} />
                            <RatingRow label="General Awareness"       value={evaluation.criteria.generalAwareness}     onChange={v => handleRating('generalAwareness', v)} />
                            <RatingRow label="Technical Knowledge"     value={evaluation.criteria.technicalKnowledge}   onChange={v => handleRating('technicalKnowledge', v)} />
                            <RatingRow label="Communication Skills"    value={evaluation.criteria.communicationSkills}  onChange={v => handleRating('communicationSkills', v)} />
                            <RatingRow label="Ambition"                value={evaluation.criteria.ambition}             onChange={v => handleRating('ambition', v)} />
                            <RatingRow label="Self-Confidence"         value={evaluation.criteria.selfConfidence}       onChange={v => handleRating('selfConfidence', v)} />
                        </div>
                    </div>

                    {/* Written Evaluation */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                                <Activity size={16} className="text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-semibold text-slate-900">Written Evaluation</h2>
                                <p className="text-[12px] text-slate-400 mt-0.5">Qualitative assessment of the candidate</p>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <FormTextarea
                                required
                                label="Strengths"
                                value={evaluation.strengths}
                                onChange={(e: any) => setEvaluation(prev => ({ ...prev, strengths: e.target.value }))}
                                placeholder="Describe the candidate's key strengths..."
                            />
                            <FormTextarea
                                required
                                label="Areas for Improvement"
                                value={evaluation.improvements}
                                onChange={(e: any) => setEvaluation(prev => ({ ...prev, improvements: e.target.value }))}
                                placeholder="Describe areas where the candidate can improve..."
                            />
                            <FormTextarea
                                required
                                label="Overall Comments"
                                value={evaluation.comments}
                                onChange={(e: any) => setEvaluation(prev => ({ ...prev, comments: e.target.value }))}
                                placeholder="General remarks and recommendation..."
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                                <Target size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Overall Score</p>
                                <div className="flex items-baseline gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="0.1"
                                        value={evaluation.overallScore || ''}
                                        onChange={e => setEvaluation(prev => ({ ...prev, overallScore: Math.min(10, parseFloat(e.target.value) || 0) }))}
                                        placeholder="0"
                                        className="w-20 bg-slate-50 border border-slate-200 rounded-xl py-2 text-2xl font-bold text-blue-600 text-center outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                    />
                                    <span className="text-slate-400 text-[15px] font-medium">/ 10</span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-semibold transition-all shadow-sm active:scale-95"
                        >
                            <Save size={16} />
                            {student?.evaluation ? 'Update Evaluation' : 'Submit Evaluation'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const RatingRow = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 gap-3">
        <span className="text-[13px] font-medium text-slate-700 lg:w-44 shrink-0">{label}</span>
        <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className={`w-9 h-9 rounded-lg text-[12px] font-semibold transition-all border ${
                        value === n
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                >
                    {n}
                </button>
            ))}
        </div>
    </div>
);

const FormTextarea = ({ label, required, value, onChange, placeholder }: any) => (
    <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <textarea
            required={required}
            value={value}
            onChange={onChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl h-28 p-4 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none resize-none transition-all leading-relaxed"
            placeholder={placeholder}
        />
    </div>
);

export default EvaluationPage;