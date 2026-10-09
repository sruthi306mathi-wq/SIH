import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import {
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle,
  Clock,
  ExternalLink,
  Plus,
  PlayCircle,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

export const LearningView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [plans, setPlans] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AI Plan Generator Modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genSkill, setGenSkill] = useState('Python Programming');
  const [genCurrentLevel, setGenCurrentLevel] = useState('Beginner');
  const [genTargetLevel, setGenTargetLevel] = useState('Intermediate');
  const [genGoal, setGenGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Schedule Session Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSkill, setScheduleSkill] = useState('Python Programming');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [agenda, setAgenda] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Complete Session Modal
  const [completingSession, setCompletingSession] = useState<any | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, sessionsRes] = await Promise.all([
        apiRequest('/api/learning/plans'),
        apiRequest('/api/learning/sessions')
      ]);
      setPlans(plansRes.plans || []);
      setSessions(sessionsRes.sessions || []);
    } catch (e) {
      console.error('Failed to load learning data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      await apiRequest('/api/learning/plans/generate', {
        method: 'POST',
        body: JSON.stringify({
          skillName: genSkill,
          currentLevel: genCurrentLevel,
          targetLevel: genTargetLevel,
          goal: genGoal
        })
      });
      setShowGenModal(false);
      setGenGoal('');
      fetchData();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'கற்றல் திட்டத்தை உருவாக்க முடியவில்லை.' : 'Failed to generate plan.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsScheduling(true);
      await apiRequest('/api/learning/sessions/schedule', {
        method: 'POST',
        body: JSON.stringify({
          skillName: scheduleSkill,
          scheduledAt,
          durationMinutes,
          agenda
        })
      });
      setShowScheduleModal(false);
      setAgenda('');
      fetchData();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'அமர்வை முன்பதிவு செய்ய முடியவில்லை.' : 'Failed to schedule session.'));
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCompleteSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingSession) return;

    try {
      setIsCompleting(true);
      await apiRequest(`/api/learning/sessions/${completingSession.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          notes: sessionNotes,
          feedback: sessionFeedback
        })
      });
      setCompletingSession(null);
      setSessionNotes('');
      setSessionFeedback('');
      fetchData();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'அமர்வை நிறைவு செய்ய முடியவில்லை.' : 'Failed to complete session.'));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleModuleStatusChange = async (planId: string, moduleIndex: number, newStatus: string) => {
    try {
      await apiRequest(`/api/learning/plans/${planId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ moduleIndex, status: newStatus })
      });
      fetchData();
    } catch (e: any) {
      alert(e.message || (language === 'ta' ? 'பாடத்திட்டத்தைப் புதுப்பிக்க முடியவில்லை.' : 'Failed to update module.'));
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 theme-marine-brown">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ebe0ce]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
            {language === 'ta' ? 'பாதை A • கட்டமைக்கப்பட்ட கற்றல்' : 'Pathway A • Structured Learning'}
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
            {language === 'ta' ? 'கற்றல் திட்டங்கள் & நேரலை அமர்வுகள்' : 'Learning Plans & Live Sessions'}
          </h1>
          <p className="text-sm text-[#703616] mt-1">
            {language === 'ta'
              ? 'வாராந்திர மைல்கற்களைக் கண்காணிக்கவும், நேரடி அமர்வுகளில் இணையவும், அமர்வு முடிந்ததும் நேரக் கடன்களை மாற்றவும்.'
              : 'Track weekly milestones, join live video sessions, and transfer Time Credits upon session completion.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2.5 rounded-xl border border-[#0c263d] text-[#0c263d] hover:bg-[#0c263d] hover:text-white text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>{language === 'ta' ? 'அமர்வை திட்டமிடு' : 'Schedule Session'}</span>
          </button>

          <button
            onClick={() => setShowGenModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#8a431c] hover:bg-[#a85423] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'ta' ? 'AI திட்டம் உருவாக்கு' : 'Generate AI Plan'}</span>
          </button>
        </div>
      </div>

      {/* Live Sessions Section */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0c263d] flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-[#8a431c]" />
          <span>{language === 'ta' ? 'நேரலை கற்றல் அமர்வுகள்' : 'Live Learning Sessions'}</span>
        </h2>

        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((ses) => (
              <div
                key={ses.id}
                className={`p-5 rounded-2xl border transition ${
                  ses.status === 'completed'
                    ? 'bg-[#fcfaf6] border-[#ebe0ce] opacity-80'
                    : 'bg-white border-[#ebe0ce] shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#f6efe3] text-[#8a431c]">
                      {ses.skill_name}
                    </span>
                    <h3 className="font-heading text-base font-bold text-[#0c263d] mt-1">
                      {ses.agenda || (language === 'ta' ? '1-on-1 வழிகாட்டல் & செய்முறை மதிப்பாய்வு' : '1-on-1 Mentorship & Practical Review')}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ses.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-[#f6efe3] text-[#8a431c]'
                  }`}>
                    {ses.status === 'completed'
                      ? (language === 'ta' ? 'நிறைவுற்றது' : 'completed')
                      : (language === 'ta' ? 'திட்டமிடப்பட்டது' : 'scheduled')}
                  </span>
                </div>

                <div className="text-xs text-[#703616] space-y-1 mb-4">
                  <p className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#8a431c]" />
                    <span className="font-semibold">{new Date(ses.scheduled_at).toLocaleString()}</span>
                    <span>({ses.duration_minutes} {language === 'ta' ? 'நிமிடம்' : 'min'})</span>
                  </p>
                  <p>
                    {language === 'ta' ? 'வழிகாட்டி: ' : 'Mentor: '}
                    <span className="font-bold text-[#0c263d]">{ses.mentor_name}</span> &bull; 
                    {language === 'ta' ? ' மாணவர்: ' : ' Learner: '}
                    <span className="font-bold text-[#0c263d]">{ses.learner_name}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-[#ebe0ce] flex items-center justify-between">
                  {ses.status === 'scheduled' ? (
                    <>
                      <a
                        href={ses.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-[#0c263d] hover:bg-[#123859] text-white text-xs font-bold flex items-center space-x-1"
                      >
                        <span>{language === 'ta' ? 'அறையில் இணை' : 'Join Room'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setCompletingSession(ses)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#8a431c] hover:bg-[#a85423] text-white text-xs font-bold flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{language === 'ta' ? 'சரிபார்த்து முடி' : 'Verify & Complete'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-[11px] text-emerald-800 font-semibold flex items-center space-x-1">
                      <FileCheck2 className="w-4 h-4" />
                      <span>{language === 'ta' ? 'நிறைவுற்றது • 1 நேரக் கடன் மாற்றப்பட்டது' : 'Completed • 1 Time Credit Transferred'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-[#ebe0ce] text-center">
            <Calendar className="w-10 h-10 text-[#ded0bb] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#0c263d]">
              {language === 'ta' ? 'அமர்வுகள் எதுவும் இன்னும் திட்டமிடப்படவில்லை' : 'No sessions scheduled yet'}
            </p>
            <p className="text-[11px] text-[#703616] mt-1">
              {language === 'ta' ? 'நேரலை 1-on-1 சந்திப்பை உருவாக்க மேலே உள்ள "அமர்வை திட்டமிடு" பொத்தானைக் கிளிக் செய்யவும்.' : 'Click "Schedule Session" above to set up a live 1-on-1 meeting.'}
            </p>
          </div>
        )}
      </div>

      {/* Learning Plans Section */}
      <div className="space-y-4 pt-4 border-t border-[#ebe0ce]">
        <h2 className="font-heading text-xl font-bold text-[#0c263d] flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-[#8a431c]" />
          <span>{language === 'ta' ? 'செயலில் உள்ள கற்றல் திட்டங்கள்' : 'Active Learning Plans'} ({plans.length})</span>
        </h2>

        {plans.length > 0 ? (
          <div className="space-y-6">
            {plans.map((plan) => (
              <div key={plan.id} className="p-6 rounded-2xl bg-white border border-[#ebe0ce] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ebe0ce]">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#f6efe3] text-[#8a431c]">
                      {plan.skill_name}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-[#0c263d] mt-1">{plan.goal}</h3>
                    {plan.mentor_name && (
                      <p className="text-xs text-[#703616] mt-0.5">
                        {language === 'ta' ? 'வழிகாட்டி: ' : 'Mentor: '}
                        <span className="font-semibold text-[#0c263d]">{plan.mentor_name}</span>
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase text-[#8a431c] mt-2 sm:mt-0">
                    {language === 'ta' ? 'நிலை: ' : 'Status: '}{plan.status}
                  </span>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {plan.modules.map((mod: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col justify-between ${
                        mod.status === 'completed'
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : mod.status === 'in_progress'
                          ? 'bg-[#f6efe3] border-[#8a431c]/30'
                          : 'bg-[#fcfaf6] border-[#ebe0ce]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase text-[#703616]">
                            {language === 'ta' ? 'வாரம்' : 'Week'} {mod.week || idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-[#8a431c]">{mod.hours || 6} {language === 'ta' ? 'மணி' : 'hrs'}</span>
                        </div>
                        <h4 className="font-heading text-xs font-bold text-[#0c263d] mb-2">{mod.title}</h4>
                        <p className="text-[11px] text-[#703616] mb-2">
                          <span className="font-semibold text-[#0c263d]">{language === 'ta' ? 'பணி: ' : 'Task: '}</span>
                          {mod.handsOnTask || mod.task || (language === 'ta' ? 'செயல்முறைப் பயிற்சி' : 'Practical implementation')}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#ebe0ce]/60">
                        <select
                          value={mod.status || 'pending'}
                          onChange={(e) => handleModuleStatusChange(plan.id, idx, e.target.value)}
                          className="w-full text-[11px] font-bold p-1 rounded-lg border border-[#ebe0ce] bg-white text-[#0c263d]"
                        >
                          <option value="pending">{language === 'ta' ? 'நிலுவையில்' : 'Pending'}</option>
                          <option value="in_progress">{language === 'ta' ? 'செயலில்' : 'In Progress'}</option>
                          <option value="completed">{language === 'ta' ? 'நிறைவுற்றது' : 'Completed'}</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-[#ebe0ce] text-center">
            <BookOpen className="w-10 h-10 text-[#ded0bb] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#0c263d]">
              {language === 'ta' ? 'கற்றல் திட்டங்கள் எதுவும் இல்லை' : 'No active learning plans in database yet'}
            </p>
            <p className="text-[11px] text-[#703616] mt-1">
              {language === 'ta' ? 'எந்தவொரு திறனுக்கும் தனிப்பயனாக்கப்பட்ட திட்டத்தை உருவாக்க மேலே உள்ள "AI திட்டம் உருவாக்கு" பொத்தானைப் பயன்படுத்தவும்.' : 'Click "Generate AI Plan" above to create an actionable milestone pathway for any skill.'}
            </p>
          </div>
        )}
      </div>

      {/* AI GENERATE PLAN MODAL */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-[#0c263d]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ebe0ce] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ebe0ce]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
                  {language === 'ta' ? 'AI பாடத்திட்ட இயந்திரம்' : 'AI Curriculum Engine'}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#0c263d]">
                  {language === 'ta' ? 'கற்றல் திட்டத்தை உருவாக்கு' : 'Generate Learning Plan'}
                </h3>
              </div>
              <button onClick={() => setShowGenModal(false)} className="text-[#8a431c] hover:text-[#0c263d] font-bold">&times;</button>
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'கற்க வேண்டிய திறன்' : 'Skill to Master'}
                </label>
                <input
                  type="text"
                  required
                  value={genSkill}
                  onChange={(e) => setGenSkill(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                    {language === 'ta' ? 'தற்போதைய நிலை' : 'Current Level'}
                  </label>
                  <select
                    value={genCurrentLevel}
                    onChange={(e) => setGenCurrentLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                  >
                    <option value="Beginner">{language === 'ta' ? 'தொடக்க நிலை' : 'Beginner'}</option>
                    <option value="Intermediate">{language === 'ta' ? 'இடைநிலை' : 'Intermediate'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                    {language === 'ta' ? 'இலக்கு நிலை' : 'Target Level'}
                  </label>
                  <select
                    value={genTargetLevel}
                    onChange={(e) => setGenTargetLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                  >
                    <option value="Intermediate">{language === 'ta' ? 'இடைநிலை' : 'Intermediate'}</option>
                    <option value="Advanced">{language === 'ta' ? 'மேம்பட்ட நிலை' : 'Advanced'}</option>
                    <option value="Expert">{language === 'ta' ? 'நிபுணர் நிலை' : 'Expert'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'குறிப்பிட்ட கற்றல் இலக்கு' : 'Specific Learning Goal'}
                </label>
                <input
                  type="text"
                  value={genGoal}
                  onChange={(e) => setGenGoal(e.target.value)}
                  placeholder={language === 'ta' ? 'உதா: உற்பத்தி அளவிலான செயலிகளை உருவாக்கி நிலை 4 சான்றிதழ் பெறுதல்' : 'e.g. Build production microservices & pass Level 4 certification'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#ebe0ce] text-xs font-bold text-[#703616]"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 rounded-xl bg-[#8a431c] hover:bg-[#a85423] text-white text-xs font-bold shadow disabled:opacity-50"
                >
                  {isGenerating
                    ? (language === 'ta' ? 'AI திட்டமிடுகிறது...' : 'AI Architecting...')
                    : (language === 'ta' ? 'திட்டம் உருவாக்கு' : 'Generate Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE SESSION MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-[#0c263d]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ebe0ce] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ebe0ce]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0c263d]">
                  {language === 'ta' ? 'நேரலை கற்றல்' : 'Live Learning'}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#0c263d]">
                  {language === 'ta' ? '1-on-1 அமர்வை திட்டமிடு' : 'Schedule 1-on-1 Session'}
                </h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-[#8a431c] hover:text-[#0c263d] font-bold">&times;</button>
            </div>

            <form onSubmit={handleScheduleSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'திறன்' : 'Skill'}
                </label>
                <input
                  type="text"
                  required
                  value={scheduleSkill}
                  onChange={(e) => setScheduleSkill(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                    {language === 'ta' ? 'தேதி & நேரம்' : 'Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                    {language === 'ta' ? 'கால அளவு' : 'Duration'}
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                  >
                    <option value={45}>45 {language === 'ta' ? 'நிமிடங்கள்' : 'Minutes'}</option>
                    <option value={60}>60 {language === 'ta' ? 'நிமிடங்கள் (1 கடன்)' : 'Minutes (1 Credit)'}</option>
                    <option value={90}>90 {language === 'ta' ? 'நிமிடங்கள்' : 'Minutes'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'அமர்வு தலைப்புகள் & குறிப்புகள்' : 'Session Agenda & Topics'}
                </label>
                <textarea
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder={language === 'ta' ? 'உதா: குறியீடு மதிப்பாய்வு, பிழைத்திருத்தம்' : 'e.g. Code walkthrough, debugging asynchronous pipelines'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#ebe0ce] text-xs font-bold text-[#703616]"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="px-5 py-2 rounded-xl bg-[#0c263d] hover:bg-[#123859] text-white text-xs font-bold shadow disabled:opacity-50"
                >
                  {isScheduling
                    ? (language === 'ta' ? 'பதிவு செய்கிறது...' : 'Scheduling...')
                    : (language === 'ta' ? 'அமர்வை உறுதிசெய்' : 'Confirm Session')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE SESSION MODAL */}
      {completingSession && (
        <div className="fixed inset-0 z-50 bg-[#0c263d]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ebe0ce] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ebe0ce]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
                  {language === 'ta' ? 'அமர்வு சரிபார்ப்பு' : 'Session Verification'}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#0c263d]">
                  {language === 'ta' ? 'நிறைவு செய்து நேரக் கடனை மாற்றுக' : 'Complete & Transfer Time Credit'}
                </h3>
              </div>
              <button onClick={() => setCompletingSession(null)} className="text-[#8a431c] hover:text-[#0c263d] font-bold">&times;</button>
            </div>

            <form onSubmit={handleCompleteSession} className="space-y-4">
              <p className="text-xs text-[#703616]">
                {language === 'ta'
                  ? 'இந்த அமர்வை நிறைவு செய்வதன் மூலம் தரவுத்தளத்தில் சரிபார்க்கப்படும். வழிகாட்டிக்கு 1 நேரக் கடன் மாற்றப்படும்.'
                  : 'Completing this session marks it verified in the database. 1 Time Credit will be credited to the mentor.'}
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'அமர்வு குறிப்புகள்' : 'Key Session Notes / Takeaways'}
                </label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder={language === 'ta' ? 'உதா: நடைமுறைப் பயிற்சி, நினைவக மேம்படுத்தல்...' : 'e.g. Covered generator functions, optimized list memory...'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'பின்னூட்டம் / மதிப்பீடு' : 'Feedback / Rating'}
                </label>
                <input
                  type="text"
                  value={sessionFeedback}
                  onChange={(e) => setSessionFeedback(e.target.value)}
                  placeholder={language === 'ta' ? 'உதா: சிறந்த வழிகாட்டல் மற்றும் தெளிவான விளக்கம்!' : 'e.g. Excellent practical clarity and hands-on guidance!'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingSession(null)}
                  className="px-4 py-2 rounded-xl border border-[#ebe0ce] text-xs font-bold text-[#703616]"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="px-5 py-2 rounded-xl bg-[#8a431c] hover:bg-[#a85423] text-white font-bold text-xs shadow disabled:opacity-50"
                >
                  {isCompleting
                    ? (language === 'ta' ? 'செயலாக்குகிறது...' : 'Processing Transfer...')
                    : (language === 'ta' ? 'நிறைவு செய்து கடனை மாற்று' : 'Complete & Transfer Credit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
