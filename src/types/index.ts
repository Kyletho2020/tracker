export interface Activity {
  id: string;
  type: 'website' | 'application' | 'focus_session';
  name: string;
  url?: string;
  category: string;
  duration: number; // in seconds
  timestamp: Date;
  productivity_score: number; // 1-5 scale
}

export interface FocusSession {
  id: string;
  type: 'pomodoro' | 'deep_work' | 'break';
  duration: number; // in seconds
  completed: boolean;
  start_time: Date;
  end_time?: Date;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target_hours: number;
  category: string;
  deadline: Date;
  progress: number; // 0-100
  created_at: Date;
}

export interface DailyStats {
  date: string;
  total_productive_time: number;
  total_distracted_time: number;
  focus_sessions_completed: number;
  productivity_score: number;
  top_activities: Activity[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  settings: UserSettings;
}

export interface UserSettings {
  pomodoro_duration: number; // in minutes
  short_break_duration: number;
  long_break_duration: number;
  daily_goal_hours: number;
  notifications_enabled: boolean;
  auto_categorization: boolean;
}