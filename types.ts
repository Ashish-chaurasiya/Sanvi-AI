
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: number;
}

export interface LessonBlocker {
  id: string;
  topicId: string;
  text: string;
  resolved: boolean;
  createdAt: number;
  resolvedAt?: number;
}

export interface SkillCheck {
  id: string;
  topicId: string;
  questions: string[];
  userAnswers?: string[];
  results?: {
    passed: boolean;
    score: number;
    feedback: string;
    weakConcepts: string[];
    actionableAdvice: string;
  };
  createdAt: number;
}

export interface TopicChat {
  topicId: string;
  messages: ChatMessage[];
  blockers: LessonBlocker[];
  isLocked: boolean;
  mode: 'learning' | 'revision' | 'skill-check';
  skillCheck?: SkillCheck;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessageAt: number;
  messages: ChatMessage[];
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserCareerProfile {
  id: string;
  userId: string;
  education_degree?: string;
  education_field?: string;
  graduation_year?: number;
  employment_status?: string;
  years_of_experience?: number;
  job_role?: string;
  skills: Skill[];
  target_roles: string[];
  short_term_goal?: string;
  long_term_goal?: string;
  onboarding_completed: boolean;
  learning_style?: 'self-paced' | 'mentor-led' | 'academic' | 'hands-on';
}

export enum TopicStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NEEDS_REVISION = 'needs_revision',
  LOCKED = 'locked'
}

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  status: TopicStatus;
  estimated_minutes: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  isRevision?: boolean;
  originalTopicId?: string;
  completedAt?: number;
  prerequisites?: string[]; // Array of topic IDs
}

export interface LearningPhase {
  id: string;
  title: string;
  topics: LearningTopic[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  goal_role: string;
  phases: LearningPhase[];
  status: 'active' | 'completed' | 'archived';
  progress: number;
}

export interface ResumeAnalysis {
  skills: string[];
  extracted_roles: string[];
  suggestions: string[];
  keywords: string[];
  improvement_areas: string[];
  actionable_recommendations: {
    category: string;
    advice: string;
  }[];
}
