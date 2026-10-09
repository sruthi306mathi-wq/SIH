import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import {
  Award,
  Sparkles,
  FileCheck,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';

interface RecognitionViewProps {
  setActiveTab: (tab: string) => void;
}

export const RecognitionView: React.FC<RecognitionViewProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [summary, setSummary] = useState<any>({ experiences: [], competencies: [], qualificationMappings: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [showDeclareForm, setShowDeclareForm] = useState(false);

  // Form state
  const [profession, setProfession] = useState('');
  const [company, setCompany] = useState('');
  const [yearsExp, setYearsExp] = useState(4);
  const [responsibilities, setResponsibilities] = useState('');
  const [toolsUsed, setToolsUsed] = useState('');
  const [tasksPerformed, setTasksPerformed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/api/recognition/summary');
      setSummary(res);
    } catch (e) {
      console.error('Failed to load recognition summary:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [user]);

  const handleDeclareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await apiRequest('/api/recognition/declare-experience', {
        method: 'POST',
        body: JSON.stringify({
          profession,
          company,
          yearsExp,
          responsibilities,
          toolsUsed,
          tasksPerformed
        })
      });

      setAiAnalysisResult(res.aiAnalysis);
      setShowDeclareForm(false);
      // Reset form
      setProfession('');
      setCompany('');
      setResponsibilities('');
      setToolsUsed('');
      setTasksPerformed('');
      fetchSummary();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'அனுபவத்தை சமர்ப்பிக்க முடியவில்லை.' : 'Failed to submit experience.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ebe0ce]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
            {language === 'ta' ? 'பாதை B • முந்தைய கற்றல் அங்கீகாரம்' : 'Pathway B • Recognition of Prior Learning'}
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
            {t('recog.title')}
          </h1>
          <p className="text-sm text-[#703616] mt-1">
            {t('recog.subtitle')}
          </p>
        </div>

        <button
          onClick={() => { setShowDeclareForm(true); setAiAnalysisResult(null); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0c263d] via-[#123859] to-[#8a431c] hover:opacity-95 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow cursor-pointer"
        >
          <Briefcase className="w-4 h-4 text-[#f0a876]" />
          <span>{t('recog.declare_btn')}</span>
        </button>
      </div>


      {/* AI Recognition Success Card (if just submitted) */}
      {aiAnalysisResult && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0f3453] to-[#0b253a] text-white shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-[#5eead4]">
            <Sparkles className="w-5 h-5 text-[#14b8a6]" />
            <span className="text-xs font-bold uppercase tracking-wider">AI Skill Recognition Complete</span>
          </div>

          <h2 className="font-heading text-xl font-bold">{aiAnalysisResult.summary}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#0b253a] border border-[#15446b]">
              <p className="text-xs font-bold text-[#14b8a6] uppercase mb-2">Identified Core Skills</p>
              <div className="space-y-1.5">
                {aiAnalysisResult.identifiedSkills?.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{s.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#15446b] text-[#5eead4] font-mono">
                      {s.level} ({s.confidence}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b253a] border border-[#15446b]">
              <p className="text-xs font-bold text-[#f59e0b] uppercase mb-2">Recommended Evidence to Upload</p>
              <ul className="text-xs text-[#cbd5e1] space-y-1 list-disc list-inside">
                {aiAnalysisResult.recommendedEvidence?.map((ev: string, idx: number) => (
                  <li key={idx}>{ev}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setActiveTab('evidence')}
              className="px-4 py-2 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-[#0b253a] text-xs font-bold flex items-center space-x-1 shadow"
            >
              <span>Proceed to Upload Evidence</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Qualification Mappings Grid */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0b253a] flex items-center space-x-2">
          <Award className="w-5 h-5 text-[#b45309]" />
          <span>Industry Qualification Mappings</span>
        </h2>

        {summary.qualificationMappings && summary.qualificationMappings.length > 0 ? (
          <div className="space-y-6">
            {summary.qualificationMappings.map((qm: any) => (
              <div key={qm.id} className="p-6 rounded-2xl bg-white border border-[#ede7dc] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ede7dc]">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b45309]/15 text-[#b45309]">
                      {qm.qualification_code} &bull; {qm.industry}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-[#0b253a] mt-1">
                      {qm.qualification_title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <span className="text-xs font-bold text-[#78350f]">Competency Match:</span>
                    <span className="px-3 py-1 rounded-xl text-sm font-black bg-[#14b8a6]/20 text-[#0f766e] border border-[#14b8a6]/30">
                      {qm.match_percentage}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#78350f] leading-relaxed">
                  <span className="font-bold text-[#0b253a]">Assessor Rationale: </span>
                  {qm.ai_reasoning}
                </p>

                {/* 3 Categories: Matched, Partial, Missing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Matched */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-900 uppercase flex items-center space-x-1 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Demonstrated ({qm.matched_competencies.length})</span>
                    </p>
                    <ul className="text-[11px] text-emerald-800 space-y-1">
                      {qm.matched_competencies.map((c: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Partial */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <p className="text-xs font-bold text-amber-900 uppercase flex items-center space-x-1 mb-2">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Partial / Needs Evidence ({qm.partial_competencies.length})</span>
                    </p>
                    <ul className="text-[11px] text-amber-800 space-y-1">
                      {qm.partial_competencies.map((c: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-1 flex-shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold text-slate-800 uppercase flex items-center space-x-1 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
                      <span>Missing / Gap ({qm.missing_competencies.length})</span>
                    </p>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      {qm.missing_competencies.map((c: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 mr-1 flex-shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    onClick={() => setActiveTab('evidence')}
                    className="px-4 py-2 rounded-xl bg-[#0b253a] hover:bg-[#0f3453] text-white text-xs font-bold flex items-center space-x-1 shadow"
                  >
                    <span>Upload Proof for Assessment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-[#ede7dc] text-center">
            <Award className="w-10 h-10 text-[#d6cbbe] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#0b253a]">No prior experience declarations in database yet</p>
            <p className="text-[11px] text-[#78350f] mt-1 max-w-md mx-auto">
              If you have worked in industry, declare your experience above. LearnX AI will map your capabilities to qualification standards without requiring beginner coursework.
            </p>
          </div>
        )}
      </div>

      {/* DECLARE EXPERIENCE MODAL */}
      {showDeclareForm && (
        <div className="fixed inset-0 z-50 bg-[#0b253a]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ede7dc] shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#ede7dc]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#b45309]">RPL Declaration</span>
                <h3 className="font-heading text-xl font-bold text-[#0b253a]">Declare Work Experience</h3>
              </div>
              <button onClick={() => setShowDeclareForm(false)} className="text-[#94a3b8] hover:text-[#0b253a] font-bold">&times;</button>
            </div>

            <form onSubmit={handleDeclareSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1">
                    Profession / Job Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. TechCorp / Freelance"
                    className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1">
                  Years of Practical Experience *
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={yearsExp}
                  onChange={(e) => setYearsExp(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1">
                  Core Responsibilities &amp; Deliverables *
                </label>
                <textarea
                  rows={2}
                  required
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  placeholder="e.g. Architected microservices, managed database schemas, conducted code reviews..."
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1">
                  Tools, Frameworks &amp; Technologies Used *
                </label>
                <input
                  type="text"
                  required
                  value={toolsUsed}
                  onChange={(e) => setToolsUsed(e.target.value)}
                  placeholder="e.g. Python, FastAPI, PostgreSQL, Docker, Git, Redis"
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1">
                  Practical Tasks &amp; Problems Solved *
                </label>
                <textarea
                  rows={3}
                  required
                  value={tasksPerformed}
                  onChange={(e) => setTasksPerformed(e.target.value)}
                  placeholder="e.g. Migrated monolith database with zero downtime, built automated ingestion pipelines..."
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeclareForm(false)}
                  className="px-4 py-2 rounded-xl border border-[#d6cbbe] text-xs font-bold text-[#78350f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Analyzing Experience...' : 'Submit & Analyze with AI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
