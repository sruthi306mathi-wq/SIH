export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'learner' | 'mentor' | 'dual' | 'assessor' | 'admin';
  active_mode: 'learner' | 'mentor' | 'assessor' | 'admin';
  bio?: string;
  language?: string;
  availability?: string;
  learning_mode?: string;
  location?: string;
}

export interface LearnerProfile {
  user_id: string;
  primary_goal: string;
  target_level: string;
  current_level: string;
  preferred_mode: string;
  hours_per_week: number;
  skills_to_learn: string[];
}

export interface MentorProfile {
  user_id: string;
  skills_taught: string[];
  years_of_experience: number;
  hourly_rate_credits: number;
  teaching_style: string;
  bio: string;
  qualifications?: string;
  is_verified: number;
  learners_helped: number;
  rating: number;
  total_reviews: number;
  availability_hours: string;
  full_name?: string;
  avatar_url?: string;
  language?: string;
  location?: string;
  matchPercentage?: number;
  matchRationale?: string;
}

export interface TimeCreditsAccount {
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface TimeCreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earned' | 'spent' | 'starter_bonus';
  description: string;
  reference_session_id?: string;
  created_at: string;
}

export interface MentorRequest {
  id: string;
  learner_id: string;
  mentor_id: string;
  skill_name: string;
  goal_notes: string;
  status: 'requested' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  mentor_name?: string;
  learner_name?: string;
}

export interface LearningPlanModule {
  week: number;
  title: string;
  hours: number;
  concepts?: string[];
  handsOnTask?: string;
  mentorTopic?: string;
  assessmentCheck?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface LearningPlan {
  id: string;
  learner_id: string;
  mentor_id?: string;
  skill_name: string;
  goal: string;
  target_date?: string;
  status: 'active' | 'completed' | 'paused';
  modules: LearningPlanModule[];
  mentor_name?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningSession {
  id: string;
  mentor_id: string;
  learner_id: string;
  skill_name: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_link: string;
  agenda: string;
  notes?: string;
  feedback?: string;
  time_credits_transferred: number;
  mentor_name?: string;
  learner_name?: string;
  created_at: string;
}

export interface Experience {
  id: string;
  user_id: string;
  profession: string;
  company: string;
  years_exp: number;
  responsibilities: string;
  tools_used: string;
  tasks_performed: string;
  ai_analysis?: {
    summary: string;
    identifiedSkills: Array<{ name: string; level: string; confidence: number; evidenceNeeded?: string }>;
    qualificationAlignment: string;
    matchPercentage: number;
    recommendedEvidence: string[];
    skillGaps: string[];
  };
  created_at: string;
}

export interface QualificationMapping {
  id: string;
  user_id: string;
  qualification_id: string;
  qualification_title: string;
  qualification_code: string;
  industry: string;
  match_percentage: number;
  matched_competencies: string[];
  partial_competencies: string[];
  missing_competencies: string[];
  ai_reasoning: string;
  created_at: string;
}

export interface Competency {
  id: string;
  user_id: string;
  skill_name: string;
  current_level: string;
  target_level: string;
  status: 'unverified' | 'ai_assessed' | 'assessor_verified';
  gap_notes?: string;
  verified_by?: string;
  verified_at?: string;
}

export interface EvidenceItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  skill_name: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number;
  ai_quality_score: number;
  ai_analysis_notes: string;
  assessor_status: 'pending' | 'verified' | 'needs_more_evidence' | 'rejected';
  assessor_notes?: string;
  assessor_name?: string;
  candidate_name?: string;
  candidate_email?: string;
  created_at: string;
}

export interface SkillProof {
  id: string;
  user_id: string;
  skill_name: string;
  verification_level: 'self_claimed' | 'ai_assessed' | 'community_verified' | 'institution_verified';
  badge_code: string;
  verified_by: string;
  qr_payload: string;
  issued_at: string;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  pathway: 'learning_path' | 'experience_recognition';
  skill_name: string;
  title: string;
  issue_date: string;
  grade: string;
  verified_by: string;
  certificate_data: {
    candidateName?: string;
    skillName?: string;
    assessorName?: string;
    dateIssued?: string;
    evidenceTitle?: string;
    status?: string;
  };
  created_at: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface Assessment {
  id: string;
  title: string;
  skill_name: string;
  type: 'mcq' | 'scenario' | 'practical';
  passing_score: number;
  totalAttempts?: number;
  bestScore?: number | null;
  isCompleted?: boolean;
  questions?: AssessmentQuestion[];
  totalQuestions?: number;
}

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  receiver_id: string;
  content: string;
  is_read: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: number;
  link?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  details: string;
  created_at: string;
}
