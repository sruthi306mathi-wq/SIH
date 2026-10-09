import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../api/client';
import { AlertTriangle } from 'lucide-react';
import { LearnerDashboardView } from './LearnerDashboardView';
import { MentorDashboardView } from './MentorDashboardView';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onOpenAssistant: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, onOpenAssistant }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await apiRequest('/api/dashboard');
      if (res && typeof res === 'object') {
        setData(res);
      }
    } catch (e: any) {
      console.error('Failed to load dashboard:', e);
      setLoadError(e.message || (language === 'ta' ? 'டாஷ்போர்டை ஏற்ற முடியவில்லை.' : 'Failed to load user dashboard.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  if ((isLoading && !data) || (!data && !loadError)) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] theme-marine-brown">
        <div className="flex flex-col items-center space-y-3 text-[#703616]">
          <div className="w-8 h-8 border-3 border-[#8a431c] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">
            {language === 'ta' ? 'LearnX தரவுகளை ஏற்றுகிறது...' : 'Loading your real-time LearnX records...'}
          </p>
        </div>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] theme-marine-brown">
        <div className="p-6 rounded-2xl bg-white border border-red-200 shadow-sm max-w-md text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="font-heading text-lg font-bold text-[#0c263d]">
            {language === 'ta' ? 'டாஷ்போர்டை ஏற்ற முடியவில்லை' : 'Unable to Load Dashboard'}
          </h3>
          <p className="text-xs text-[#703616]">{loadError}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-xl bg-[#0c263d] text-white text-xs font-bold hover:bg-[#123859] transition cursor-pointer"
          >
            {language === 'ta' ? 'மீண்டும் முயற்சிக்க' : 'Retry Loading'}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Strict UI/UX Separation: Mentor and Learner dashboards have completely different information architectures
  const isMentor = data?.activeMode === 'mentor' || user?.active_mode === 'mentor';

  if (isMentor) {
    return (
      <MentorDashboardView
        data={data}
        setActiveTab={setActiveTab}
        onRefresh={fetchDashboard}
      />
    );
  }

  return (
    <LearnerDashboardView
      data={data}
      setActiveTab={setActiveTab}
      onOpenAssistant={onOpenAssistant}
      onRefresh={fetchDashboard}
    />
  );
};
