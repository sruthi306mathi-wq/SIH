import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import {
  UserCheck,
  Sparkles,
  Users,
  Clock,
  Star,
  CheckCircle2,
  Calendar,
  Send,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  FileCheck2,
  BookOpen
} from 'lucide-react';

interface MentorDashboardViewProps {
  data: any;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
}

export const MentorDashboardView: React.FC<MentorDashboardViewProps> = ({ data, setActiveTab, onRefresh }) => {
  const { language, t } = useLanguage();
  const safeData = data || {};
  const userName = safeData.userName || 'Mentor';
  const mentorProfile = safeData.mentorProfile || {};
  const metrics = safeData.metrics || {};
  const matchingLearners = Array.isArray(safeData.matchingLearners) ? safeData.matchingLearners : [];
  const incomingRequests = Array.isArray(safeData.incomingRequests) ? safeData.incomingRequests : [];
  const activeMentees = Array.isArray(safeData.activeMentees) ? safeData.activeMentees : [];
  const upcomingSessions = Array.isArray(safeData.upcomingSessions) ? safeData.upcomingSessions : [];

  const [selectedLearner, setSelectedLearner] = useState<any | null>(null);
  const [offerSkill, setOfferSkill] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState<string | null>(null);

  const handleRespondRequest = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      await apiRequest(`/api/mentors/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to respond to request.');
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearner || !offerSkill) return;

    try {
      setIsSubmittingOffer(true);
      await apiRequest('/api/mentors/offer-mentoring', {
        method: 'POST',
        body: JSON.stringify({
          learnerId: selectedLearner.learner_id,
          skillName: offerSkill,
          offerNotes
        })
      });
      setOfferSuccess(`${language === 'ta' ? 'வழிகாட்டல் சலுகை அனுப்பப்பட்டது: ' : 'Mentorship offer sent to '}${selectedLearner.full_name}!`);
      setSelectedLearner(null);
      setOfferNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to submit offer.');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Mentor Welcome Banner */}
      <div className="p-6 lg:p-8 rounded-2xl bg-gradient-to-r from-[#0c263d] via-[#123859] to-[#703616] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#123859]/80 text-[#f7cbac] border border-[#8a431c]/50 mb-3">
            <UserCheck className="w-3.5 h-3.5 mr-1.5 text-[#f0a876]" />
            {language === 'ta' ? 'வழிகாட்டி மையம் • செயலில் உள்ள பயிற்றுநர்' : 'Mentor Command Center • Active Practitioner'}
          </div>

          <h1 className="font-heading text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
            {language === 'ta' ? `வணக்கம், வழிகாட்டி ${userName}` : `Welcome, Mentor ${userName}`}
          </h1>

          <p className="text-sm text-[#ded0bb] leading-relaxed mb-6">
            {language === 'ta'
              ? 'உங்கள் அறிவைப் பெற விரும்பும் கற்பவர்களைக் கண்டறியுங்கள், 1-on-1 அமர்வுகளை நிர்வகியுங்கள் மற்றும் நேரக் கடன்களை ஈட்டுங்கள்.'
              : 'Discover real registered learners seeking your expertise, manage 1-on-1 sessions, and earn Time Credits for verified teaching.'}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('mentors_learners')}
              className="px-4 py-2.5 rounded-xl bg-[#8a431c] hover:bg-[#a85423] text-white text-xs font-bold transition flex items-center space-x-2 shadow cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#f0a876]" />
              <span>{language === 'ta' ? 'மாணவர்களைக் கண்டறிக' : 'Find Learners Who Need You'}</span>
            </button>

            <button
              onClick={() => setActiveTab('learning')}
              className="px-4 py-2.5 rounded-xl bg-[#0c263d] hover:bg-[#123859] border border-[#194a73] text-[#f7cbac] text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#2dd4bf]" />
              <span>{language === 'ta' ? 'கற்பித்தல் அமர்வைத் திட்டமிடுக' : 'Schedule Teaching Session'}</span>
            </button>
          </div>
        </div>
      </div>

      {offerSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{offerSuccess}</span>
          </div>
          <button onClick={() => setOfferSuccess(null)} className="font-bold text-emerald-900 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Mentor Impact Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#8a431c] mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#703616]">{language === 'ta' ? 'ஈட்டியது' : 'Earned'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.totalEarnedCredits ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'ஈட்டப்பட்ட கடன்கள்' : 'Credits Earned'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#0c263d] mb-2">
            <Users className="w-4 h-4 text-[#2dd4bf]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#123859]">{language === 'ta' ? 'மாணவர்கள்' : 'Mentees'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.activeMenteesCount ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'செயலில் உள்ள மாணவர்கள்' : 'Active Learners'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#c4682e] mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#c4682e]">{language === 'ta' ? 'கோரிக்கைகள்' : 'Requests'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.pendingRequestsCount ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'நிலுவையில் உள்ளவை' : 'Pending Requests'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#0d9488] mb-2">
            <FileCheck2 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488]">{language === 'ta' ? 'அமர்வுகள்' : 'Sessions'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.completedSessionsCount ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'நிறைவுற்ற அமர்வுகள்' : 'Completed Sessions'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#8a431c] mb-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a431c]">{language === 'ta' ? 'மதிப்பீடு' : 'Rating'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{mentorProfile.rating_average || '5.0'}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'மாணவர் மதிப்பீடு' : 'Student Rating'}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#ebe0ce] shadow-sm">
          <div className="flex items-center justify-between text-[#123859] mb-2">
            <Clock className="w-4 h-4 text-[#f0a876]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#123859]">{language === 'ta' ? 'இருப்பு' : 'Balance'}</span>
          </div>
          <div className="font-heading text-2xl font-black text-[#0c263d]">{metrics.currentTimeCredits ?? 0}</div>
          <p className="text-[11px] text-[#703616]/80 mt-1 font-medium">{language === 'ta' ? 'நேரக் கடன் இருப்பு' : 'Live Credits'}</p>
        </div>
      </div>

      {/* PENDING MENTORSHIP REQUESTS (If any) */}
      {incomingRequests && incomingRequests.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#0f3453] text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-[#f59e0b]" />
              <h2 className="font-heading text-lg font-bold">
                Incoming Mentorship Requests ({incomingRequests.length})
              </h2>
            </div>
            <span className="text-xs text-[#94a3b8]">Learners awaiting your response</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.map((req: any) => (
              <div key={req.id} className="p-4 rounded-xl bg-[#0b253a] border border-[#15446b] flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{req.learner_name}</p>
                      <p className="text-xs text-[#94a3b8]">Target: <span className="text-[#14b8a6] font-semibold">{req.skill_name}</span></p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14b8a6]/20 text-[#5eead4]">
                      {req.learning_mode || 'Online'}
                    </span>
                  </div>
                  {req.goal_notes && (
                    <p className="text-xs text-[#cbd5e1] mt-2 italic bg-[#0f3453]/60 p-2 rounded-lg border border-[#15446b]/60">
                      "{req.goal_notes}"
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-[#15446b]">
                  <button
                    onClick={() => handleRespondRequest(req.id, 'rejected')}
                    className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900 font-bold text-xs"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req.id, 'accepted')}
                    className="px-4 py-1.5 rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-[#0b253a] font-bold text-xs shadow"
                  >
                    Accept Mentee
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CORE MENTOR SECTION: "Which learners need the skills I can teach?" */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#ede7dc]">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#f59e0b]" />
              <h2 className="font-heading text-2xl font-bold text-[#0b253a]">
                Learners Who Need Your Skills
              </h2>
            </div>
            <p className="text-xs text-[#78350f] mt-1">
              AI-matched registered learners seeking skills you teach ({mentorProfile?.skillsTaught?.join(', ') || 'Your skills'}).
            </p>
          </div>

          <button
            onClick={() => setActiveTab('mentors_learners')}
            className="text-xs font-bold text-[#0e7490] hover:underline flex items-center space-x-1 mt-2 sm:mt-0"
          >
            <span>Browse Full Learner Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {matchingLearners && matchingLearners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchingLearners.map((learner: any) => (
              <div
                key={learner.learner_id}
                className="p-6 rounded-2xl bg-white border border-[#ede7dc] hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#b45309] to-[#0b253a] text-white font-black text-base flex items-center justify-center shadow">
                        {learner.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-bold text-[#0b253a]">{learner.full_name}</h3>
                        <p className="text-[11px] text-[#78350f]">Level: {learner.current_level} &rarr; {learner.target_level}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {learner.matchPercentage}% Match
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f8f6f0] border border-[#ede7dc] mb-3">
                    <p className="text-[11px] text-[#0b253a] leading-relaxed">
                      <span className="font-bold text-[#b45309]">AI Match Rationale: </span>
                      {learner.matchRationale}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#78350f] mb-4">
                    <p><span className="font-semibold text-[#0b253a]">Goal:</span> {learner.primary_goal}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {learner.skills_to_learn?.map((s: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-[#0e7490]/10 text-[#0e7490] text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#ede7dc] flex items-center justify-between">
                  <span className="text-[10px] text-[#94a3b8]">{learner.preferred_mode || 'Online 1-on-1'}</span>
                  <button
                    onClick={() => {
                      setSelectedLearner(learner);
                      setOfferSkill(learner.skills_to_learn?.[0] || mentorProfile?.skillsTaught?.[0] || 'Python Programming');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0b253a] hover:bg-[#0f3453] text-white text-xs font-bold transition flex items-center space-x-1 shadow"
                  >
                    <Send className="w-3 h-3" />
                    <span>Offer Mentoring</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-white border border-[#ede7dc] text-center max-w-lg mx-auto shadow-sm">
            <Users className="w-10 h-10 text-[#d6cbbe] mx-auto mb-2" />
            <h3 className="font-heading text-base font-bold text-[#0b253a]">No matching learners yet</h3>
            <p className="text-xs text-[#78350f] mt-1 leading-relaxed">
              Learners will appear here automatically as soon as their learning goals match the skills you teach. You can also expand your skills taught in your profile settings.
            </p>
          </div>
        )}
      </div>

      {/* Two Column Layout: Upcoming Teaching Sessions & Active Mentees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Teaching Sessions */}
        <div className="p-6 rounded-2xl bg-white border border-[#ede7dc] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ede7dc]">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#0e7490]" />
              <h3 className="font-heading text-base font-bold text-[#0b253a]">Upcoming Teaching Sessions</h3>
            </div>
            <button onClick={() => setActiveTab('learning')} className="text-xs text-[#0e7490] font-bold hover:underline">
              View All
            </button>
          </div>

          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              {upcomingSessions.map((ses: any) => (
                <div key={ses.id} className="p-4 rounded-xl bg-[#f8f6f0] border border-[#ede7dc] flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0e7490]/15 text-[#0e7490]">
                      {ses.skill_name}
                    </span>
                    <p className="text-xs font-bold text-[#0b253a] mt-1">
                      Learner: {ses.learner_name}
                    </p>
                    <p className="text-[11px] text-[#78350f]">
                      {new Date(ses.scheduled_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({ses.duration_minutes}m)
                    </p>
                  </div>
                  {ses.meeting_link && (
                    <a
                      href={ses.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-[#0b253a] hover:bg-[#0f3453] text-white text-xs font-bold flex items-center space-x-1"
                    >
                      <span>Join Room</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[#78350f]">
              <Calendar className="w-8 h-8 text-[#d6cbbe] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#0b253a]">No teaching sessions scheduled</p>
              <button
                onClick={() => setActiveTab('learning')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-[#0e7490] text-white text-xs font-bold"
              >
                Schedule Session
              </button>
            </div>
          )}
        </div>

        {/* Active Mentees */}
        <div className="p-6 rounded-2xl bg-white border border-[#ede7dc] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ede7dc]">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#b45309]" />
              <h3 className="font-heading text-base font-bold text-[#0b253a]">Active Mentees ({activeMentees?.length || 0})</h3>
            </div>
            <button onClick={() => setActiveTab('chat')} className="text-xs text-[#0e7490] font-bold hover:underline">
              Open Messenger
            </button>
          </div>

          {activeMentees && activeMentees.length > 0 ? (
            <div className="divide-y divide-[#ede7dc]">
              {activeMentees.map((m: any) => (
                <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#0b253a]">{m.learner_name}</p>
                    <p className="text-[11px] text-[#78350f]">Focus: {m.skill_name}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="px-3 py-1 rounded-lg border border-[#0b253a] text-xs font-bold text-[#0b253a] hover:bg-[#0b253a] hover:text-white transition"
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[#78350f]">
              <Users className="w-8 h-8 text-[#d6cbbe] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#0b253a]">No active mentees yet</p>
              <p className="text-[11px] text-[#78350f] mt-1">Accept requests or offer mentoring to connect with learners.</p>
            </div>
          )}
        </div>
      </div>

      {/* OFFER MENTORING MODAL */}
      {selectedLearner && (
        <div className="fixed inset-0 z-50 bg-[#0b253a]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ede7dc] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ede7dc]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#b45309]">Mentor Invitation</span>
                <h3 className="font-heading text-xl font-bold text-[#0b253a]">
                  Offer Mentorship to {selectedLearner.full_name}
                </h3>
              </div>
              <button onClick={() => setSelectedLearner(null)} className="text-[#94a3b8] hover:text-[#0b253a] font-bold">&times;</button>
            </div>

            <form onSubmit={handleSendOffer} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#f8f6f0] border border-[#ede7dc] text-xs space-y-1">
                <p><span className="font-bold text-[#0b253a]">Learner Goal:</span> {selectedLearner.primary_goal}</p>
                <p><span className="font-bold text-[#0b253a]">Target Level:</span> {selectedLearner.current_level} &rarr; {selectedLearner.target_level}</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1.5">
                  Skill You Wish to Guide *
                </label>
                <input
                  type="text"
                  required
                  value={offerSkill}
                  onChange={(e) => setOfferSkill(e.target.value)}
                  placeholder="e.g. Python Programming"
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b253a] mb-1.5">
                  Personal Invitation Message &amp; Schedule Suggestion
                </label>
                <textarea
                  rows={3}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="e.g. I saw your learning goal for Python. I have 6 years experience and can help you build your capstone project this weekend!"
                  className="w-full px-3 py-2 rounded-xl border border-[#d6cbbe] bg-white text-xs text-[#0b253a]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLearner(null)}
                  className="px-4 py-2 rounded-xl border border-[#d6cbbe] text-xs font-bold text-[#78350f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOffer}
                  className="px-5 py-2 rounded-xl bg-[#0b253a] hover:bg-[#0f3453] text-white text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmittingOffer ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
