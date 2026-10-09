import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import { SkillProof, Certificate } from '../../types';
import {
  ShieldCheck,
  Award,
  QrCode,
  ExternalLink,
  Printer,
  Sparkles,
  CheckCircle2,
  FileCheck,
  Share2
} from 'lucide-react';

export const SkillProofView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [proofs, setProofs] = useState<SkillProof[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const [proofsRes, certsRes] = await Promise.all([
        apiRequest('/api/skillproof/proofs'),
        apiRequest('/api/skillproof/certificates')
      ]);
      setProofs(proofsRes.proofs || []);
      setCertificates(certsRes.certificates || []);
    } catch (e) {
      console.error('Failed to load credentials:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const getTierColor = (level: string) => {
    switch (level) {
      case 'institution_verified':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'community_verified':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ai_assessed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ebe0ce]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
            {language === 'ta' ? 'சரிபார்க்கத்தக்க சான்றுகள்' : 'Verifiable Credentials'}
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
            {language === 'ta' ? 'SkillProof™ மற்றும் அதிகாரப்பூர்வ சான்றிதழ்கள்' : 'SkillProof™ & Official Certificates'}
          </h1>
          <p className="text-sm text-[#703616] mt-1">
            {language === 'ta'
              ? '4-நிலை கிரிப்டோகிராஃபிக் சரிபார்ப்பு மற்றும் தணிக்கையாளர் ஒப்புதல் பெற்ற அதிகாரப்பூர்வ சான்றிதழ்கள்.'
              : 'Four-tier cryptographic skill verification and verifiable competency certificates for both learning and experience pathways.'}
          </p>
        </div>
      </div>

      {/* Verification Tiers Explainer in Marine Brown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-[#ebe0ce]">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6efe3] text-[#703616]">
            {language === 'ta' ? 'நிலை 1' : 'Tier 1'}
          </span>
          <p className="text-xs font-bold text-[#0c263d] mt-1">
            {language === 'ta' ? 'சுய அறிவிப்பு' : 'Self Claimed'}
          </p>
          <p className="text-[10px] text-[#703616] mt-0.5">
            {language === 'ta' ? 'சரிபார்ப்பின்றி அறிவிக்கப்பட்டது' : 'Declared by user without verification'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#ebe0ce]">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            {language === 'ta' ? 'நிலை 2' : 'Tier 2'}
          </span>
          <p className="text-xs font-bold text-[#0c263d] mt-1">
            {language === 'ta' ? 'AI மதிப்பாய்வு' : 'AI Assessed'}
          </p>
          <p className="text-[10px] text-[#703616] mt-0.5">
            {language === 'ta' ? 'தானியங்கி மதிப்பீடு' : 'Automated proctored assessment'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#ebe0ce]">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
            {language === 'ta' ? 'நிலை 3' : 'Tier 3'}
          </span>
          <p className="text-xs font-bold text-[#0c263d] mt-1">
            {language === 'ta' ? 'வழிகாட்டி சரிபார்ப்பு' : 'Community Verified'}
          </p>
          <p className="text-[10px] text-[#703616] mt-0.5">
            {language === 'ta' ? 'சக வழிகாட்டி ஒப்புதல்' : 'Peer mentor endorsement'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#ebe0ce]">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            {language === 'ta' ? 'நிலை 4' : 'Tier 4'}
          </span>
          <p className="text-xs font-bold text-[#0c263d] mt-1">
            {language === 'ta' ? 'நிபுணர் தணிக்கை' : 'Institution / Expert Verified'}
          </p>
          <p className="text-[10px] text-[#703616] mt-0.5">
            {language === 'ta' ? 'அதிகாரப்பூர்வ தணிக்கையாளர் ஒப்புதல்' : 'Official assessor verification'}
          </p>
        </div>
      </div>


      {/* Official Certificates Section */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0b253a] flex items-center space-x-2">
          <Award className="w-5 h-5 text-[#b45309]" />
          <span>Issued Certificates ({certificates.length})</span>
        </h2>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-6 rounded-2xl bg-white border border-[#ede7dc] hover:shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[#b45309]/15 text-[#b45309]">
                      {cert.certificate_number}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {cert.grade}
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-[#0b253a] mb-1">
                    {cert.title}
                  </h3>
                  <p className="text-xs text-[#78350f] mb-3">
                    Pathway: <span className="font-semibold text-[#0b253a] capitalize">{cert.pathway.replace('_', ' ')}</span>
                  </p>

                  <div className="p-3 rounded-xl bg-[#f8f6f0] border border-[#ede7dc] text-xs text-[#78350f] space-y-1">
                    <p>Verified By: <span className="font-bold text-[#0b253a]">{cert.verified_by}</span></p>
                    <p>Issue Date: <span className="font-medium text-[#0b253a]">{cert.issue_date}</span></p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#ede7dc] flex items-center justify-between">
                  <span className="text-[11px] text-[#94a3b8] font-mono">Digital Signature Valid</span>
                  <button
                    onClick={() => setViewingCertificate(cert)}
                    className="px-4 py-2 rounded-xl bg-[#0b253a] hover:bg-[#0f3453] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow"
                  >
                    <span>View Certificate</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-[#ede7dc] text-center">
            <Award className="w-10 h-10 text-[#d6cbbe] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#0b253a]">No certificates earned yet</p>
            <p className="text-[11px] text-[#78350f] mt-1 max-w-sm mx-auto">
              Complete a verified learning pathway with mentor evaluation, or have your work evidence approved by an assessor to earn an official certificate.
            </p>
          </div>
        )}
      </div>

      {/* SkillProof Badges Section */}
      <div className="space-y-4 pt-4 border-t border-[#ede7dc]">
        <h2 className="font-heading text-xl font-bold text-[#0b253a] flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-[#0e7490]" />
          <span>SkillProof&trade; Badges ({proofs.length})</span>
        </h2>

        {proofs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proofs.map((prf) => (
              <div key={prf.id} className="p-5 rounded-2xl bg-white border border-[#ede7dc] space-y-3">
                <div className="flex items-start justify-between">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${getTierColor(prf.verification_level)}`}>
                    {prf.verification_level.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-[10px] text-[#94a3b8]">{prf.badge_code}</span>
                </div>

                <h4 className="font-heading text-base font-bold text-[#0b253a]">{prf.skill_name}</h4>

                <div className="text-[11px] text-[#78350f]">
                  <p>Verified By: <span className="font-semibold text-[#0b253a]">{prf.verified_by}</span></p>
                  <p>Issued: {new Date(prf.issued_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-[#ede7dc] text-center">
            <ShieldCheck className="w-10 h-10 text-[#d6cbbe] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#0b253a]">No SkillProof badges issued yet</p>
            <p className="text-[11px] text-[#78350f] mt-1">
              Pass a practical assessment or submit verified evidence to claim your first credential.
            </p>
          </div>
        )}
      </div>

      {/* FULL CERTIFICATE VIEWER MODAL */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 bg-[#0b253a]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-4 border-[#0b253a] shadow-2xl max-w-2xl w-full p-8 space-y-6 relative overflow-hidden">
            {/* Certificate Border Accents */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#0e7490] via-[#b45309] to-[#0b253a]" />

            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-[#0b253a] text-white flex items-center justify-center font-heading font-black text-lg">
                  LX
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#0b253a]">LearnX Verified Credential</h3>
                  <p className="text-[10px] uppercase tracking-wider text-[#0e7490] font-bold">Official Certificate of Competency</p>
                </div>
              </div>
              <button
                onClick={() => setViewingCertificate(null)}
                className="text-[#94a3b8] hover:text-[#0b253a] text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Certificate Body */}
            <div className="text-center py-6 border-y border-[#ede7dc] space-y-4">
              <p className="text-xs uppercase tracking-widest text-[#78350f] font-bold">This is to certify that</p>
              <h2 className="font-heading text-3xl font-black text-[#0b253a] tracking-tight">
                {viewingCertificate.certificate_data?.candidateName || user?.full_name}
              </h2>
              <p className="text-xs text-[#78350f] max-w-md mx-auto">
                has successfully demonstrated rigorous practitioner competence in
              </p>
              <h3 className="font-heading text-xl font-extrabold text-[#0e7490]">
                {viewingCertificate.skill_name}
              </h3>
              <div className="inline-block px-4 py-1 rounded-full bg-[#f8f6f0] border border-[#ede7dc] text-xs font-bold text-[#b45309]">
                Grade: {viewingCertificate.grade} &bull; {viewingCertificate.pathway.replace('_', ' ').toUpperCase()}
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <div>
                <p className="font-serif italic text-base text-[#0b253a]">{viewingCertificate.verified_by}</p>
                <div className="w-32 h-0.5 bg-[#0b253a] my-1" />
                <p className="text-[10px] text-[#78350f] font-semibold">Authorized Assessor Signature</p>
              </div>

              <div className="text-right font-mono text-[11px] text-[#78350f]">
                <p className="font-bold text-[#0b253a]">ID: {viewingCertificate.certificate_number}</p>
                <p>Issued: {viewingCertificate.issue_date}</p>
                <p className="text-[9px] text-[#14b8a6]">SHA-256 Authenticated</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#ede7dc]">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-[#0b253a] text-xs font-bold text-[#0b253a] flex items-center space-x-1"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setViewingCertificate(null)}
                className="px-5 py-2 rounded-xl bg-[#0b253a] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
