import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LearnerProfile, MentorProfile, TimeCreditsAccount } from '../types';
import { apiRequest, getStoredToken, setStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  learnerProfile: LearnerProfile | null;
  mentorProfile: MentorProfile | null;
  timeCredits: TimeCreditsAccount;
  unreadNotificationsCount: number;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  switchMode: (mode: 'learner' | 'mentor' | 'assessor' | 'admin') => Promise<void>;
  refreshUser: () => Promise<void>;
  onRealtimeEvent?: (callback: (eventName: string, data: any) => void) => () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);
  const [timeCredits, setTimeCredits] = useState<TimeCreditsAccount>({ balance: 0, total_earned: 0, total_spent: 0 });
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // SSE event listeners
  const [eventListeners, setEventListeners] = useState<Array<(eventName: string, data: any) => void>>([]);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLearnerProfile(null);
      setMentorProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/api/auth/me');
      if (data && data.user) {
        setUser(data.user);
        setLearnerProfile(data.learnerProfile);
        setMentorProfile(data.mentorProfile);
        setTimeCredits(data.timeCredits || { balance: 0, total_earned: 0, total_spent: 0 });
        setUnreadNotificationsCount(data.unreadNotificationsCount || 0);
      } else {
        // No active session in database, clear stored token
        setUser(null);
        setLearnerProfile(null);
        setMentorProfile(null);
        setStoredToken(null);
      }
    } catch (_err) {
      // If token is expired or unauthorized, seamlessly reset to unauthenticated state
      setUser(null);
      setLearnerProfile(null);
      setMentorProfile(null);
      setStoredToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Real-time SSE connection
  useEffect(() => {
    const token = getStoredToken();
    if (!token || !user) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

      eventSource.addEventListener('CONNECTED', () => {
        // Connected to real-time stream
      });

      const handleEvent = (event: MessageEvent, name: string) => {
        try {
          const payload = JSON.parse(event.data);
          eventListeners.forEach(listener => listener(name, payload));
          // Refresh user counters on significant events
          if (['SESSION_COMPLETED', 'MENTOR_REQUEST_UPDATED', 'EVIDENCE_REVIEWED'].includes(name)) {
            refreshUser();
          }
        } catch (e) {
          console.error('Error handling SSE payload:', e);
        }
      };

      eventSource.addEventListener('NEW_CHAT_MESSAGE', (e) => handleEvent(e as MessageEvent, 'NEW_CHAT_MESSAGE'));
      eventSource.addEventListener('MENTOR_REQUEST_RECEIVED', (e) => handleEvent(e as MessageEvent, 'MENTOR_REQUEST_RECEIVED'));
      eventSource.addEventListener('MENTOR_REQUEST_UPDATED', (e) => handleEvent(e as MessageEvent, 'MENTOR_REQUEST_UPDATED'));
      eventSource.addEventListener('SESSION_SCHEDULED', (e) => handleEvent(e as MessageEvent, 'SESSION_SCHEDULED'));
      eventSource.addEventListener('SESSION_COMPLETED', (e) => handleEvent(e as MessageEvent, 'SESSION_COMPLETED'));
      eventSource.addEventListener('EVIDENCE_REVIEWED', (e) => handleEvent(e as MessageEvent, 'EVIDENCE_REVIEWED'));

      eventSource.onerror = () => {
        // SSE disconnected, will auto-reconnect
      };
    } catch (e) {
      console.error('SSE initialization error:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, eventListeners, refreshUser]);

  const onRealtimeEvent = useCallback((callback: (eventName: string, data: any) => void) => {
    setEventListeners(prev => [...prev, callback]);
    return () => {
      setEventListeners(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    await refreshUser();
  };

  const register = async (formData: any) => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    setStoredToken(data.token);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    setStoredToken(null);
    setUser(null);
    setLearnerProfile(null);
    setMentorProfile(null);
  };

  const switchMode = async (mode: 'learner' | 'mentor' | 'assessor' | 'admin') => {
    await apiRequest('/api/auth/switch-mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        learnerProfile,
        mentorProfile,
        timeCredits,
        unreadNotificationsCount,
        isLoading,
        login,
        register,
        logout,
        switchMode,
        refreshUser,
        onRealtimeEvent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
