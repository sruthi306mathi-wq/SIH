import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import { EvidenceItem } from '../../types';
import {
  FolderLock,
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Plus
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

export const EvidenceVaultView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillName, setSkillName] = useState('Python Programming');
  const [fileName, setFileName] = useState('Production_Architecture_Sample.pdf');
  const [fileType, setFileType] = useState('application/pdf');
  const [isUploading, setIsUploading] = useState(false);

  const fetchEvidence = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await apiRequest('/api/evidence/my');
      setEvidenceList(res.evidence || []);
    } catch (e) {
      console.error('Failed to load evidence:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvidence();
    }
  }, [user]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      await apiRequest('/api/evidence/upload', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          skillName,
          fileName,
          fileType,
          fileUrl: `https://learnx-storage.internal/vault/${encodeURIComponent(fileName)}`
        })
      });

      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      fetchEvidence();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'சான்றைச் சமர்ப்பிக்க முடியவில்லை.' : 'Failed to submit evidence.'));
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    if (language === 'ta') {
      if (status === 'verified') return 'சரிபார்க்கப்பட்டது';
      if (status === 'needs_more_evidence') return 'கூடுதல் சான்று தேவை';
      if (status === 'rejected') return 'மறுக்கப்பட்டது';
      return 'மதிப்பாய்வில் உள்ளது';
    }
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ebe0ce]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
            {language === 'ta' ? 'திறன் சான்றுகள் தொகுப்பு' : 'Portfolio of Competency'}
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
            {t('vault.title')}
          </h1>
          <p className="text-sm text-[#703616] mt-1">
            {t('vault.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0c263d] via-[#123859] to-[#8a431c] hover:opacity-95 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow cursor-pointer"
        >
          <Upload className="w-4 h-4 text-[#f0a876]" />
          <span>{t('vault.upload_btn')}</span>
        </button>
      </div>

      {/* Evidence Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-[#703616]">
          <div className="w-8 h-8 border-3 border-[#c4682e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">
            {language === 'ta' ? 'சான்றுகள் பெட்டகம் ஏற்றப்படுகிறது...' : 'Loading your evidence vault records...'}
          </p>
        </div>
      ) : evidenceList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evidenceList.map((item) => {
            const aiNotes = parseAiNotes(item.ai_analysis_notes);
            return (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-white border border-[#ebe0ce] hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#123859]/10 text-[#0c263d]">
                      {item.skill_name}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center space-x-1 ${
                      item.assessor_status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.assessor_status === 'needs_more_evidence'
                        ? 'bg-amber-100 text-amber-800'
                        : item.assessor_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.assessor_status === 'verified' && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                      {item.assessor_status === 'needs_more_evidence' && <Clock className="w-3 h-3 mr-0.5" />}
                      <span>{getStatusLabel(item.assessor_status)}</span>
                    </span>
                  </div>

                  <h3 className="font-heading text-base font-bold text-[#0c263d] mb-1">{item.title}</h3>
                  <p className="text-xs text-[#703616] mb-3 line-clamp-2">{item.description}</p>

                  {/* AI Quality Badge in Marine Brown */}
                  <div className="p-3 rounded-xl bg-[#f6efe3] border border-[#ebe0ce] mb-3">
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span className="text-[#8a431c] flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-[#c4682e]" />
                        <span>{t('vault.ai_score')}</span>
                      </span>
                      <span className="text-[#0c263d] font-black">{item.ai_quality_score}/100</span>
                    </div>
                    {aiNotes?.assessorRecommendation && (
                      <p className="text-[10px] text-[#703616] italic">
                        "{aiNotes.assessorRecommendation}"
                      </p>
                    )}
                  </div>

                  {item.assessor_notes && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 mb-3">
                      <span className="font-bold">{t('vault.assessor_notes')}: </span>
                      {item.assessor_notes}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#ebe0ce] flex items-center justify-between text-xs text-[#703616]">
                  <span className="font-mono text-[10px] text-[#8a431c]/70 truncate max-w-[150px]">
                    {item.file_name}
                  </span>
                  <span className="text-[10px]">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Database Empty State */
        <div className="p-12 rounded-2xl bg-white border border-[#ebe0ce] text-center max-w-lg mx-auto shadow-sm">
          <FolderLock className="w-12 h-12 text-[#ded0bb] mx-auto mb-3" />
          <h2 className="font-heading text-lg font-bold text-[#0c263d]">{t('vault.empty')}</h2>
          <p className="text-xs text-[#703616] mt-1.5 leading-relaxed">
            {language === 'ta'
              ? 'உங்கள் திட்டப் பணிகள், குறியீடு ஆவணங்கள் அல்லது சான்றிதழ்களைப் பதிவேற்றி அதிகாரப்பூர்வ சரிபார்ப்பைப் பெறுங்கள்.'
              : 'Upload work artifacts, architecture diagrams, codebase links, or client sign-offs to have your competency verified.'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#0c263d] text-white text-xs font-bold shadow hover:bg-[#123859] transition cursor-pointer"
          >
            {t('vault.upload_btn')}
          </button>
        </div>
      )}

      {/* UPLOAD EVIDENCE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-[#0c263d]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcfaf6] rounded-2xl border border-[#ebe0ce] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ebe0ce]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
                  {language === 'ta' ? 'சான்று சமர்ப்பிப்பு' : 'Evidence Submission'}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#0c263d]">
                  {language === 'ta' ? 'புதிய வேலை மாதிரியைச் சமர்ப்பிக்க' : 'Submit Work Sample'}
                </h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-[#8a431c] hover:text-[#0c263d] font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                  {language === 'ta' ? 'சான்றின் தலைப்பு *' : 'Evidence Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === 'ta' ? 'எ.கா: பைதான் பைப்லைன் கட்டமைப்பு மற்றும் சோதனைகள்' : 'e.g. Asynchronous Pipeline Architecture & Unit Tests'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                  {language === 'ta' ? 'தொடர்புடைய திறன் *' : 'Related Skill *'}
                </label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. Python Programming"
                  className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                  {language === 'ta' ? 'விளக்கம் & உங்கள் பங்களிப்பு *' : 'Description of Artifact & Your Role *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'ta' ? 'இந்த வேலை மாதிரி என்ன, நீங்கள் அதை எவ்வாறு உருவாக்கினீர்கள் என்பதை விளக்குங்கள்...' : 'Explain what the artifact is, the problem it solved, and how you personally designed it...'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                    {language === 'ta' ? 'கோப்பின் பெயர்' : 'File Name'}
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                    {language === 'ta' ? 'கோப்பு வடிவம்' : 'Format / Type'}
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d]"
                  >
                    <option value="application/pdf">PDF Document</option>
                    <option value="text/x-python">Code Repository / Script</option>
                    <option value="image/png">System Diagram (PNG/JPG)</option>
                    <option value="application/zip">Project Archive (ZIP)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#ded0bb] text-xs font-bold text-[#703616] hover:bg-[#f6efe3] cursor-pointer"
                >
                  {t('action.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0c263d] to-[#8a431c] hover:opacity-95 text-white text-xs font-bold shadow disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (language === 'ta' ? 'AI பகுப்பாய்வு செய்கிறது...' : 'Analyzing with AI...') : (language === 'ta' ? 'பெட்டகத்தில் சமர்ப்பி' : 'Submit to Vault')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

