import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Compass, Award, ShieldCheck, Sparkles, Clock, ArrowRight, UserCheck, AlertCircle, Globe } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const { language: currentLang, toggleLanguage, t } = useLanguage();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [intent, setIntent] = useState<'learn' | 'rpl' | 'mentor' | 'dual'>('learn');
  const [skillsToLearnInput, setSkillsToLearnInput] = useState('Python Programming');
  const [knownSkillsInput, setKnownSkillsInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [availability, setAvailability] = useState('Flexible (Evenings & Weekends)');
  const [learningMode, setLearningMode] = useState('Online 1-on-1');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [yearsExp, setYearsExp] = useState(3);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError(currentLang === 'ta' ? 'தயவுசெய்து மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.' : 'Please provide your email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.message || (currentLang === 'ta' ? 'உள்நுழைவு தோல்வியடைந்தது. விவரங்களைச் சரிபார்க்கவும்.' : 'Login failed. Please verify your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !regEmail || !regPassword) {
      setError(currentLang === 'ta' ? 'முழுப் பெயர், மின்னஞ்சல் மற்றும் கடவுச்சொல் கட்டாயமாகும்.' : 'Full name, email, and password are required.');
      return;
    }

    if (regPassword.length < 6) {
      setError(currentLang === 'ta' ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.' : 'Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== confirmPassword) {
      setError(currentLang === 'ta' ? 'கடவுச்சொற்கள் பொருந்தவில்லை.' : 'Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const skillsToLearn = skillsToLearnInput
        ? skillsToLearnInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const knownSkills = knownSkillsInput
        ? knownSkillsInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await register({
        fullName,
        email: regEmail,
        password: regPassword,
        intent,
        skillsToLearn,
        knownSkills,
        language,
        availability,
        learningMode,
        primaryGoal,
        yearsExp
      });
    } catch (err: any) {
      setError(err.message || (currentLang === 'ta' ? 'பதிவு தோல்வியடைந்தது.' : 'Registration failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf6] flex flex-col lg:flex-row theme-marine-brown">
      {/* Left / Visual Hero Section */}
      <div className="lg:w-1/2 bg-[#0c263d] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles with Marine Brown glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#194a73]/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#703616]/30 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0d9488] via-[#123859] to-[#8a431c] border border-[#f0a876]/40 flex items-center justify-center shadow-lg">
                <span className="font-heading font-black text-2xl tracking-tighter text-white">LX</span>
              </div>
              <div>
                <span className="font-heading text-2xl font-bold tracking-tight text-white">LearnX</span>
                <span className="block text-xs uppercase tracking-widest text-[#f0a876] font-semibold">
                  {currentLang === 'ta' ? 'ஸ்கில்புரூஃப் தொடர் வளர்ச்சி சூழல்' : 'Continuous Growth Ecosystem'}
                </span>
              </div>
            </div>

            {/* Language Switcher Badge on Left Hero */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#3d1d0c] hover:bg-[#542810] border border-[#a85423]/60 text-[#f7cbac] hover:text-white text-xs font-bold transition shadow-sm"
              title={currentLang === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
            >
              <Globe className="w-3.5 h-3.5 text-[#f0a876]" />
              <span>{currentLang === 'ta' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
            </button>
          </div>

          <div className="max-w-xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#123859]/80 text-[#f7cbac] border border-[#8a431c]/50 mb-6">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#f0a876]" />
              {currentLang === 'ta' ? 'அடுத்த தலைமுறை திறன் கட்டமைப்பு' : 'Next-Gen Competency Architecture'}
            </span>
            <h1 className="font-heading text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
              {t('auth.hero_title')}
            </h1>
            <p className="text-base lg:text-lg text-[#ded0bb] leading-relaxed mb-8">
              {t('auth.hero_subtitle')}
            </p>
          </div>
        </div>

        {/* Pathway Highlights */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="p-4 rounded-xl bg-[#123859]/80 border border-[#194a73] backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-[#0e2e49] text-[#2dd4bf] mt-0.5 border border-[#194a73]">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  {t('auth.path_a_title')}
                </h2>
                <p className="text-xs text-[#ded0bb] mt-1">
                  {t('auth.path_a_desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#123859]/80 border border-[#8a431c]/50 backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-[#3d1d0c] text-[#f0a876] mt-0.5 border border-[#8a431c]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  {t('auth.path_b_title')}
                </h2>
                <p className="text-xs text-[#ded0bb] mt-1">
                  {t('auth.path_b_desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#123859]/80 border border-[#194a73] backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-[#703616]/40 text-[#fbeadb] mt-0.5 border border-[#a85423]/60">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  {t('auth.time_credits_title')}
                </h2>
                <p className="text-xs text-[#ded0bb] mt-1">
                  {t('auth.time_credits_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer badges */}
        <div className="relative z-10 pt-6 border-t border-[#194a73] flex items-center justify-between text-xs text-[#ded0bb]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#2dd4bf]" />
            <span>{currentLang === 'ta' ? '4-நிலை SkillProof சரிபார்ப்பு' : '4-Tier SkillProof Verification'}</span>
          </div>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#c4682e]" />
            <span>{currentLang === 'ta' ? 'மெரின் பிரவுன் தீம்' : 'Marine Brown Theme'}</span>
          </span>
        </div>
      </div>

      {/* Right / Authentication Form Section */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center max-w-2xl mx-auto w-full bg-[#fcfaf6]">
        {/* Language switch bar on mobile / right top */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex p-1 rounded-xl bg-[#ebe0ce] border border-[#ded0bb]">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(null); }}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                !isRegisterMode
                  ? 'bg-[#0c263d] text-white shadow'
                  : 'text-[#8a431c] hover:text-[#0c263d]'
              }`}
            >
              {t('auth.sign_in_button')}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(null); }}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                isRegisterMode
                  ? 'bg-[#0c263d] text-white shadow'
                  : 'text-[#8a431c] hover:text-[#0c263d]'
              }`}
            >
              {t('auth.register_button')}
            </button>
          </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#f6efe3] hover:bg-[#ebe0ce] border border-[#ded0bb] text-[#8a431c] text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#c4682e]" />
            <span>{currentLang === 'ta' ? 'English' : 'தமிழ்'}</span>
          </button>
        </div>

        <div className="mb-6">
          <h2 className="font-heading text-3xl font-extrabold text-[#0c263d] tracking-tight">
            {isRegisterMode ? t('auth.create_account_title') : t('auth.sign_in_title')}
          </h2>
          <p className="text-sm text-[#8a431c] mt-1">
            {isRegisterMode
              ? (currentLang === 'ta' ? 'புதிய திறன்களைக் கற்க அல்லது சான்றுகளை நிரூபிக்க பதிவு செய்யுங்கள்.' : 'Register with your credentials to start learning or proving skills.')
              : (currentLang === 'ta' ? 'உங்கள் கற்றல் சுயவிவரம் மற்றும் பதிவுகளை அணுக உள்நுழைக.' : 'Enter your credentials to access your personal profile and records.')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{currentLang === 'ta' ? 'உள்நுழைவு பிழை' : 'Authentication Error'}</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!isRegisterMode ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-2">
                {t('auth.email_label')}
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={t('auth.email_placeholder')}
                className="w-full px-4 py-3 rounded-xl border border-[#ded0bb] bg-white text-[#0c263d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8a431c] focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d]">
                  {t('auth.password_label')}
                </label>
                <button
                  type="button"
                  onClick={() => alert(currentLang === 'ta' ? 'கடவுச்சொல் மீட்டமைப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.' : 'Password reset link sent to your registered email.')}
                  className="text-xs text-[#8a431c] hover:underline font-medium"
                >
                  {currentLang === 'ta' ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot Password?'}
                </button>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#ded0bb] bg-white text-[#0c263d] text-sm focus:outline-none focus:ring-2 focus:ring-[#8a431c] focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0c263d] via-[#123859] to-[#8a431c] hover:opacity-95 text-white font-bold text-sm tracking-wide shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{currentLang === 'ta' ? 'தரவுத்தளத்தில் சரிபார்க்கப்படுகிறது...' : 'Authenticating with Database...'}</span>
              ) : (
                <>
                  <span>{t('auth.sign_in_button')}</span>
                  <ArrowRight className="w-4 h-4 text-[#f0a876]" />
                </>
              )}
            </button>

            {/* Quick Demo Personas */}
            <div className="pt-4 border-t border-[#ebe0ce]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a431c]">
                  ⚡ {t('auth.quick_demo')}
                </span>
                <span className="text-[10px] text-[#703616] font-medium">
                  {currentLang === 'ta' ? 'சுயவிவரத்தைத் தேர்வு செய்க' : 'Click to autofill'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('learner@learnx.org');
                    setLoginPassword('password123');
                  }}
                  className="p-2.5 rounded-xl border border-[#ebe0ce] bg-[#f6efe3] hover:bg-[#ebe0ce] text-left transition flex items-center space-x-2 group cursor-pointer"
                >
                  <span className="text-lg">🎓</span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#0c263d] group-hover:text-[#8a431c] leading-tight truncate">Alex Mercer</p>
                    <p className="text-[10px] text-[#703616] leading-tight">{t('auth.demo_alex')}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('mentor@learnx.org');
                    setLoginPassword('password123');
                  }}
                  className="p-2.5 rounded-xl border border-[#ebe0ce] bg-[#f6efe3] hover:bg-[#ebe0ce] text-left transition flex items-center space-x-2 group cursor-pointer"
                >
                  <span className="text-lg">🧑‍🏫</span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#0c263d] group-hover:text-[#8a431c] leading-tight truncate">Dr. Elena Rostova</p>
                    <p className="text-[10px] text-[#703616] leading-tight">{t('auth.demo_sarah')}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('assessor@learnx.org');
                    setLoginPassword('password123');
                  }}
                  className="p-2.5 rounded-xl border border-[#ebe0ce] bg-[#f6efe3] hover:bg-[#ebe0ce] text-left transition flex items-center space-x-2 group cursor-pointer"
                >
                  <span className="text-lg">⚖️</span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#0c263d] group-hover:text-[#8a431c] leading-tight truncate">Marcus Sterling</p>
                    <p className="text-[10px] text-[#703616] leading-tight">{t('auth.demo_marcus')}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('admin@learnx.org');
                    setLoginPassword('password123');
                  }}
                  className="p-2.5 rounded-xl border border-[#ebe0ce] bg-[#f6efe3] hover:bg-[#ebe0ce] text-left transition flex items-center space-x-2 group cursor-pointer"
                >
                  <span className="text-lg">⚙️</span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#0c263d] group-hover:text-[#8a431c] leading-tight truncate">System Admin</p>
                    <p className="text-[10px] text-[#703616] leading-tight">{t('auth.demo_elena')}</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-[#703616]">
                {t('auth.switch_to_register')}{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="text-[#8a431c] font-bold hover:underline cursor-pointer ml-1"
                >
                  {currentLang === 'ta' ? 'இப்போதே பதிவு செய்' : 'Create one now'}
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {t('auth.full_name_label')} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.full_name_placeholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded0bb] bg-white text-sm text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {t('auth.email_label')} *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded0bb] bg-white text-sm text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {t('auth.password_label')} *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded0bb] bg-white text-sm text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {t('auth.confirm_password_label')} *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded0bb] bg-white text-sm text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>
            </div>

            {/* Primary Intent / Pathway Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-2">
                {currentLang === 'ta' ? 'முதலில் நீங்கள் எதை அடைய விரும்புகிறீர்கள்?' : 'What do you want to accomplish first?'}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIntent('learn')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    intent === 'learn'
                      ? 'border-[#0c263d] bg-[#0c263d]/10 text-[#0c263d] ring-1 ring-[#0c263d]'
                      : 'border-[#ded0bb] bg-white text-[#703616] hover:bg-[#f6efe3]'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center">
                    <Compass className="w-3.5 h-3.5 mr-1 text-[#2dd4bf]" />
                    {currentLang === 'ta' ? 'புதிய திறன் கற்க' : 'Learn a New Skill'}
                  </p>
                  <p className="text-[11px] text-[#703616]/80 mt-0.5">
                    {currentLang === 'ta' ? 'வழிகாட்டிகளிடம் பயில்க' : 'Find mentors & complete projects'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIntent('rpl')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    intent === 'rpl'
                      ? 'border-[#8a431c] bg-[#8a431c]/10 text-[#0c263d] ring-1 ring-[#8a431c]'
                      : 'border-[#ded0bb] bg-white text-[#703616] hover:bg-[#f6efe3]'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center">
                    <Award className="w-3.5 h-3.5 mr-1 text-[#f0a876]" />
                    {currentLang === 'ta' ? 'முன் அனுபவத்தை நிரூபிக்க' : 'Prove Existing Skills'}
                  </p>
                  <p className="text-[11px] text-[#703616]/80 mt-0.5">
                    {currentLang === 'ta' ? 'RPL அங்கீகாரம்' : 'RPL experience recognition'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIntent('mentor')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    intent === 'mentor'
                      ? 'border-[#0c263d] bg-[#0c263d]/10 text-[#0c263d] ring-1 ring-[#0c263d]'
                      : 'border-[#ded0bb] bg-white text-[#703616] hover:bg-[#f6efe3]'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center">
                    <UserCheck className="w-3.5 h-3.5 mr-1 text-[#0c263d]" />
                    {currentLang === 'ta' ? 'வழிகாட்டியாக மாற' : 'Become a Mentor'}
                  </p>
                  <p className="text-[11px] text-[#703616]/80 mt-0.5">
                    {currentLang === 'ta' ? 'கற்பித்து நேரக் கடன் பெறுக' : 'Teach & earn Time Credits'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIntent('dual')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    intent === 'dual'
                      ? 'border-[#0d9488] bg-[#0d9488]/10 text-[#0c263d] ring-1 ring-[#0d9488]'
                      : 'border-[#ded0bb] bg-white text-[#703616] hover:bg-[#f6efe3]'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-[#0d9488]" />
                    {currentLang === 'ta' ? 'கற்பவர் + வழிகாட்டி' : 'Learner + Mentor'}
                  </p>
                  <p className="text-[11px] text-[#703616]/80 mt-0.5">
                    {currentLang === 'ta' ? 'இரு முறைமைகளிலும் பங்கேற்க' : 'Full dual participation'}
                  </p>
                </button>
              </div>
            </div>

            {/* Dynamic fields based on intent */}
            {intent === 'learn' || intent === 'dual' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                  {currentLang === 'ta' ? 'நீங்கள் கற்க விரும்பும் முதன்மைத் திறன்' : 'Primary Skill You Want to Learn'}
                </label>
                <input
                  type="text"
                  value={skillsToLearnInput}
                  onChange={(e) => setSkillsToLearnInput(e.target.value)}
                  placeholder="e.g. Python Programming, React Architecture"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded0bb] bg-white text-sm text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                />
              </div>
            ) : null}

            {intent === 'rpl' || intent === 'mentor' || intent === 'dual' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                    {currentLang === 'ta' ? 'நீங்கள் அறிந்த / கற்பிக்கும் திறன்கள்' : 'Skills You Already Know / Teach'}
                  </label>
                  <input
                    type="text"
                    value={knownSkillsInput}
                    onChange={(e) => setKnownSkillsInput(e.target.value)}
                    placeholder="e.g. Python, SQL, System Design"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded0bb] bg-white text-sm text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0c263d] mb-1.5">
                    {currentLang === 'ta' ? 'நடைமுறை அனுபவ ஆண்டுகள்' : 'Years of Practical Experience'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded0bb] bg-white text-sm text-[#0c263d] focus:ring-2 focus:ring-[#8a431c] focus:outline-none"
                  />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                  {currentLang === 'ta' ? 'மொழி' : 'Language'}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d]"
                >
                  <option value="Tamil">தமிழ் (Tamil)</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="German">German</option>
                  <option value="French">French</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                  {currentLang === 'ta' ? 'கிடைக்கும் நேரம்' : 'Availability'}
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d]"
                >
                  <option value="Flexible (Evenings & Weekends)">{currentLang === 'ta' ? 'நெகிழ்வான நேரம்' : 'Flexible'}</option>
                  <option value="Weekdays Daytime">{currentLang === 'ta' ? 'வார நாட்கள்' : 'Weekdays'}</option>
                  <option value="Weekends Only">{currentLang === 'ta' ? 'வார இறுதி மட்டும்' : 'Weekends Only'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0c263d] mb-1">
                  {currentLang === 'ta' ? 'கற்றல் வடிவம்' : 'Learning Mode'}
                </label>
                <select
                  value={learningMode}
                  onChange={(e) => setLearningMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ded0bb] bg-white text-xs text-[#0c263d]"
                >
                  <option value="Online 1-on-1">{currentLang === 'ta' ? 'நேரடி 1-on-1' : 'Online 1-on-1'}</option>
                  <option value="Project Coaching">{currentLang === 'ta' ? 'திட்டப் பயிற்சி' : 'Project Coaching'}</option>
                  <option value="Self-Paced with Reviews">{currentLang === 'ta' ? 'சுய கற்றல்' : 'Self-Paced'}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0c263d] via-[#123859] to-[#8a431c] hover:opacity-95 text-white font-bold text-sm tracking-wide shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{currentLang === 'ta' ? 'கணக்கு உருவாக்கப்படுகிறது...' : 'Creating User Record & Profile...'}</span>
              ) : (
                <>
                  <span>{currentLang === 'ta' ? 'கணக்கு தொடங்கி 3 தொடக்கக் கடன்களைப் பெறுக' : 'Create Account & Claim 3 Starter Credits'}</span>
                  <ArrowRight className="w-4 h-4 text-[#f0a876]" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

