import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import { EvidenceItem } from '../../types';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  ShieldCheck,
  Send
} from 'lucide-react';

const parseAiNotes = (notes: any): { assessorRecommendation?: string; analysisNotes?: string; [key: string]: any } | null => {
  if (!notes) return null;
  if (typeof notes === 'object') return notes;
  try {
    const parsed = JSON.parse(notes);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
    return { assessorRecommendation: String(parsed) };
  } catch {
    return { assessorRecommendation: String(notes) };
  }
};

export const AssessorPortalView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [queue, setQueue] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'verified' | 'needs_more_evidence' | 'rejected'>('verified');
  const [assessorNotes, setAssessorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await apiRequest('/api/evidence/assessor/queue');
      setQueue(res.queue || []);
    } catch (e) {
      console.error('Failed to load assessor queue:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchQueue();
    }
  }, [user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setIsSubmitting(true);
      await apiRequest(`/api/evidence/assessor/review/${selectedItem.id}`, {
        method: 'POST',
        body: JSON.stringify({
          status: reviewStatus,
          notes: assessorNotes
        })
      });

      setSelectedItem(null);
      setAssessorNotes('');
      fetchQueue();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'மதிப்பாய்வைச் சமர்ப்பிக்க முடியவில்லை.' : 'Failed to submit review.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Header */}
      <div className="pb-6 border-b border-[#ebe0ce]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
          {language === 'ta' ? 'அதிகாரப்பூர்வ சரிபார்ப்பு அமைப்பு' : 'Official Verification Body'}
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
          {language === 'ta' ? 'மதிப்பீட்டாளர் சரிபார்ப்பு போர்டல்' : 'Assessor Verification Portal'}
        </h1>
        <p className="text-sm text-[#703616] mt-1">
          {language === 'ta'
            ? 'விண்ணப்பதாரர் சான்றுகளை மதிப்பாய்வு செய்து, AI தர மதிப்பெண்களைத் தணிக்கை செய்து, சரிபார்க்கப்பட்ட SkillProof மற்றும் அதிகாரப்பூர்வ சான்றிதழ்களை வழங்கவும்.'
            : 'Review candidate portfolios, audit AI evidence quality scores, and issue verified SkillProof & official Certificates.'}
        </p>
      </div>

      {/* Queue Table */}
      <div className="p-6 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0c263d] flex items-center space-x-2">
          <UserCheck className="w-5 h-5 text-[#8a431c]" />
          <span>
            {language === 'ta' ? 'சான்றுகள் தணிக்கை வரிசை' : 'Candidate Evidence Audit Queue'} ({queue.length})
          </span>
        </h2>

        {queue.length > 0 ? (
          <div className="divide-y divide-[#ebe0ce]">
            {queue.map((item) => {
              const aiNotes = parseAiNotes(item.ai_analysis_notes);
              return (
                <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-sm text-[#0c263d]">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6efe3] text-[#8a431c]">
                        {item.skill_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.assessor_status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.assessor_status === 'needs_more_evidence'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.assessor_status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-[#703616]">
                      {language === 'ta' ? 'விண்ணப்பதாரர்: ' : 'Candidate: '}
                      <span className="font-bold text-[#0c263d]">{item.candidate_name}</span> ({item.candidate_email}) &bull; {language === 'ta' ? 'சமர்ப்பிக்கப்பட்டது: ' : 'Submitted: '}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>

                    <p className="text-xs text-[#0c263d]/80 line-clamp-1">{item.description}</p>

                    {aiNotes && (
                      <p className="text-[11px] text-[#8a431c] flex items-center space-x-1 pt-1 font-semibold">
                        <Sparkles className="w-3 h-3" />
                        <span>
                          AI {language === 'ta' ? 'தரம்' : 'Quality'}: {item.ai_quality_score}/100 &bull; {language === 'ta' ? 'பரிந்துரை' : 'Recommendation'}: {aiNotes.assessorRecommendation}
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setAssessorNotes(item.assessor_notes || '');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0c263d] hover:bg-[#123859] text-white text-xs font-bold transition flex items-center space-x-1.5 flex-shrink-0 shadow"
                  >
                    <span>{language === 'ta' ? 'தணிக்கை செய்து சரிபார்' : 'Audit & Verify'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-[#703616]">
            <CheckCircle2 className="w-8 h-8 text-[#ded0bb] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#0c263d]">
              {language === 'ta' ? 'தணிக்கை வரிசையில் நிலுவையில் உள்ள சான்றுகள் எதுவும் இல்லை' : 'No pending evidence items in the audit queue'}
            </p>
          </div>
        )}
      </div>

      {/* AUDIT MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#0c263d]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ebe0ce] shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#ebe0ce]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
                  {language === 'ta' ? 'மதிப்பீட்டாளர் ஆய்வு' : 'Assessor Review'}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#0c263d]">
                  {language === 'ta' ? 'தணிக்கை: ' : 'Audit: '}{selectedItem.title}
                </h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-[#8a431c] hover:text-[#0c263d] font-bold">&times;</button>
            </div>

            <div className="p-4 rounded-xl bg-[#fcfaf6] border border-[#ebe0ce] text-xs space-y-2">
              <p><span className="font-bold text-[#0c263d]">{language === 'ta' ? 'விண்ணப்பதாரர்:' : 'Candidate:'}</span> {selectedItem.candidate_name}</p>
              <p><span className="font-bold text-[#0c263d]">{language === 'ta' ? 'திறன் அறிவிப்பு:' : 'Skill Claim:'}</span> {selectedItem.skill_name}</p>
              <p><span className="font-bold text-[#0c263d]">{language === 'ta' ? 'சான்று விளக்கம்:' : 'Artifact Description:'}</span> {selectedItem.description}</p>
              <p><span className="font-bold text-[#0c263d]">{language === 'ta' ? 'கோப்பு:' : 'File:'}</span> {selectedItem.file_name} ({selectedItem.file_type})</p>
              <p><span className="font-bold text-[#8a431c]">{language === 'ta' ? 'AI தர மதிப்பீடு:' : 'AI Score:'}</span> {selectedItem.ai_quality_score}/100</p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'சரிபார்ப்பு முடிவு *' : 'Verification Decision *'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('verified')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      reviewStatus === 'verified'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white border-[#ebe0ce] text-emerald-800'
                    }`}
                  >
                    {language === 'ta' ? 'ஒப்புதல் (சரிபார்க்கப்பட்டது)' : 'Approve (Verified)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('needs_more_evidence')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      reviewStatus === 'needs_more_evidence'
                        ? 'bg-[#8a431c] text-white border-[#8a431c]'
                        : 'bg-white border-[#ebe0ce] text-[#8a431c]'
                    }`}
                  >
                    {language === 'ta' ? 'கூடுதல் சான்று கோரு' : 'Request More Proof'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('rejected')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      reviewStatus === 'rejected'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white border-[#ebe0ce] text-red-800'
                    }`}
                  >
                    {language === 'ta' ? 'நிராகரி' : 'Reject Claim'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'மதிப்பீட்டாளர் குறிப்புகள் & பின்னூட்டம் *' : 'Assessor Evaluation Notes & Rubric Feedback *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={assessorNotes}
                  onChange={(e) => setAssessorNotes(e.target.value)}
                  placeholder={language === 'ta' ? 'ஒப்புதலுக்கான நியாயம் அல்லது தேவையான ஆவணங்களைக் குறிப்பிடவும்...' : 'State the justification, rubric findings, or requested supplementary documents...'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                />
              </div>

              {reviewStatus === 'verified' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                  {language === 'ta'
                    ? 'இந்த சான்றுக்கு ஒப்புதல் அளிப்பது விண்ணப்பதாரருக்கு உடனடியாக நிறுவனம் சரிபார்த்த SkillProof பேட்ஜ் மற்றும் உங்கள் பெயரில் கையொப்பமிடப்பட்ட அதிகாரப்பூர்வ திறன் சான்றிதழை வழங்கும்.'
                    : 'Approving this evidence will immediately award the candidate an Institution Verified SkillProof Badge and issue an official Certificate of Competency signed in your name.'}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl border border-[#ebe0ce] text-xs font-bold text-[#703616]"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0c263d] hover:bg-[#123859] text-white text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting
                    ? (language === 'ta' ? 'பதிவு செய்கிறது...' : 'Recording Audit...')
                    : (language === 'ta' ? 'முடிவைச் சேமிக்க' : 'Save Decision')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
