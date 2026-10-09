import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import { Assessment } from '../../types';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Award
} from 'lucide-react';

export const AssessmentView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active taking session
  const [activeAssessment, setActiveAssessment] = useState<any | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/api/assessments');
      setAssessments(res.assessments || []);
    } catch (e) {
      console.error('Failed to load assessments:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [user]);

  const handleStartAssessment = async (id: string) => {
    try {
      setSubmissionResult(null);
      setSelectedAnswers({});
      const res = await apiRequest(`/api/assessments/${id}`);
      setActiveAssessment(res.assessment);
    } catch (e: any) {
      alert(e.message || (language === 'ta' ? 'தேர்வைத் தொடங்க முடியவில்லை.' : 'Failed to start assessment.'));
    }
  };

  const handleSubmitAnswers = async () => {
    if (!activeAssessment) return;

    try {
      setIsSubmitting(true);
      const res = await apiRequest(`/api/assessments/${activeAssessment.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: selectedAnswers })
      });
      setSubmissionResult(res);
      fetchAssessments();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'விடைகளைச் சமர்ப்பிக்க முடியவில்லை.' : 'Failed to submit answers.'));
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
            {language === 'ta' ? 'திறன் சரிபார்ப்பு & மதிப்பீடு' : 'Competency Verification'}
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
            {language === 'ta' ? 'நடைமுறைத் தேர்வுகள் & மறுமதிப்பீடு' : 'Practical Assessments & Reassessment'}
          </h1>
          <p className="text-sm text-[#703616] mt-1">
            {language === 'ta'
              ? 'தொழில்துறை தரநிலைகளுக்கு எதிராக உங்கள் சிக்கல் தீர்க்கும் திறனை சோதிக்கவும். தேர்ச்சி பெற்றால் தானியங்கி SkillProof சான்றிதழ் வழங்கப்படும்.'
              : 'Benchmark your problem-solving capabilities against industry standards. Passing awards automated SkillProof credentials.'}
          </p>
        </div>
      </div>

      {/* ACTIVE ASSESSMENT TAKER */}
      {activeAssessment ? (
        <div className="p-6 lg:p-8 rounded-2xl bg-white border border-[#ebe0ce] shadow-md space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-[#ebe0ce]">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#f6efe3] text-[#8a431c]">
                {activeAssessment.skill_name} &bull; {activeAssessment.type.toUpperCase()}
              </span>
              <h2 className="font-heading text-2xl font-bold text-[#0c263d] mt-1">
                {activeAssessment.title}
              </h2>
              <p className="text-xs text-[#703616]">
                {language === 'ta' ? 'தேர்ச்சி வரம்பு' : 'Passing threshold'}: {activeAssessment.passing_score}% &bull; {activeAssessment.totalQuestions} {language === 'ta' ? 'கேள்விகள்' : 'Questions'}
              </p>
            </div>
            <button
              onClick={() => setActiveAssessment(null)}
              className="text-xs font-bold text-[#8a431c] hover:underline"
            >
              {language === 'ta' ? 'தேர்விலிருந்து வெளியேறு' : 'Exit Assessment'}
            </button>
          </div>

          {/* If Results received */}
          {submissionResult ? (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border ${
                submissionResult.passed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  {submissionResult.passed ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-amber-600" />
                  )}
                  <div>
                    <h3 className="font-heading text-xl font-bold">
                      {submissionResult.passed
                        ? (language === 'ta' ? 'தேர்வில் வெற்றிகரமாகத் தேர்ச்சி பெற்றீர்கள்!' : 'Assessment Passed with Competency!')
                        : (language === 'ta' ? 'தேர்ச்சி மதிப்பெண்ணை எட்டவில்லை' : 'Score Below Passing Threshold')}
                    </h3>
                    <p className="text-xs">
                      {language === 'ta' ? 'மதிப்பெண்' : 'Score'}: <span className="font-black text-sm">{submissionResult.score}%</span> &bull; {language === 'ta' ? 'சரியானவை' : 'Correct'}: {submissionResult.correctCount} / {submissionResult.totalQuestions}
                    </p>
                  </div>
                </div>

                <p className="text-xs mt-3 bg-white/70 p-3 rounded-xl border border-current/20 leading-relaxed">
                  <span className="font-bold">{language === 'ta' ? 'AI மதிப்பீட்டாளர் பின்னூட்டம்' : 'Proctor Feedback'}: </span>
                  {submissionResult.aiFeedback}
                </p>

                {submissionResult.passed && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{language === 'ta' ? 'AI சரிபார்க்கப்பட்ட SkillProof பேட்ஜ் உங்கள் சுயவிவரத்தில் சேர்க்கப்பட்டது!' : 'AI Assessed SkillProof Badge has been minted and added to your profile!'}</span>
                  </div>
                )}
              </div>

              {/* Question Feedback Breakdown */}
              <div className="space-y-4">
                <h4 className="font-heading text-base font-bold text-[#0c263d]">
                  {language === 'ta' ? 'விரிவான கேள்வி பகுப்பாய்வு' : 'Detailed Question Breakdown'}
                </h4>
                {submissionResult.feedbackBreakdown?.map((fb: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#ebe0ce] bg-[#fcfaf6] space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold text-[#0c263d]">
                        Q{idx + 1}. {fb.question}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        fb.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {fb.isCorrect ? (language === 'ta' ? 'சரி' : 'Correct') : (language === 'ta' ? 'தவறு' : 'Incorrect')}
                      </span>
                    </div>
                    {fb.explanation && (
                      <p className="text-[11px] text-[#703616] bg-white p-2.5 rounded-lg border border-[#ebe0ce]">
                        <span className="font-bold text-[#8a431c]">{language === 'ta' ? 'விளக்கம்' : 'Explanation'}: </span>
                        {fb.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#ebe0ce]">
                <button
                  onClick={() => {
                    setSubmissionResult(null);
                    setSelectedAnswers({});
                  }}
                  className="px-4 py-2 rounded-xl border border-[#0c263d] text-xs font-bold text-[#0c263d] flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'மீண்டும் முயற்சிக்க (மறுமதிப்பீடு)' : 'Reattempt (Reassessment)'}</span>
                </button>
                <button
                  onClick={() => setActiveAssessment(null)}
                  className="px-4 py-2 rounded-xl bg-[#0c263d] text-white text-xs font-bold"
                >
                  {language === 'ta' ? 'பட்டியலுக்குத் திரும்பு' : 'Return to Catalog'}
                </button>
              </div>
            </div>
          ) : (
            /* Questions Form */
            <div className="space-y-6">
              {activeAssessment.questions?.map((q: any, qIdx: number) => (
                <div key={q.id} className="p-5 rounded-xl bg-[#fcfaf6] border border-[#ebe0ce] space-y-3">
                  <p className="text-xs font-bold text-[#0c263d]">
                    <span className="text-[#8a431c]">{language === 'ta' ? 'கேள்வி' : 'Question'} {qIdx + 1}: </span>
                    {q.question}
                  </p>

                  <div className="space-y-2">
                    {q.options?.map((opt: string, optIdx: number) => (
                      <label
                        key={optIdx}
                        className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer text-xs transition ${
                          selectedAnswers[q.id] === optIdx
                            ? 'bg-[#f6efe3] border-[#8a431c] text-[#0c263d] font-semibold'
                            : 'bg-white border-[#ebe0ce] text-[#703616] hover:bg-[#fcfaf6]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          checked={selectedAnswers[q.id] === optIdx}
                          onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: optIdx })}
                          className="mt-0.5 text-[#8a431c]"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4 border-t border-[#ebe0ce]">
                <button
                  onClick={handleSubmitAnswers}
                  disabled={isSubmitting || Object.keys(selectedAnswers).length < (activeAssessment.questions?.length || 0)}
                  className="px-6 py-3 rounded-xl bg-[#0c263d] hover:bg-[#123859] text-white text-xs font-bold shadow flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>{language === 'ta' ? 'LearnX மதிப்பீட்டாளர் சரிபார்க்கிறார்...' : 'Evaluating with LearnX Proctor...'}</span>
                  ) : (
                    <>
                      <span>{language === 'ta' ? 'மதிப்பீட்டிற்குச் சமர்ப்பி' : 'Submit Answers for Evaluation'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ASSESSMENTS CATALOG GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((a) => (
            <div
              key={a.id}
              className="p-6 rounded-2xl bg-white border border-[#ebe0ce] hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#f6efe3] text-[#8a431c]">
                    {a.skill_name}
                  </span>
                  {a.isCompleted && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{language === 'ta' ? 'தேர்ச்சி பெற்றது' : 'Passed'}</span>
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-lg font-bold text-[#0c263d] mb-2">{a.title}</h3>

                <div className="text-xs text-[#703616] space-y-1 mb-4">
                  <p>{language === 'ta' ? 'வகை' : 'Type'}: <span className="font-semibold text-[#0c263d] capitalize">{a.type}</span></p>
                  <p>{language === 'ta' ? 'தேர்ச்சி வரம்பு' : 'Passing Threshold'}: <span className="font-semibold text-[#0c263d]">{a.passing_score}%</span></p>
                  {a.bestScore !== null && a.bestScore !== undefined && (
                    <p className="text-[#8a431c] font-bold">
                      {language === 'ta' ? 'சிறந்த மதிப்பெண்' : 'Best Score'}: {a.bestScore}% ({a.totalAttempts} {language === 'ta' ? 'முயற்சிகள்' : 'attempts'})
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#ebe0ce] flex items-center justify-between">
                <span className="text-[11px] text-[#703616]">
                  {language === 'ta' ? 'உடனடி AI மதிப்பீடு' : 'Instant AI Scoring'}
                </span>
                <button
                  onClick={() => handleStartAssessment(a.id)}
                  className="px-4 py-2 rounded-xl bg-[#0c263d] hover:bg-[#123859] text-white text-xs font-bold transition flex items-center space-x-1 shadow"
                >
                  <span>
                    {a.totalAttempts && a.totalAttempts > 0
                      ? (language === 'ta' ? 'மறுமதிப்பீடு' : 'Reassess')
                      : (language === 'ta' ? 'தேர்வைத் தொடங்கு' : 'Start Assessment')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
