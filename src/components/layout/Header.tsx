import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Clock,
  Bell,
  Sparkles,
  LogOut,
  ChevronDown,
  UserCheck,
  Compass,
  Award,
  Shield,
  Layers,
  Globe
} from 'lucide-react';

interface HeaderProps {
  onOpenAssistant: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAssistant, setActiveTab }) => {
  const { user, timeCredits, unreadNotificationsCount, switchMode, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 bg-[#0c263d] text-white border-b border-[#194a73] px-4 lg:px-8 py-3 flex items-center justify-between shadow-md">
      {/* Brand & Active Mode */}
      <div className="flex items-center space-x-4 lg:space-x-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-3 text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d9488] via-[#123859] to-[#8a431c] border border-[#f0a876]/40 flex items-center justify-center shadow">
            <span className="font-heading font-black text-lg text-white">LX</span>
          </div>
          <div>
            <span className="font-heading text-lg font-bold tracking-tight text-white flex items-center">
              LearnX
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#f0a876] font-semibold block -mt-1">
              {t('app.tagline')}
            </span>
          </div>
        </button>

        {/* Marine Brown Theme Pill Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#123859]/70 border border-[#8a431c]/50 text-[10px] font-semibold text-[#f7cbac]">
          <span className="w-2 h-2 rounded-full bg-[#c4682e] animate-pulse" />
          <span>{language === 'ta' ? 'மெரின் பிரவுன்' : 'Marine Brown'}</span>
        </div>

        {/* Mode Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#123859] hover:bg-[#194a73] border border-[#194a73] text-xs font-semibold text-[#f6efe3] transition"
          >
            {user.active_mode === 'learner' && <Compass className="w-3.5 h-3.5 text-[#2dd4bf]" />}
            {user.active_mode === 'mentor' && <UserCheck className="w-3.5 h-3.5 text-[#f0a876]" />}
            {user.active_mode === 'assessor' && <Award className="w-3.5 h-3.5 text-[#38bdf8]" />}
            {user.active_mode === 'admin' && <Shield className="w-3.5 h-3.5 text-[#c084fc]" />}
            <span>
              {user.active_mode === 'learner' && t('header.learner_mode')}
              {user.active_mode === 'mentor' && t('header.mentor_mode')}
              {user.active_mode === 'assessor' && t('header.assessor_mode')}
              {user.active_mode === 'admin' && t('header.admin_mode')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#ded0bb]" />
          </button>

          {showModeDropdown && (
            <div className="absolute left-0 mt-2 w-56 bg-[#0c263d] border border-[#8a431c]/50 rounded-xl shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 border-b border-[#194a73] text-[10px] font-bold uppercase tracking-wider text-[#f0a876]">
                {t('header.switch_mode')}
              </div>
              <button
                onClick={() => { switchMode('learner'); setShowModeDropdown(false); }}
                className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center space-x-2 hover:bg-[#123859] ${
                  user.active_mode === 'learner' ? 'text-[#2dd4bf] font-bold bg-[#123859]/50' : 'text-[#f6efe3]'
                }`}
              >
                <Compass className="w-4 h-4 text-[#2dd4bf]" />
                <div>
                  <p>{t('header.learner_mode')}</p>
                  <p className="text-[10px] text-[#ded0bb]">{t('header.learner_desc')}</p>
                </div>
              </button>
              <button
                onClick={() => { switchMode('mentor'); setShowModeDropdown(false); }}
                className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center space-x-2 hover:bg-[#123859] ${
                  user.active_mode === 'mentor' ? 'text-[#f0a876] font-bold bg-[#123859]/50' : 'text-[#f6efe3]'
                }`}
              >
                <UserCheck className="w-4 h-4 text-[#f0a876]" />
                <div>
                  <p>{t('header.mentor_mode')}</p>
                  <p className="text-[10px] text-[#ded0bb]">{t('header.mentor_desc')}</p>
                </div>
              </button>
              <button
                onClick={() => { switchMode('assessor'); setShowModeDropdown(false); }}
                className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center space-x-2 hover:bg-[#123859] ${
                  user.active_mode === 'assessor' ? 'text-[#38bdf8] font-bold bg-[#123859]/50' : 'text-[#f6efe3]'
                }`}
              >
                <Award className="w-4 h-4 text-[#38bdf8]" />
                <div>
                  <p>{t('header.assessor_mode')}</p>
                  <p className="text-[10px] text-[#ded0bb]">{t('header.assessor_desc')}</p>
                </div>
              </button>
              <button
                onClick={() => { switchMode('admin'); setShowModeDropdown(false); }}
                className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center space-x-2 hover:bg-[#123859] ${
                  user.active_mode === 'admin' ? 'text-[#c084fc] font-bold bg-[#123859]/50' : 'text-[#f6efe3]'
                }`}
              >
                <Shield className="w-4 h-4 text-[#c084fc]" />
                <div>
                  <p>{t('header.admin_mode')}</p>
                  <p className="text-[10px] text-[#ded0bb]">{t('header.admin_desc')}</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Language Switcher Button (Tamil / English) */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#3d1d0c] hover:bg-[#542810] border border-[#a85423]/60 text-[#f7cbac] hover:text-white text-xs font-bold transition shadow-sm"
          title={language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
        >
          <Globe className="w-3.5 h-3.5 text-[#f0a876]" />
          <span>{language === 'ta' ? 'தமிழ்' : 'English'}</span>
        </button>

        {/* Time Credits Badge in Warm Marine Brown */}
        <button
          onClick={() => setActiveTab('timecredits')}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#703616]/30 hover:bg-[#703616]/50 border border-[#a85423]/60 text-[#fbeadb] text-xs font-bold transition shadow-sm"
          title="Your real-time Time Credit balance"
        >
          <Clock className="w-3.5 h-3.5 text-[#f0a876]" />
          <span>{timeCredits.balance} {language === 'ta' ? 'நேரக் கடன்' : 'Time Credits'}</span>
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={onOpenAssistant}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0d9488] via-[#194a73] to-[#8a431c] hover:opacity-90 text-white text-xs font-bold transition shadow"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#f0a876]" />
          <span className="hidden sm:inline">{language === 'ta' ? 'AI உதவி' : 'LearnX AI'}</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="p-2 rounded-lg bg-[#123859] hover:bg-[#194a73] text-[#f6efe3] relative transition"
          title={t('header.notifications')}
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f43f5e] ring-2 ring-[#0c263d]" />
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-lg bg-[#123859] hover:bg-[#194a73] border border-[#194a73] transition"
          >
            <div className="w-6 h-6 rounded-full bg-[#8a431c] text-white font-bold text-xs flex items-center justify-center border border-[#f0a876]">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-white max-w-[120px] truncate hidden sm:inline">
              {user.full_name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#ded0bb]" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0c263d] border border-[#8a431c]/50 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-[#194a73]">
                <p className="text-xs font-bold text-white">{user.full_name}</p>
                <p className="text-[11px] text-[#ded0bb] truncate">{user.email}</p>
                <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#194a73] text-[#f0a876]">
                  {user.role.toUpperCase()} &bull; {user.active_mode.toUpperCase()}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setActiveTab('dashboard'); setShowUserDropdown(false); }}
                  className="w-full px-4 py-2 text-left text-xs text-[#f6efe3] hover:bg-[#123859] flex items-center space-x-2"
                >
                  <Layers className="w-3.5 h-3.5 text-[#2dd4bf]" />
                  <span>{t('header.my_dashboard')}</span>
                </button>
                <button
                  onClick={() => { setActiveTab('timecredits'); setShowUserDropdown(false); }}
                  className="w-full px-4 py-2 text-left text-xs text-[#f6efe3] hover:bg-[#123859] flex items-center space-x-2"
                >
                  <Clock className="w-3.5 h-3.5 text-[#f0a876]" />
                  <span>{t('header.time_ledger')}</span>
                </button>
              </div>

              <div className="border-t border-[#194a73] pt-1">
                <button
                  onClick={() => { logout(); setShowUserDropdown(false); }}
                  className="w-full px-4 py-2 text-left text-xs text-red-300 hover:bg-red-950/40 flex items-center space-x-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('header.sign_out')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

