import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Layers,
  Compass,
  BookOpen,
  Award,
  CheckCircle2,
  FolderLock,
  ShieldCheck,
  MessageSquare,
  Clock,
  UserCheck,
  BarChart3,
  Calendar,
  Users
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  if (!user) return null;

  const isMentorMode = user.active_mode === 'mentor';
  const isAssessorMode = user.active_mode === 'assessor';
  const isAdminMode = user.active_mode === 'admin';

  return (
    <aside className="w-64 bg-[#fcfaf6] border-r border-[#ebe0ce] flex flex-col justify-between p-4 flex-shrink-0 min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        {/* Core Navigation Section */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8a431c] mb-2">
            {isMentorMode ? t('sidebar.mentor_workspace') : t('sidebar.learner_workspace')}
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                  : 'text-[#0c263d] hover:bg-[#f6efe3]'
              }`}
            >
              <Layers className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-[#f0a876]' : 'text-[#8a431c]'}`} />
              <span>{isMentorMode ? t('sidebar.mentor_dashboard') : t('sidebar.learner_dashboard')}</span>
            </button>
          </nav>
        </div>

        {/* Mentor Opportunities (Shown prominently in Mentor Mode) */}
        {isMentorMode ? (
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#a85423] mb-2 flex items-center justify-between">
              <span>{t('sidebar.teaching_mentees')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c4682e]" />
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('mentors_learners')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'mentors_learners'
                    ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                    : 'text-[#0c263d] hover:bg-[#f6efe3]'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'mentors_learners' ? 'text-[#f0a876]' : 'text-[#8a431c]'}`} />
                <span>{t('sidebar.find_learners')}</span>
              </button>

              <button
                onClick={() => setActiveTab('learning')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'learning'
                    ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                    : 'text-[#0c263d] hover:bg-[#f6efe3]'
                }`}
              >
                <Calendar className={`w-4 h-4 ${activeTab === 'learning' ? 'text-[#f0a876]' : 'text-[#8a431c]'}`} />
                <span>{t('sidebar.teaching_sessions')}</span>
              </button>
            </nav>
          </div>
        ) : (
          /* Path A Navigation (Learner Mode) */
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#0e2e49] mb-2 flex items-center justify-between">
              <span>{t('sidebar.path_a_title')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#194a73]" />
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('mentors')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'mentors'
                    ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                    : 'text-[#0c263d] hover:bg-[#f6efe3]'
                }`}
              >
                <Compass className={`w-4 h-4 ${activeTab === 'mentors' ? 'text-[#2dd4bf]' : 'text-[#194a73]'}`} />
                <span>{t('sidebar.find_mentor')}</span>
              </button>

              <button
                onClick={() => setActiveTab('learning')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'learning'
                    ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                    : 'text-[#0c263d] hover:bg-[#f6efe3]'
                }`}
              >
                <BookOpen className={`w-4 h-4 ${activeTab === 'learning' ? 'text-[#2dd4bf]' : 'text-[#194a73]'}`} />
                <span>{t('sidebar.learning_plans')}</span>
              </button>
            </nav>
          </div>
        )}

        {/* Path B: Skill Recognition (Available in both modes) */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8a431c] mb-2 flex items-center justify-between">
            <span>{t('sidebar.path_b_title')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#c4682e]" />
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('recognition')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'recognition'
                  ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                  : 'text-[#0c263d] hover:bg-[#f6efe3]'
              }`}
            >
              <Award className={`w-4 h-4 ${activeTab === 'recognition' ? 'text-[#f0a876]' : 'text-[#8a431c]'}`} />
              <span>{t('sidebar.declare_rpl')}</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'evidence'
                  ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                  : 'text-[#0c263d] hover:bg-[#f6efe3]'
              }`}
            >
              <FolderLock className={`w-4 h-4 ${activeTab === 'evidence' ? 'text-[#f0a876]' : 'text-[#8a431c]'}`} />
              <span>{t('sidebar.evidence_vault')}</span>
            </button>
          </nav>
        </div>

        {/* Verification & Proof */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8a431c]/80 mb-2">
            {t('sidebar.verification_title')}
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('assessment')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'assessment'
                  ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                  : 'text-[#0c263d] hover:bg-[#f6efe3]'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${activeTab === 'assessment' ? 'text-[#f0a876]' : 'text-[#8a431c]'}`} />
              <span>{t('sidebar.practical_assessments')}</span>
            </button>

            <button
              onClick={() => setActiveTab('skillproof')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'skillproof'
                  ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                  : 'text-[#0c263d] hover:bg-[#f6efe3]'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'skillproof' ? 'text-[#f0a876]' : 'text-[#8a431c]'}`} />
              <span>{t('sidebar.skillproof_certs')}</span>
            </button>
          </nav>
        </div>

        {/* Exchange & Collaboration */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8a431c]/80 mb-2">
            {t('sidebar.collaboration_title')}
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                  : 'text-[#0c263d] hover:bg-[#f6efe3]'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeTab === 'chat' ? 'text-[#f0a876]' : 'text-[#8a431c]'}`} />
              <span>{t('sidebar.live_messenger')}</span>
            </button>

            <button
              onClick={() => setActiveTab('timecredits')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'timecredits'
                  ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                  : 'text-[#0c263d] hover:bg-[#f6efe3]'
              }`}
            >
              <Clock className={`w-4 h-4 ${activeTab === 'timecredits' ? 'text-[#f0a876]' : 'text-[#8a431c]'}`} />
              <span>{t('sidebar.time_credits_ledger')}</span>
            </button>
          </nav>
        </div>

        {/* Staff Portals */}
        {(isAssessorMode || isAdminMode || user.role === 'assessor' || user.role === 'admin') && (
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#194a73] mb-2">
              {t('sidebar.staff_portals')}
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('assessor')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'assessor'
                    ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                    : 'text-[#0c263d] hover:bg-[#f6efe3]'
                }`}
              >
                <UserCheck className={`w-4 h-4 ${activeTab === 'assessor' ? 'text-[#38bdf8]' : 'text-[#194a73]'}`} />
                <span>{t('sidebar.assessor_queue')}</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'admin'
                    ? 'bg-[#0c263d] text-white shadow-sm border-l-4 border-[#c4682e]'
                    : 'text-[#0c263d] hover:bg-[#f6efe3]'
                }`}
              >
                <BarChart3 className={`w-4 h-4 ${activeTab === 'admin' ? 'text-[#38bdf8]' : 'text-[#194a73]'}`} />
                <span>{t('sidebar.admin_ops')}</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#ebe0ce] text-[11px] text-[#8a431c]">
        <div className="p-2.5 rounded-xl bg-[#f6efe3] border border-[#ebe0ce]">
          <p className="font-bold text-[#0c263d]">
            {isMentorMode ? (user.active_mode === 'mentor' ? 'வழிகாட்டி முறைமை' : 'Mentor Active') : (user.active_mode === 'learner' ? 'கற்பவர் முறைமை' : 'Learner Active')}
          </p>
          <p className="text-[10px] text-[#703616] mt-0.5 leading-relaxed">
            {isMentorMode ? t('sidebar.footer_mentor') : t('sidebar.footer_learner')}
          </p>
        </div>
      </div>
    </aside>
  );
};

