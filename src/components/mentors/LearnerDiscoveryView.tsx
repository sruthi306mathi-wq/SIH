import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import {
  Users,
  Search,
  Sparkles,
  Send,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  BookOpen
} from 'lucide-react';

export const LearnerDiscoveryView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [learners, setLearners] = useState<any[]>([]);
  const [mentorSkills, setMentorSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSkill, setFilterSkill] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  // Offer modal state
  const [selectedLearner, setSelectedLearner] = useState<any | null>(null);
  const [offerSkill, setOfferSkill] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchLearners = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterSkill) params.append('skill', filterSkill);
      if (filterLevel) params.append('level', filterLevel);

      const res = await apiRequest(`/api/mentors/learners/discover?${params.toString()}`);
      setLearners(res.learners || []);
      setMentorSkills(res.mentorSkillsTaught || []);
    } catch (e) {
      console.error('Failed to load learners:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLearners();
  }, [filterSkill, filterLevel]);

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearner || !offerSkill) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/api/mentors/offer-mentoring', {
        method: 'POST',
        body: JSON.stringify({
          learnerId: selectedLearner.learner_id,
          skillName: offerSkill,
          offerNotes
        })
      });
      setSuccessMsg(
        language === 'ta'
          ? `${selectedLearner.full_name} அவர்களுக்கு வழிகாட்டல் அழைப்பு அனுப்பப்பட்டது!`
          : `Mentorship invitation delivered to ${selectedLearner.full_name}!`
      );
      setSelectedLearner(null);
      setOfferNotes('');
      fetchLearners();
    } catch (err: any) {
      alert(err.message || (language === 'ta' ? 'அழைப்பை அனுப்ப முடியவில்லை.' : 'Failed to send offer.'));
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
            {language === 'ta' ? 'வழிகாட்டி வாய்ப்பு மையம்' : 'Mentor Opportunity Hub'}
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0c263d] mt-1">
            {language === 'ta' ? 'உங்கள் திறன் தேவைப்படும் மாணவர்களைக் கண்டறியவும்' : 'Find Learners Who Need Your Skills'}
          </h1>
          <p className="text-sm text-[#703616] mt-1">
            {language === 'ta'
              ? `நீங்கள் கற்பிக்கும் திறன்களின் அடிப்படையில் AI பொருத்த சதவீதம் மூலம் தரவரிசைப்படுத்தப்பட்ட மாணவர்கள் (${mentorSkills.join(', ') || 'உங்கள் திறன்கள்'}).`
              : `Real registered learners ranked by AI match percentage based on the skills you teach (${mentorSkills.join(', ') || 'Your skills'}).`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8a431c] absolute left-3 top-3" />
            <input
              type="text"
              placeholder={language === 'ta' ? 'மாணவர் திறன்/இலக்கு மூலம் தேடுக...' : 'Search by learner skill/goal...'}
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
            />
          </div>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
          >
            <option value="">{language === 'ta' ? 'அனைத்து நிலைகளும்' : 'All Levels'}</option>
            <option value="Beginner">{language === 'ta' ? 'தொடக்க நிலை (Beginner)' : 'Beginner'}</option>
            <option value="Intermediate">{language === 'ta' ? 'இடைநிலை (Intermediate)' : 'Intermediate'}</option>
            <option value="Advanced">{language === 'ta' ? 'மேம்பட்ட நிலை (Advanced)' : 'Advanced'}</option>
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-900">&times;</button>
        </div>
      )}

      {/* Learners Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-[#703616]">
          <div className="w-8 h-8 border-3 border-[#8a431c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">
            {language === 'ta' ? 'மாணவர்களை AI ஆய்வு செய்கிறது...' : 'Running AI prediction across registered learners...'}
          </p>
        </div>
      ) : learners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learners.map((learner) => (
            <div
              key={learner.learner_id}
              className="p-6 rounded-2xl bg-white border border-[#ebe0ce] hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8a431c] to-[#0c263d] text-white font-black text-lg flex items-center justify-center shadow">
                      {learner.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-[#0c263d]">{learner.full_name}</h3>
                      <p className="text-xs text-[#703616]">
                        {learner.language || 'English'} &bull; {learner.preferred_mode || 'Online'}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-[#f6efe3] text-[#8a431c] border border-[#ebe0ce]">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {learner.matchPercentage}% {language === 'ta' ? 'பொருத்தம்' : 'Match'}
                  </span>
                </div>

                {/* AI Rationale */}
                <div className="p-3 rounded-xl bg-[#fcfaf6] border border-[#ebe0ce] mb-4">
                  <p className="text-[11px] text-[#0c263d] leading-relaxed">
                    <span className="font-bold text-[#8a431c]">
                      {language === 'ta' ? 'ஏன் இந்த மாணவர்? ' : 'Why this learner? '}
                    </span>
                    {learner.matchRationale}
                  </p>
                </div>

                {/* Requirements */}
                <div className="space-y-2 text-xs text-[#703616] mb-4">
                  <div>
                    <span className="font-bold text-[#0c263d]">{language === 'ta' ? 'தற்போதைய இலக்கு: ' : 'Current Goal: '}</span>
                    <span>{learner.primary_goal}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#0c263d]">{language === 'ta' ? 'கற்றல் பாதை: ' : 'Trajectory: '}</span>
                    <span>{learner.current_level} &rarr; {learner.target_level}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#0c263d]">{language === 'ta' ? 'விரும்பும் திறன்கள்: ' : 'Skills Desired: '}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {learner.skills_to_learn?.map((s: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-[#f6efe3] text-[#8a431c] text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#ebe0ce] flex items-center justify-between">
                <span className="text-[10px] text-[#703616] font-mono">
                  {language === 'ta' ? 'இணைந்தது: ' : 'Joined: '} {new Date(learner.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    setSelectedLearner(learner);
                    setOfferSkill(learner.skills_to_learn?.[0] || mentorSkills[0] || 'Python Programming');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0c263d] hover:bg-[#123859] text-white font-bold text-xs flex items-center space-x-1.5 transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'வழிகாட்டல் வழங்குக' : 'Offer Mentoring'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-white border border-[#ebe0ce] text-center max-w-lg mx-auto shadow-sm">
          <Users className="w-12 h-12 text-[#ded0bb] mx-auto mb-3" />
          <h2 className="font-heading text-lg font-bold text-[#0c263d]">
            {language === 'ta' ? 'உங்கள் திறன்களுக்குப் பொருந்தும் மாணவர்கள் தற்போது இல்லை' : 'No learners currently match your skills'}
          </h2>
          <p className="text-xs text-[#703616] mt-1.5 leading-relaxed">
            {language === 'ta'
              ? 'மாணவர்களின் தேவைகள் உங்கள் பாடங்களுடன் பொருந்தும்போது இங்கு தோன்றுவார்கள். மேலும் தலைப்புகளைச் சேர்க்க உங்கள் வழிகாட்டி சுயவிவரத்தைப் புதுப்பிக்கவும்.'
              : 'Registered learners will populate here in real-time as their goals align with what you teach. Try updating your mentor profile to add more topics you can coach.'}
          </p>
        </div>
      )}

      {/* OFFER MENTORING MODAL */}
      {selectedLearner && (
        <div className="fixed inset-0 z-50 bg-[#0c263d]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ebe0ce] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ebe0ce]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a431c]">
                  {language === 'ta' ? 'வழிகாட்டி அழைப்பு' : 'Mentor Invitation'}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#0c263d]">
                  {language === 'ta' ? `${selectedLearner.full_name} அவர்களுக்கு வழிகாட்டல் வழங்குங்கள்` : `Offer Mentorship to ${selectedLearner.full_name}`}
                </h3>
              </div>
              <button onClick={() => setSelectedLearner(null)} className="text-[#8a431c] hover:text-[#0c263d] font-bold">&times;</button>
            </div>

            <form onSubmit={handleSendOffer} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#fcfaf6] border border-[#ebe0ce] text-xs space-y-1">
                <p><span className="font-bold text-[#0c263d]">{language === 'ta' ? 'மாணவர் இலக்கு:' : 'Learner Goal:'}</span> {selectedLearner.primary_goal}</p>
                <p><span className="font-bold text-[#0c263d]">{language === 'ta' ? 'நிலை:' : 'Level:'}</span> {selectedLearner.current_level} &rarr; {selectedLearner.target_level}</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'வழிகாட்ட விரும்பும் திறன் *' : 'Skill You Wish to Guide *'}
                </label>
                <input
                  type="text"
                  required
                  value={offerSkill}
                  onChange={(e) => setOfferSkill(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {language === 'ta' ? 'அழைப்புச் செய்தி / குறிப்பு' : 'Message / Invitation Note'}
                </label>
                <textarea
                  rows={3}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder={language === 'ta' ? 'வணக்கம்! நீங்கள் பைதான் கற்றுக்கொள்வதைக் கண்டேன். நடைமுறைப் பயிற்சிகளுக்கு உதவ மகிழ்ச்சியடைகிறேன்.' : 'e.g. Hello! I noticed you are learning Python. I would be happy to host a 1-on-1 session to walk you through hands-on exercises.'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe0ce] bg-white text-xs text-[#0c263d]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLearner(null)}
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
                    ? (language === 'ta' ? 'அனுப்புகிறது...' : 'Sending Invitation...')
                    : (language === 'ta' ? 'வழிகாட்டல் அழைப்பை அனுப்பு' : 'Send Mentorship Offer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
