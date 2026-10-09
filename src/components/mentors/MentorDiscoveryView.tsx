import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import { MentorProfile, MentorRequest } from '../../types';
import {
  Search,
  Filter,
  Sparkles,
  Star,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export const MentorDiscoveryView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [mentors, setMentors] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchSkill, setSearchSkill] = useState('');
  const [minExp, setMinExp] = useState('');

  // Request Modal State
  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
  const [requestSkill, setRequestSkill] = useState('');
  const [requestGoal, setRequestGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMentors = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchSkill) params.append('skill', searchSkill);
      if (minExp) params.append('minExp', minExp);

      const res = await apiRequest(`/api/mentors?${params.toString()}`);
      setMentors(res.mentors || []);

      const reqRes = await apiRequest('/api/mentors/requests/list');
      setIncomingRequests(reqRes.incomingRequests || []);
      setSentRequests(reqRes.sentRequests || []);
    } catch (e) {
      console.error('Error fetching mentors:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [searchSkill, minExp]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor || !requestSkill) return;

    try {
      setIsSubmitting(true);
      setFeedbackMsg(null);
      await apiRequest('/api/mentors/request', {
        method: 'POST',
        body: JSON.stringify({
          mentorId: selectedMentor.user_id,
          skillName: requestSkill,
          goalNotes: requestGoal
        })
      });

      setFeedbackMsg({
        type: 'success',
        text: language === 'ta'
          ? `${selectedMentor.full_name} அவர்களுக்கு வழிகாட்டல் கோரிக்கை அனுப்பப்பட்டது!`
          : `Mentorship request sent to ${selectedMentor.full_name}!`
      });
      setSelectedMentor(null);
      setRequestGoal('');
      fetchMentors();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || (language === 'ta' ? 'கோரிக்கையைச் சமர்ப்பிக்க முடியவில்லை.' : 'Failed to submit request.')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      await apiRequest(`/api/mentors/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      fetchMentors();
    } catch (e: any) {
      alert(e.message || (language === 'ta' ? 'கோரிக்கைக்கு பதிலளிக்க முடியவில்லை.' : 'Failed to respond to request.'));
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ebe0ce]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
            {language === 'ta' ? 'பாதை A • வழிகாட்டல் பரிமாற்றம்' : 'Pathway A • Mentorship Exchange'}
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
            {language === 'ta' ? 'AI வழிகாட்டி கண்டறிதல்' : 'AI-Matched Mentor Discovery'}
          </h1>
          <p className="text-sm text-[#703616] mt-1">
            {language === 'ta'
              ? 'கற்பவர்களால் மதிப்பிடப்பட்ட நிபுணத்துவ வழிகாட்டிகள். 1-on-1 பயிற்சிக்கு 1 நேரக் கடன் பரிமாறிக்கொள்ளுங்கள்.'
              : 'Real peer practitioners rated by learners. Exchange 1 Time Credit per 1-on-1 practical session.'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8a431c] absolute left-3 top-3" />
            <input
              type="text"
              placeholder={language === 'ta' ? 'திறன் மூலம் வடிகட்டுக...' : 'Filter by skill...'}
              value={searchSkill}
              onChange={(e) => setSearchSkill(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
            />
          </div>

          <select
            value={minExp}
            onChange={(e) => setMinExp(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
          >
            <option value="">{language === 'ta' ? 'அனைத்து அனுபவங்களும்' : 'Any Experience'}</option>
            <option value="2">{language === 'ta' ? '2+ ஆண்டுகள்' : '2+ Years'}</option>
            <option value="5">{language === 'ta' ? '5+ ஆண்டுகள்' : '5+ Years'}</option>
            <option value="8">{language === 'ta' ? '8+ ஆண்டுகள்' : '8+ Years'}</option>
          </select>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Incoming Requests Banner */}
      {incomingRequests.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0c263d] text-white shadow-md border border-[#194a73]">
          <div className="flex items-center space-x-2 mb-3">
            <UserCheck className="w-4 h-4 text-[#f0a876]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0a876]">
              {language === 'ta' ? 'உள்வரும் வழிகாட்டல் கோரிக்கைகள்' : 'Incoming Mentorship Requests'} ({incomingRequests.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {incomingRequests.map((req) => (
              <div key={req.id} className="p-3.5 rounded-xl bg-[#071a2b] border border-[#123859] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{req.learner_name}</p>
                  <p className="text-[11px] text-[#ebe0ce]">
                    {language === 'ta' ? 'கோரப்பட்ட திறன்: ' : 'Requested for: '}
                    <span className="text-[#f0a876] font-semibold">{req.skill_name}</span>
                  </p>
                  {req.goal_notes && <p className="text-[10px] text-[#cbbba3] mt-1 italic">"{req.goal_notes}"</p>}
                </div>
                {req.status === 'requested' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRespondRequest(req.id, 'accepted')}
                      className="px-3 py-1.5 rounded-lg bg-[#8a431c] hover:bg-[#a85423] text-white font-bold text-xs"
                    >
                      {language === 'ta' ? 'ஏற்றுக்கொள்' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleRespondRequest(req.id, 'rejected')}
                      className="px-2.5 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-900 text-red-300 font-bold text-xs"
                    >
                      {language === 'ta' ? 'நிராகரி' : 'Decline'}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold capitalize text-[#f0a876]">{req.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentor Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-[#703616]">
          <div className="w-8 h-8 border-3 border-[#8a431c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">
            {language === 'ta' ? 'வழிகாட்டிகளை AI பொருத்தம் செய்கிறது...' : 'Running AI Matching across verified database mentors...'}
          </p>
        </div>
      ) : mentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div
              key={mentor.user_id}
              className="p-6 rounded-2xl bg-white border border-[#ebe0ce] hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                {/* Header with AI Match Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8a431c] to-[#0c263d] text-white font-black text-lg flex items-center justify-center shadow">
                      {mentor.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-heading text-base font-bold text-[#0c263d] flex items-center space-x-1">
                        <span>{mentor.full_name}</span>
                        {mentor.is_verified === 1 && (
                          <span title="Verified Practitioner">
                            <ShieldCheck className="w-4 h-4 text-[#8a431c]" />
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-[#703616]">
                        {mentor.years_of_experience} {language === 'ta' ? 'ஆண்டுகள் அனுபவம்' : 'yrs exp'} &bull; {mentor.learners_helped} {language === 'ta' ? 'மாணவர்கள்' : 'mentees'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-[#f6efe3] text-[#8a431c] border border-[#ebe0ce]">
                      <Sparkles className="w-3 h-3 mr-1 text-[#8a431c]" />
                      {mentor.matchPercentage}% {language === 'ta' ? 'பொருத்தம்' : 'Match'}
                    </span>
                    <div className="flex items-center space-x-1 mt-1 text-[11px] text-[#c4682e] font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{mentor.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Rationale */}
                {mentor.matchRationale && (
                  <div className="p-3 rounded-xl bg-[#fcfaf6] border border-[#ebe0ce] mb-4">
                    <p className="text-[11px] text-[#0c263d] leading-relaxed">
                      <span className="font-bold text-[#8a431c]">{language === 'ta' ? 'AI விளக்கம்: ' : 'AI Fit: '}</span>
                      {mentor.matchRationale}
                    </p>
                  </div>
                )}

                {/* Skills Taught */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#703616]/80 mb-1.5">
                    {language === 'ta' ? 'கற்பிக்கும் திறன்கள்' : 'Skills Taught'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.skills_taught.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#f6efe3] text-[#8a431c]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Teaching Style & Bio */}
                <p className="text-xs text-[#703616] line-clamp-2 mb-4">
                  {mentor.mentor_bio || mentor.teaching_style}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-[#ebe0ce] flex items-center justify-between">
                <div className="text-xs text-[#703616] flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#8a431c]" />
                  <span className="font-bold text-[#0c263d]">
                    {mentor.hourly_rate_credits || 1} {language === 'ta' ? 'கடன்' : 'Credit'}
                  </span>
                  <span className="text-[10px]">/ 60m</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedMentor(mentor);
                    setRequestSkill(mentor.skills_taught[0] || 'Python Programming');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0c263d] hover:bg-[#123859] text-white font-bold text-xs flex items-center space-x-1.5 transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'வழிகாட்டல் கோரிக்கை' : 'Request Mentorship'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 p-8 rounded-2xl bg-white border border-[#ebe0ce] text-center max-w-xl mx-auto shadow-sm">
          <UserCheck className="w-12 h-12 text-[#ded0bb] mx-auto mb-3" />
          <h2 className="font-heading text-lg font-bold text-[#0c263d]">
            {language === 'ta' ? 'வழிகாட்டிகள் இன்னும் பதிவு செய்யப்படவில்லை' : 'No mentors registered in database yet'}
          </h2>
          <p className="text-xs text-[#703616] mt-2 leading-relaxed">
            {language === 'ta'
              ? 'இந்த LearnX தரவுத்தளத்தில் பிற கணக்குகள் எதுவும் வழிகாட்டியாகப் பதிவு செய்யப்படவில்லை. மேல் பலகையில் வழிகாட்டி முறைமைக்கு (Mentor Mode) மாறி உங்கள் திறன்களை வழங்கலாம்!'
              : 'There are currently no other user accounts registered as mentors in this LearnX database instance. Switch your account to Mentor Mode using the top bar switcher to offer skills!'}
          </p>
        </div>
      )}

      {/* REQUEST MODAL */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-[#0c263d]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ebe0ce] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ebe0ce]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
                  {language === 'ta' ? 'வழிகாட்டல் கோரிக்கை' : 'Mentorship Request'}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#0c263d]">
                  {language === 'ta' ? `${selectedMentor.full_name} உடன் வழிகாட்டல் கோரிக்கை` : `Request Mentorship with ${selectedMentor.full_name}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMentor(null)}
                className="text-[#8a431c] hover:text-[#0c263d] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'கற்க வேண்டிய திறனைத் தேர்ந்தெடுக்கவும்' : 'Select Skill to Learn'}
                </label>
                <select
                  value={requestSkill}
                  onChange={(e) => setRequestSkill(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                >
                  {selectedMentor.skills_taught.map((s: string, idx: number) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'உங்கள் குறிப்பிட்ட இலக்கு / உதவி தேவைப்படும் பகுதி' : 'Your Specific Goal / Problem Area'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestGoal}
                  onChange={(e) => setRequestGoal(e.target.value)}
                  placeholder={language === 'ta' ? 'உதா: எனது செயல்திட்டத்தை உருவாக்க மற்றும் தணிக்கையாளர் சரிபார்ப்பிற்குத் தயாராக உதவி தேவை...' : 'e.g. I need help building my capstone project and preparing for assessor verification...'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#fcfaf6] border border-[#ebe0ce] text-[11px] text-[#703616]">
                <p className="font-semibold text-[#0c263d]">
                  {language === 'ta' ? 'நேரக் கடன் கொள்கை (Time Credit Policy)' : 'Time Credit Policy'}
                </p>
                <p className="mt-0.5">
                  {language === 'ta'
                    ? `பணம் செலுத்த வேண்டிய அவசியமில்லை. ${selectedMentor.full_name} அவர்கள் அமர்வை நிறைவு செய்து உறுதிப்படுத்தும்போது, அவர்களின் கற்பித்தலுக்காக 1 நேரக் கடன் மாற்றப்படும்.`
                    : `No payment required. When ${selectedMentor.full_name} accepts and verifies your completed session, 1 Time Credit will be transferred to reward their peer teaching.`}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
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
                    ? (language === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...')
                    : (language === 'ta' ? 'கோரிக்கை அனுப்பு' : 'Send Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
