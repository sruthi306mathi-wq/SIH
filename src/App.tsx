import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { MentorDiscoveryView } from './components/mentors/MentorDiscoveryView';
import { LearnerDiscoveryView } from './components/mentors/LearnerDiscoveryView';
import { LearningView } from './components/learning/LearningView';
import { RecognitionView } from './components/recognition/RecognitionView';
import { AssessmentView } from './components/assessment/AssessmentView';
import { EvidenceVaultView } from './components/evidence/EvidenceVaultView';
import { SkillProofView } from './components/skillproof/SkillProofView';
import { ChatView } from './components/chat/ChatView';
import { TimeCreditsView } from './components/timecredits/TimeCreditsView';
import { AssessorPortalView } from './components/assessor/AssessorPortalView';
import { AdminPortalView } from './components/admin/AdminPortalView';
import { AIAssistantDrawer } from './components/assistant/AIAssistantDrawer';

function MainApp() {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Full-screen loading state while checking persistent session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0c263d] via-[#123859] to-[#3d1d0c] flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0d9488] via-[#123859] to-[#8a431c] border border-[#f0a876]/40 flex items-center justify-center font-heading font-black text-2xl mb-4 shadow-2xl">
          LX
        </div>
        <div className="w-8 h-8 border-3 border-[#c4682e] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-widest text-[#f0a876] font-semibold">
          {language === 'ta' ? 'LearnX தரவுத்தளத்துடன் இணைகிறது...' : 'Connecting to LearnX Database...'}
        </p>
      </div>
    );
  }

  // Login-First Application Flow: Unauthenticated users MUST see the Login/Register page
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#fcfaf6] flex flex-col text-[#0c263d] theme-marine-brown">
      {/* Top Application Header */}
      <Header
        onOpenAssistant={() => setIsAssistantOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace with Sidebar & Dynamic View */}
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto bg-[#fcfaf6]">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}
          {activeTab === 'mentors' && <MentorDiscoveryView />}
          {activeTab === 'mentors_learners' && <LearnerDiscoveryView />}
          {activeTab === 'learning' && <LearningView />}
          {activeTab === 'recognition' && <RecognitionView setActiveTab={setActiveTab} />}
          {activeTab === 'assessment' && <AssessmentView />}
          {activeTab === 'evidence' && <EvidenceVaultView />}
          {activeTab === 'skillproof' && <SkillProofView />}
          {activeTab === 'chat' && <ChatView />}
          {activeTab === 'timecredits' && <TimeCreditsView />}
          {activeTab === 'assessor' && <AssessorPortalView />}
          {activeTab === 'admin' && <AdminPortalView />}
        </main>
      </div>

      {/* LearnX Conversational AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}

