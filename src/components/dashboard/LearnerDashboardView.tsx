import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Compass,
  Award,
  Clock,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  CheckCircle,
  FileText,
  UserCheck,
  Star,
  Send
} from 'lucide-react';
import { apiRequest } from '../../api/client';

interface LearnerDashboardViewProps {
  data: any;
  setActiveTab: (tab: string) => void;
  onOpenAssistant: () => void;
  onRefresh: () => void;
}

export const LearnerDashboardView: React.FC<LearnerDashboardViewProps> = ({
  data,
  setActiveTab,
  onOpenAssistant,
  onRefresh
}) => {
  const { language, t } = useLanguage();
  const safeData = data || {};
  const userName = safeData.userName || 'Learner';
  const primaryGoal = safeData.primaryGoal || '';
  const metrics = safeData.metrics || {};
  const recommendedMentors = Array.isArray(safeData.recommendedMentors) ? safeData.recommendedMentors : [];
  const upcomingSessions = Array.isArray(safeData.upcomingSessions) ? safeData.upcomingSessions : [];
  const skillGaps = Array.isArray(safeData.skillGaps) ? safeData.skillGaps : [];
  const recentActivities = Array.isArray(safeData.recentActivities) ? safeData.recentActivities : [];

  const [requestMentor, setRequestMentor] = useState<any | null>(null);
  const [requestSkill, setRequestSkill] = useState('');
  const [requestGoal, setRequestGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestMentor || !requestSkill) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/mentors/request', {
        method: 'POST',
        body: JSON.stringify({
          mentorId: requestMentor.user_id,
          skillName: requestSkill,
          goalNotes: requestGoal
        })
      });
      setRequestSuccess(`${language === 'ta' ? 'வழிகாட்டுதல் கோரிக்கை அனுப்பப்பட்டது: ' : 'Mentorship request submitted to '}${requestMentor.full_name}!`);
      setRequestMentor(null);
      setRequestGoal('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Learner Welcome Banner */}
      <div className="p-6 lg:p-8 rounded-2xl bg-gradient-to-r from-[#0c263d] via-[#123859] to-[#703616] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#123859]/80 text-[#f7cbac] border border-[#8a431c]/50 mb-3">
            <Compass className="w-3.5 h-3.5 mr-1.5 text-[#2dd4bf]" />
            {language === 'ta' ? 'கற்பவர் பணியிடம் • தொடர் வளர்ச்சி' : 'Learner Workspace • Continuous Growth'}
          </div>

          <h1 className="font-heading text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
            {language === 'ta' ? `வணக்கம், ${userName}` : `Welcome, ${userName}`}
          </h1>

          <p className="text-sm text-[#ded0bb] leading-relaxed mb-6">
            {primaryGoal
              ? (language === 'ta' ? `கற்றல் இலக்கு: "${primaryGoal}". வழிகாட்டிகளுடன் இணைந்து புதிய திறன்களைக் கற்று சான்றிதழ்களைப் பெறுங்கள்.` : `Learning Target: "${primaryGoal}". Get matched with real peer mentors, attend practical sessions, and build verified SkillProof credentials.`)
              : (language === 'ta' ? 'உங்கள் கற்றல் இடம் தயார். வழிகாட்டிகளைத் தேர்ந்தெடுங்கள் அல்லது உங்கள் முன் அனுபவத்தை அறிவித்து அங்கீகாரம் பெறுங்கள்.' : `Your personalized learning space is active. Explore verified mentors or declare prior experience to get recognized.`)}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('mentors')}
              className="px-4 py-2.5 rounded-xl bg-[#0c263d] hover:bg-[#123859] border border-[#194a73] text-white text-xs font-bold transition flex items-center space-x-2 shadow cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#2dd4bf]" />
              <span>{language === 'ta' ? 'வழிகாட்டிகளைத் தேடுக' : 'Explore AI Mentors'}</span>
            </button>

            <button
              onClick={() => setActiveTab('recognition')}
              className="px-4 py-2.5 rounded-xl bg-[#8a431c] hover:bg-[#a85423] text-white text-xs font-bold transition flex items-center space-x-2 shadow cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#f0a876]" />
              <span>{language === 'ta' ? 'முன் அனுபவத்தை அறிவிக்க (RPL)' : 'Declare Experience (RPL)'}</span>
            </button>

            <button
              onClick={onOpenAssistant}
              className="px-4 py-2.5 rounded-xl bg-[#3d1d0c]/70 hover:bg-[#542810] border border-[#8a431c]/60 text-[#f7cbac] text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#f0a876]" />
              <span>{language === 'ta' ? 'AI உதவி கேளுங்கள்' : 'Ask LearnX AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {requestSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{requestSuccess}</span>
          </div>
          <button onClick={() => setRequestSuccess(null)} className="font-bold text-emerald-900 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Database Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#8a431c] mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#703616]">{language === 'ta' ? 'இருப்பு' : 'Economy'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.timeCredits ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'நேரக் கடன்கள்' : 'Time Credits'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#0c263d] mb-2">
            <Compass className="w-4 h-4 text-[#2dd4bf]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#123859]">{language === 'ta' ? 'பாதை A' : 'Path A'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.activePlans ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'கற்றல் திட்டங்கள்' : 'Active Plans'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#0d9488] mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488]">SkillProof</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.skillProofs ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'திறன் பேட்ஜ்கள்' : 'Badges Issued'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#c4682e] mb-2">
            <Award className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#c4682e]">{language === 'ta' ? 'அதிகாரப்பூர்வ' : 'Official'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.certificates ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'சான்றிதழ்கள்' : 'Certificates'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#8a431c] mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a431c]">{language === 'ta' ? 'பெட்டகம்' : 'Evidence'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.evidenceSubmitted ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'சான்றுக் கோப்புகள்' : 'Files In Vault'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#a85423] mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a85423]">{language === 'ta' ? 'இலக்கு' : 'Target'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.skillGapsCount ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'திறன் இடைவெளிகள்' : 'Skill Gaps'}</p>
        </div>
      </div>


      {/* CORE LEARNER SECTION: "Who can teach me the skills I want to learn?" */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#ede7dc]">
          <div>
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-[#0e7490]" />
              <h2 className="font-heading text-2xl font-bold text-[#0b253a]">
                Mentors Who Can Teach You
              </h2>
            </div>
            <p className="text-xs text-[#78350f] mt-1">
              Real registered mentors matching your learning goal ({primaryGoal || 'All subjects'}).
            </p>
          </div>

          <button
            onClick={() => setActiveTab('mentors')}
            className="text-xs font-bold text-[#0e7490] hover:underline flex items-center space-x-1 mt-2 sm:mt-0"
          >
            <span>Explore All Mentors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recommendedMentors && recommendedMentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedMentors.map((mentor: any) => (
              <div
                key={mentor.user_id}
                className="p-5 rounded-2xl bg-white border border-[#ede7dc] hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0e7490] to-[#0b253a] text-white font-bold text-xs flex items-center justify-center">
                        {mentor.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-heading text-xs font-bold text-[#0b253a]">{mentor.full_name}</h3>
                        <p className="text-[10px] text-[#78350f]">{mentor.years_of_experience} yrs exp</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14b8a6]/15 text-[#0f766e]">
                      {mentor.matchPercentage}%
                    </span>
                  </div>

                  <p className="text-[11px] text-[#0b253a] bg-[#f8f6f0] p-2 rounded-lg border border-[#ede7dc] mb-3">
                    <span className="font-bold text-[#0e7490]">Why: </span>
                    {mentor.matchRationale}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {mentor.skills_taught?.slice(0, 3).map((s: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-[#0e7490]/10 text-[#0e7490] font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#ede7dc] flex items-center justify-between">
                  <span className="text-[10px] text-[#78350f] font-bold">{mentor.hourly_rate_credits || 1} Credit/hr</span>
                  <button
                    onClick={() => {
                      setRequestMentor(mentor);
                      setRequestSkill(mentor.skills_taught?.[0] || 'Python Programming');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#0b253a] hover:bg-[#0f3453] text-white text-[11px] font-bold flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Request</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-[#ede7dc] text-center max-w-lg mx-auto shadow-sm">
            <Compass className="w-10 h-10 text-[#d6cbbe] mx-auto mb-2" />
            <h3 className="font-heading text-base font-bold text-[#0b253a]">No mentors registered yet for your skill</h3>
            <p className="text-xs text-[#78350f] mt-1 leading-relaxed">
              As mentors register in the database, they will appear here ranked by how closely their skills match your goals.
            </p>
          </div>
        )}
      </div>

      {/* Pathways Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-[#ede7dc] hover:border-[#0e7490]/40 transition shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#0e7490]/10 text-[#0e7490] flex items-center justify-center mb-4">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0e7490]">Pathway A</span>
            <h2 className="font-heading text-xl font-bold text-[#0b253a] mt-1 mb-2">Learn a New Skill</h2>
            <p className="text-xs text-[#78350f]/90 leading-relaxed mb-4">
              Connect with registered mentors, generate AI learning roadmaps, and practice hands-on projects.
            </p>
          </div>
          <div className="pt-4 border-t border-[#ede7dc] flex items-center justify-between">
            <span className="text-xs text-[#78350f] font-medium">1-on-1 Sessions &bull; Practice</span>
            <button onClick={() => setActiveTab('mentors')} className="px-3.5 py-1.5 rounded-lg bg-[#0e7490] text-white text-xs font-bold flex items-center space-x-1">
              <span>Find Mentors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#ede7dc] hover:border-[#b45309]/40 transition shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#b45309]/10 text-[#b45309] flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#b45309]">Pathway B</span>
            <h2 className="font-heading text-xl font-bold text-[#0b253a] mt-1 mb-2">I Already Know The Skill (RPL)</h2>
            <p className="text-xs text-[#78350f]/90 leading-relaxed mb-4">
              Declare real work experience, upload work artifacts, and achieve verified certification without repeating classes.
            </p>
          </div>
          <div className="pt-4 border-t border-[#ede7dc] flex items-center justify-between">
            <span className="text-xs text-[#78350f] font-medium">Experience Recognition &bull; Audit</span>
            <button onClick={() => setActiveTab('recognition')} className="px-3.5 py-1.5 rounded-lg bg-[#b45309] text-white text-xs font-bold flex items-center space-x-1">
              <span>Declare Experience</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Sessions & Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-white border border-[#ede7dc] shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ede7dc]">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#0e7490]" />
              <h3 className="font-heading text-base font-bold text-[#0b253a]">Upcoming Live Sessions</h3>
            </div>
            <button onClick={() => setActiveTab('learning')} className="text-xs text-[#0e7490] font-bold hover:underline">
              View All
            </button>
          </div>

          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              {upcomingSessions.map((session: any) => (
                <div key={session.id} className="p-4 rounded-xl bg-[#f8f6f0] border border-[#ede7dc] flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0e7490]/15 text-[#0e7490]">
                      {session.skill_name}
                    </span>
                    <p className="text-xs font-bold text-[#0b253a] mt-1">Mentor: {session.mentor_name}</p>
                    <p className="text-[11px] text-[#78350f]">
                      {new Date(session.scheduled_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)
                    </p>
                  </div>
                  {session.meeting_link && (
                    <a
                      href={session.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#0b253a] hover:bg-[#0f3453] text-white text-xs font-bold flex items-center space-x-1"
                    >
                      <span>Join Live</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[#78350f]">
              <Calendar className="w-8 h-8 text-[#d6cbbe] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#0b253a]">No live sessions scheduled</p>
              <button onClick={() => setActiveTab('mentors')} className="mt-3 px-3 py-1.5 rounded-lg bg-[#0e7490] text-white text-xs font-bold">
                Connect with Mentor
              </button>
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#ede7dc] shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ede7dc]">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#e11d48]" />
              <h3 className="font-heading text-base font-bold text-[#0b253a]">Identified Skill Gaps &amp; Verification</h3>
            </div>
            <button onClick={() => setActiveTab('assessment')} className="text-xs text-[#0e7490] font-bold hover:underline">
              Assess
            </button>
          </div>

          {skillGaps && skillGaps.length > 0 ? (
            <div className="space-y-3">
              {skillGaps.map((gap: any, index: number) => (
                <div key={index} className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#ede7dc]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0b253a]">{gap.skill_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f59e0b]/20 text-[#b45309]">
                      {gap.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78350f]">{gap.gap_notes}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[#78350f]">
              <CheckCircle className="w-8 h-8 text-[#14b8a6] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#0b253a]">No pending skill gaps</p>
              <button onClick={() => setActiveTab('assessment')} className="mt-3 px-3 py-1.5 rounded-lg bg-[#b45309] text-white text-xs font-bold">
                Take Practical Assessment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* REQUEST MODAL */}
      {requestMentor && (
        <div className="fixed inset-0 z-50 bg-[#0b253a]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ede7dc] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ede7dc]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0e7490]">Mentorship Request</span>
                <h3 className="font-heading text-lg font-bold text-[#0b253a]">Request Mentorship with {requestMentor.full_name}</h3>
              </div>
              <button onClick={() => setRequestMentor(null)} className="text-[#94a3b8] hover:text-[#0b253a] font-bold">&times;</button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1">Select Skill</label>
                <input
                  type="text"
                  required
                  value={requestSkill}
                  onChange={(e) => setRequestSkill(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1">Your Learning Goal</label>
                <textarea
                  rows={2}
                  required
                  value={requestGoal}
                  onChange={(e) => setRequestGoal(e.target.value)}
                  placeholder="e.g. Master asynchronous patterns and complete practical assessment"
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestMentor(null)}
                  className="px-4 py-2 rounded-xl border border-[#d6cbbe] text-xs font-bold text-[#78350f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0b253a] text-white text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
