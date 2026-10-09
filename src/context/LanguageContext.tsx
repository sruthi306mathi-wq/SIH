import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ta' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ta: {
    // Brand & Header
    'app.name': 'LearnX',
    'app.tagline': 'ஸ்கில்புரூஃப் சூழல்',
    'header.switch_mode': 'முறைமையை மாற்றுக',
    'header.learner_mode': 'கற்பவர் முறைமை',
    'header.learner_desc': 'திறன்களைக் கற்று சான்றிதழ் பெறுங்கள்',
    'header.mentor_mode': 'வழிகாட்டி முறைமை',
    'header.mentor_desc': 'கற்பித்து நேரக் கடன் ஈட்டுங்கள்',
    'header.assessor_mode': 'மதிப்பீட்டாளர் போர்டல்',
    'header.assessor_desc': 'சான்றுகளைச் சரிபார்க்கவும்',
    'header.admin_mode': 'நிர்வாக மையம்',
    'header.admin_desc': 'தரவுத்தளம் & தணிக்கை அளவீடுகள்',
    'header.time_credits': 'நேரக் கடன்கள் (Time Credits)',
    'header.ai_assistant': 'LearnX AI உதவியாளர்',
    'header.my_dashboard': 'எனது டாஷ்போர்டு',
    'header.time_ledger': 'நேரக் கடன் கணக்கேடு',
    'header.sign_out': 'வெளியேறு (Sign Out)',
    'header.notifications': 'அறிவிப்புகள்',
    'header.lang_switch': 'English',

    // Sidebar
    'sidebar.learner_workspace': 'கற்பவர் பணியிடம்',
    'sidebar.mentor_workspace': 'வழிகாட்டி பணியிடம்',
    'sidebar.learner_dashboard': 'கற்பவர் டாஷ்போர்டு',
    'sidebar.mentor_dashboard': 'வழிகாட்டி டாஷ்போர்டு',
    'sidebar.teaching_mentees': 'கற்பித்தல் & மாணவர்கள்',
    'sidebar.find_learners': 'பொருத்தமான கற்பவர்களைக் கண்டறிக',
    'sidebar.teaching_sessions': 'கற்பித்தல் அமர்வுகள் & திட்டங்கள்',
    'sidebar.path_a_title': 'பாதை A: புதிய திறன் கற்றல்',
    'sidebar.find_mentor': 'வழிகாட்டியைத் தேர்ந்தெடுக்கவும்',
    'sidebar.learning_plans': 'கற்றல் திட்டங்கள் & அமர்வுகள்',
    'sidebar.path_b_title': 'பாதை B: முன் அனுபவ அங்கீகாரம்',
    'sidebar.declare_rpl': 'முன் அனுபவத்தை அறிவிக்கவும் (RPL)',
    'sidebar.evidence_vault': 'சான்றுகள் பெட்டகம் (Vault)',
    'sidebar.verification_title': 'சரிபார்ப்பு & சான்றுகள்',
    'sidebar.practical_assessments': 'நடைமுறைத் தேர்வுகள்',
    'sidebar.skillproof_certs': 'திறன் சான்றிதழ்கள் (SkillProof)',
    'sidebar.collaboration_title': 'பகிர்வு & செய்திப் பரிமாற்றம்',
    'sidebar.live_messenger': 'நேரலை அரட்டை (Live Chat)',
    'sidebar.time_credits_ledger': 'நேரக் கடன்கள் கணக்கேடு',
    'sidebar.staff_portals': 'நிர்வாக போர்ட்டல்கள்',
    'sidebar.assessor_queue': 'மதிப்பீட்டாளர் தணிக்கை வரிசை',
    'sidebar.admin_ops': 'நிர்வாகச் செயல்பாடுகள்',
    'sidebar.footer_learner': 'சரிபார்க்கப்பட்ட வழிகாட்டிகளிடம் கற்க நேரக் கடன்களைப் பயன்படுத்துங்கள்.',
    'sidebar.footer_mentor': 'மாணவர்களுக்குக் கற்பித்து நேரக் கடன்களைச் சம்பாதியுங்கள்.',

    // Common Actions
    'action.upload': 'பதிவேற்று',
    'action.upload_evidence': 'புதிய சான்றைப் பதிவேற்றுக',
    'action.submit': 'சமர்ப்பிக்கவும்',
    'action.submit_for_review': 'தணிக்கைக்கு சமர்ப்பி',
    'action.cancel': 'ரத்து செய்',
    'action.save': 'சேமிக்க',
    'action.close': 'மூடுக',
    'action.search': 'தேடுக...',
    'action.filter': 'வடிகட்டுக',
    'action.view_all': 'அனைத்தையும் பார்',
    'action.book_session': 'அமர்வு முன்பதிவு',
    'action.message': 'செய்தி அனுப்பு',
    'action.approve': 'ஒப்புதல் அளி',
    'action.reject': 'நிராகரி',
    'action.request_revision': 'திருத்தம் கோருக',
    'action.start_assessment': 'தேர்வைத் தொடங்கு',
    'action.view_certificate': 'சான்றிதழைப் பார்',
    'action.download': 'பதிவிறக்கு',
    'action.share': 'பகிர்',
    'action.transfer_credits': 'நேரக் கடன் மாற்று',

    // Statuses
    'status.verified': 'சரிபார்க்கப்பட்டது',
    'status.pending': 'மதிப்பாய்வில் உள்ளது',
    'status.revision': 'மறுஆய்வு தேவை',
    'status.completed': 'நிறைவுற்றது',
    'status.in_progress': 'செயலில் உள்ளது',
    'status.not_started': 'தொடங்கப்படவில்லை',
    'status.approved': 'ஏற்றுக்கொள்ளப்பட்டது',

    // Login & Register
    'auth.hero_title': 'கற்க. நிரூபிக்க. வளர.',
    'auth.hero_subtitle': 'சரிபார்க்கப்பட்ட வழிகாட்டிகளுடன் புதிய திறன்களைக் கற்றுக்கொள்ளுங்கள், உங்கள் முன் அனுபவத்தை (RPL) நிரூபியுங்கள், மேலும் சரிபார்க்கத்தக்க SkillProof சான்றிதழ்களைப் பெறுங்கள்.',
    'auth.path_a_title': 'பாதை A — புதிய திறன் கற்றல்',
    'auth.path_a_desc': 'AI வழிகாட்டி பொருத்தம், தனிப்பயனாக்கப்பட்ட மைல்கற்கள், நேரடி ஊடாடும் அமர்வுகள் மற்றும் வழிகாட்டப்பட்ட பயிற்சி.',
    'auth.path_b_title': 'பாதை B — முன் அனுபவ அங்கீகாரம் (RPL)',
    'auth.path_b_desc': 'தற்போதுள்ள திறன்களை நேரடியாகப் பிரகடனப்படுத்துங்கள், சான்றுகளைப் பதிவேற்றுங்கள், மதிப்பீட்டாளர் ஒப்புதல் பெற்று சான்றிதழ் பெறுங்கள்.',
    'auth.time_credits_title': 'நேர வங்கி (Time Banking)',
    'auth.time_credits_desc': '1 மணிநேரம் கற்பித்தால் = 1 நேரக் கடன் ஈட்டலாம். பணமின்றி சக ஊழியர்களிடம் திறன்களைக் கற்றுக்கொள்ளுங்கள்.',
    'auth.sign_in_title': 'உங்கள் பணியிடத்தில் உள்நுழையவும்',
    'auth.create_account_title': 'புதிய LearnX கணக்கை உருவாக்கவும்',
    'auth.email_label': 'மின்னஞ்சல் முகவரி',
    'auth.email_placeholder': 'name@example.com',
    'auth.password_label': 'கடவுச்சொல்',
    'auth.confirm_password_label': 'கடவுச்சொல்லை உறுதிசெய்க',
    'auth.full_name_label': 'முழுப் பெயர்',
    'auth.full_name_placeholder': 'உங்கள் பெயர்',
    'auth.sign_in_button': 'உள்நுழைக',
    'auth.register_button': 'கணக்கு தொடங்குக',
    'auth.switch_to_register': 'புதிய கணக்கு இல்லையா? பதிவு செய்க',
    'auth.switch_to_login': 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக',
    'auth.quick_demo': 'டெமோ கணக்குகளை உடனடியாகப் பயன்படுத்துக',
    'auth.demo_alex': 'Alex (கற்பவர்)',
    'auth.demo_sarah': 'Sarah (வழிகாட்டி)',
    'auth.demo_marcus': 'Marcus (மதிப்பீட்டாளர்)',
    'auth.demo_elena': 'Elena (நிர்வாகி)',

    // Dashboard
    'dash.welcome': 'மீண்டும் வருக',
    'dash.learner_summary': 'உங்கள் கற்றல் பயணம் & திறன் மைல்கற்கள்',
    'dash.mentor_summary': 'உங்கள் கற்பித்தல் அமர்வுகள் & மாணவர்கள்',
    'dash.current_balance': 'நேரக் கடன் இருப்பு',
    'dash.verified_skills': 'சரிபார்க்கப்பட்ட திறன்கள்',
    'dash.in_progress_plans': 'செயலில் உள்ள கற்றல் திட்டங்கள்',
    'dash.pending_reviews': 'நிலுவையில் உள்ள சான்றுகள்',
    'dash.continue_learning': 'கற்றலைத் தொடர்க',
    'dash.declare_past_exp': 'முன் அனுபவத்தை அறிவிக்க (RPL)',
    'dash.find_mentor_btn': 'வழிகாட்டியைத் தேட',
    'dash.my_active_plans': 'செயலில் உள்ள கற்றல் திட்டங்கள்',
    'dash.recent_evidence': 'சமீபத்திய சான்றுகள்',
    'dash.quick_actions': 'விரைவுச் செயல்பாடுகள்',

    // Evidence Vault
    'vault.title': 'சான்றுகள் பெட்டகம் (Evidence Vault)',
    'vault.subtitle': 'உங்கள் முன் அனுபவம் மற்றும் பணிக்கான சான்றுகளைப் பாதுகாப்பாகப் பதிவேற்றி, AI மதிப்பாய்வு மற்றும் அதிகாரப்பூர்வ தணிக்கையாளரின் ஒப்புதலைப் பெறுங்கள்.',
    'vault.upload_btn': 'புதிய சான்றைப் பதிவேற்றுக',
    'vault.filter_all': 'அனைத்து சான்றுகளும்',
    'vault.filter_verified': 'சரிபார்க்கப்பட்டவை',
    'vault.filter_pending': 'மதிப்பாய்வு நிலுவை',
    'vault.filter_revision': 'மறுபரிசீலனை தேவை',
    'vault.ai_score': 'AI தர மதிப்பீடு',
    'vault.ai_recommendation': 'AI பகுப்பாய்வு & பரிந்துரை',
    'vault.assessor_notes': 'மதிப்பீட்டாளர் குறிப்புகள்',
    'vault.empty': 'சான்றுகள் எதுவும் இன்னும் பதிவேற்றப்படவில்லை. உங்கள் சான்றுகளைச் சேர்த்து சரிபார்க்கவும்.',

    // Mentors
    'mentors.title': 'சரிபார்க்கப்பட்ட வழிகாட்டிகளைக் கண்டறிக',
    'mentors.subtitle': 'நேரக் கடன்களைப் பயன்படுத்தி நிபுணர்களிடம் 1-on-1 பயிற்சி பெறுங்கள்.',
    'mentors.search_placeholder': 'திறன், வழிகாட்டி பெயர் அல்லது தலைப்பைத் தேடுங்கள்...',
    'mentors.filter_skill': 'திறன் வாரியாக',
    'mentors.hourly_rate': 'கட்டணம்: 1 நேரக் கடன் / மணிநேரம்',
    'mentors.book_modal_title': 'வழிகாட்டுதல் அமர்வை முன்பதிவு செய்',

    // Recognition
    'recog.title': 'முன் அனுபவ அங்கீகாரம் (RPL Pathway)',
    'recog.subtitle': 'நீங்கள் ஏற்கனவே அறிந்த திறன்களை நேரடியாக அறிவித்து, சான்றுகளை இணைத்து, தேர்வுகள் மூலம் சான்றிதழ் பெறுங்கள்.',
    'recog.step1': '1. முந்தைய பணி அல்லது திட்டங்களை விவரியுங்கள்',
    'recog.step2': '2. AI திறன்களைப் பொருத்தி பகுப்பாய்வு செய்கிறது',
    'recog.step3': '3. சான்றுகளைப் பதிவேற்றி தணிக்கைக்கு அனுப்புங்கள்',
    'recog.declare_btn': 'புதிய பணி அனுபவத்தை அறிவிக்க',

    // SkillProof
    'proof.title': 'SkillProof சான்றிதழ்கள்',
    'proof.subtitle': 'கிரிப்டோகிராஃபிக் சரிபார்ப்பு கொண்ட அதிகாரப்பூர்வ கற்றல் சான்றிதழ்கள்.',
    'proof.verify_badge': 'கிரிப்டோ முறையில் சரிபார்க்கப்பட்டது',
    'proof.issuer': 'வழங்கியவர்: LearnX SkillProof Ecosystem',

    // Assessments
    'assess.title': 'நடைமுறைத் தேர்வுகள் & சவால்கள்',
    'assess.subtitle': 'உங்கள் அறிவை உறுதிப்படுத்தும் ஊடாடும் திட்டங்கள் மற்றும் சோதனைகள்.',

    // Chat & Messenger
    'chat.title': 'நேரலை அரட்டை & வழிகாட்டல்',
    'chat.placeholder': 'உங்கள் வழிகாட்டியிடம் செய்தி அனுப்புங்கள்...',

    // Time Credits
    'time.title': 'நேரக் கடன்கள் கணக்கேடு (Time Banking Ledger)',
    'time.subtitle': 'அனைத்து கற்பித்தல், கற்றல் மற்றும் நேர பரிவர்த்தனைகளின் வெளிப்படையான கணக்கு.',
    'time.earned': 'ஈட்டப்பட்ட கடன்கள்',
    'time.spent': 'செலவிடப்பட்ட கடன்கள்',
    'time.balance': 'தற்போதைய இருப்பு',

    // Theme & Info
    'theme.marine_brown': 'மெரின் பிரவுன் கருப்பொருள் (Marine Brown)',
    'theme.marine_brown_active': 'மெரின் பிரவுன் தீம் செயலில் உள்ளது'
  },
  en: {
    // Brand & Header
    'app.name': 'LearnX',
    'app.tagline': 'SkillProof Ecosystem',
    'header.switch_mode': 'Switch Active Mode',
    'header.learner_mode': 'Learner Mode',
    'header.learner_desc': 'Learn skills & get certified',
    'header.mentor_mode': 'Mentor Mode',
    'header.mentor_desc': 'Teach & earn Time Credits',
    'header.assessor_mode': 'Assessor Portal',
    'header.assessor_desc': 'Verify candidate evidence',
    'header.admin_mode': 'Admin Console',
    'header.admin_desc': 'Database & audit metrics',
    'header.time_credits': 'Time Credits',
    'header.ai_assistant': 'LearnX AI',
    'header.my_dashboard': 'My Dashboard',
    'header.time_ledger': 'Time Credits Ledger',
    'header.sign_out': 'Sign Out',
    'header.notifications': 'Notifications',
    'header.lang_switch': 'தமிழ்',

    // Sidebar
    'sidebar.learner_workspace': 'Learner Workspace',
    'sidebar.mentor_workspace': 'Mentor Workspace',
    'sidebar.learner_dashboard': 'Learner Dashboard',
    'sidebar.mentor_dashboard': 'Mentor Dashboard',
    'sidebar.teaching_mentees': 'Teaching & Mentees',
    'sidebar.find_learners': 'Find Matching Learners',
    'sidebar.teaching_sessions': 'Teaching Sessions & Plans',
    'sidebar.path_a_title': 'Path A: Learn a Skill',
    'sidebar.find_mentor': 'Find Your Mentor',
    'sidebar.learning_plans': 'Learning Plans & Sessions',
    'sidebar.path_b_title': 'Path B: Skill Recognition',
    'sidebar.declare_rpl': 'Declare Experience (RPL)',
    'sidebar.evidence_vault': 'Evidence Vault',
    'sidebar.verification_title': 'Verification & Proof',
    'sidebar.practical_assessments': 'Practical Assessments',
    'sidebar.skillproof_certs': 'SkillProof & Certificates',
    'sidebar.collaboration_title': 'Exchange & Messaging',
    'sidebar.live_messenger': 'Live Messenger',
    'sidebar.time_credits_ledger': 'Time Credits Ledger',
    'sidebar.staff_portals': 'Staff Portals',
    'sidebar.assessor_queue': 'Assessor Audit Queue',
    'sidebar.admin_ops': 'Admin Operations',
    'sidebar.footer_learner': 'Spend Time Credits to learn from verified peer mentors.',
    'sidebar.footer_mentor': 'Teach sessions to earn Time Credits from learners.',

    // Common Actions
    'action.upload': 'Upload',
    'action.upload_evidence': 'Upload New Evidence',
    'action.submit': 'Submit',
    'action.submit_for_review': 'Submit for Review',
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.close': 'Close',
    'action.search': 'Search...',
    'action.filter': 'Filter',
    'action.view_all': 'View All',
    'action.book_session': 'Book Session',
    'action.message': 'Send Message',
    'action.approve': 'Approve',
    'action.reject': 'Reject',
    'action.request_revision': 'Request Revision',
    'action.start_assessment': 'Start Assessment',
    'action.view_certificate': 'View Certificate',
    'action.download': 'Download',
    'action.share': 'Share',
    'action.transfer_credits': 'Transfer Credits',

    // Statuses
    'status.verified': 'Verified',
    'status.pending': 'Pending Review',
    'status.revision': 'Needs Revision',
    'status.completed': 'Completed',
    'status.in_progress': 'In Progress',
    'status.not_started': 'Not Started',
    'status.approved': 'Approved',

    // Login & Register
    'auth.hero_title': 'Learn. Prove. Grow.',
    'auth.hero_subtitle': 'Learn new skills with verified mentors, prove what you already know through Recognition of Prior Learning, and earn verifiable SkillProof credentials.',
    'auth.path_a_title': 'Path A — Learn a New Skill',
    'auth.path_a_desc': 'AI mentor matching, personalized milestones, live interactive sessions, hands-on practice, and guided assessment.',
    'auth.path_b_title': 'Path B — Recognition of Prior Learning (RPL)',
    'auth.path_b_desc': 'Directly declare existing competencies, upload work evidence, get assessor sign-off, and achieve credentials.',
    'auth.time_credits_title': 'Time Banking Engine',
    'auth.time_credits_desc': '1 hour of teaching = 1 Time Credit earned. Trade knowledge currency without financial friction.',
    'auth.sign_in_title': 'Sign In to Your Workspace',
    'auth.create_account_title': 'Create New LearnX Account',
    'auth.email_label': 'Email Address',
    'auth.email_placeholder': 'name@example.com',
    'auth.password_label': 'Password',
    'auth.confirm_password_label': 'Confirm Password',
    'auth.full_name_label': 'Full Name',
    'auth.full_name_placeholder': 'Your Full Name',
    'auth.sign_in_button': 'Sign In',
    'auth.register_button': 'Create Account',
    'auth.switch_to_register': "Don't have an account? Sign up",
    'auth.switch_to_login': 'Already have an account? Sign in',
    'auth.quick_demo': 'Quick Demo Sign-in',
    'auth.demo_alex': 'Alex (Learner)',
    'auth.demo_sarah': 'Sarah (Mentor)',
    'auth.demo_marcus': 'Marcus (Assessor)',
    'auth.demo_elena': 'Elena (Admin)',

    // Dashboard
    'dash.welcome': 'Welcome back',
    'dash.learner_summary': 'Your learning journey & verified milestones',
    'dash.mentor_summary': 'Your teaching sessions & mentees',
    'dash.current_balance': 'Time Credit Balance',
    'dash.verified_skills': 'Verified Skills',
    'dash.in_progress_plans': 'Active Learning Plans',
    'dash.pending_reviews': 'Pending Evidence',
    'dash.continue_learning': 'Continue Learning',
    'dash.declare_past_exp': 'Declare Prior Experience (RPL)',
    'dash.find_mentor_btn': 'Find a Mentor',
    'dash.my_active_plans': 'My Active Learning Plans',
    'dash.recent_evidence': 'Recent Evidence Items',
    'dash.quick_actions': 'Quick Actions',

    // Evidence Vault
    'vault.title': 'Evidence Vault',
    'vault.subtitle': 'Securely upload past work, code, designs, or credentials for AI competency extraction and official assessor verification.',
    'vault.upload_btn': 'Upload New Evidence',
    'vault.filter_all': 'All Evidence',
    'vault.filter_verified': 'Verified',
    'vault.filter_pending': 'Pending Review',
    'vault.filter_revision': 'Needs Revision',
    'vault.ai_score': 'AI Quality Score',
    'vault.ai_recommendation': 'AI Assessment & Recommendation',
    'vault.assessor_notes': 'Assessor Notes',
    'vault.empty': 'No evidence uploaded yet. Add items to demonstrate your prior learning.',

    // Mentors
    'mentors.title': 'Find Verified Mentors',
    'mentors.subtitle': 'Book 1-on-1 sessions using your Time Credits with verified practitioners.',
    'mentors.search_placeholder': 'Search by skill, mentor name, or domain...',
    'mentors.filter_skill': 'Filter by skill',
    'mentors.hourly_rate': 'Rate: 1 Time Credit / hour',
    'mentors.book_modal_title': 'Book Mentorship Session',

    // Recognition
    'recog.title': 'Recognition of Prior Learning (RPL)',
    'recog.subtitle': 'Declare skills you already have, upload evidence, and bypass introductory courses straight to credentialing.',
    'recog.step1': '1. Declare Past Projects & Experience',
    'recog.step2': '2. AI Maps Your Skills to Qualifications',
    'recog.step3': '3. Upload Evidence for Human Assessor Audit',
    'recog.declare_btn': 'Declare Experience',

    // SkillProof
    'proof.title': 'SkillProof Credentials',
    'proof.subtitle': 'Cryptographically verified, tamper-proof credentials recognizing demonstrated mastery.',
    'proof.verify_badge': 'Cryptographically Verified',
    'proof.issuer': 'Issuer: LearnX SkillProof Ecosystem',

    // Assessments
    'assess.title': 'Practical Assessments',
    'assess.subtitle': 'Scenario-based challenges and interactive checks to validate hands-on competence.',

    // Chat & Messenger
    'chat.title': 'Live Messenger & Collaboration',
    'chat.placeholder': 'Type your message to peer or mentor...',

    // Time Credits
    'time.title': 'Time Credits Ledger',
    'time.subtitle': 'Transparent time-banking transaction history of hours taught and learned.',
    'time.earned': 'Credits Earned',
    'time.spent': 'Credits Spent',
    'time.balance': 'Current Balance',

    // Theme & Info
    'theme.marine_brown': 'Marine Brown Theme',
    'theme.marine_brown_active': 'Marine Brown Theme Active'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'ta' (Tamil) as requested by user, while persisting any user preference
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('learnx_language');
    if (saved === 'en' || saved === 'ta') return saved;
    return 'ta';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('learnx_language', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'ta' ? 'en' : 'ta';
    setLanguage(next);
  };

  const t = (key: string, fallback?: string): string => {
    const val = translations[language]?.[key];
    if (val) return val;
    const enVal = translations.en?.[key];
    if (enVal) return enVal;
    return fallback || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
