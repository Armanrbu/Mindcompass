export enum UserRole {
  STUDENT = 'Student',
  PROFESSIONAL = 'Professional',
}

export enum AgeRange {
  TEEN = '18-21',
  YOUNG_ADULT = '22-25',
  ADULT = '26-30',
  MATURE = '30+',
}

export enum PriorityLevel {
  LOW = 'low',       // Self-care
  MEDIUM = 'medium', // Counselor
  HIGH = 'high',     // Helpline/Safety
}

export enum SupportType {
  SELF_HELP = 'self_help',
  COUNSELOR = 'counselor',
  HELPLINE = 'helpline',
}

export interface UserProfile {
  username: string; // Acts as ID for this MVP
  role: UserRole;
  age: AgeRange;
}

export interface UserStats {
  totalCheckIns: number;
  lastCheckInDate: string | null;
  consistencyStreak: number; // Renamed from 'streak' to emphasize consistency
}

export interface AIRoutingResponse {
  priority: PriorityLevel;
  reflection: string; // Renamed from gentleMessage to emphasize mirroring/reflection
}

export interface Resource {
  title: string;
  description: string;
  link: string;
  minPriority: PriorityLevel; // Filter resources by priority
  isEmergency?: boolean;
  type: SupportType;
}

export type ScreenName = 'home' | 'login' | 'profile' | 'welcome_back' | 'mode_selection' | 'disclaimer' | 'checkin' | 'reflection' | 'processing' | 'results' | 'safety' | 'safety_plan' | 'grounding' | 'library' | 'breathing' | 'reframing';