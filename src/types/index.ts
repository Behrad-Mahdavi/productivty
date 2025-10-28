export interface Task {
  id: string;
  title: string;
  category: 'دانشگاه' | 'پروژه' | 'شخصی';
  date: string;
  done: boolean;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
  courseId: string;
  description?: string;
  // ✅ فیلدهای جدید برای برنامه‌ریزی فعال
  estimatedHours: number; // تعداد ساعت کار تخمینی برای اتمام
  linkedTaskIds: string[]; // آرایه از Task.idهایی که برای این تکلیف ایجاد شده‌اند
}

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  assignments: Assignment[];
}

export interface Reflection {
  date: string;
  good: string;
  distraction: string;
  improve: string;
  focusMinutes?: number;
  note?: string;
  rating?: number;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  startTime: string;
  endTime: string;
  durationSec: number;
  completed: boolean;
  type: 'work' | 'shortBreak' | 'longBreak';
}

export interface TimerState {
  mode: 'work' | 'shortBreak' | 'longBreak';
  startTime: string; // زمان شروع تایمر (ISO string)
  durationSec: number; // مدت زمان کل سشن
  remainingSec: number; // ثانیه‌های باقی‌مانده
  cyclesCompleted: number; // تعداد چرخه‌های پومودوروی تکمیل شده
  isPaused: boolean;
  taskId?: string; // اختیاری
}

// TimerAction types برای Reducer Pattern
export type TimerAction =
  | { type: 'START'; mode: 'work' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP_SAVE' }
  | { type: 'SKIP_PHASE' }
  | { type: 'TIME_ELAPSED'; seconds: number };

export interface User {
  id: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  cyclesBeforeLongBreak: number;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  workedHours: number;
  completedTasks: number;
  focusMinutes: number;
}

export interface UserStats {
  userId: string;
  userName: string;
  streak: number; // تعداد روزهای متوالی فعالیت
  totalHours: number;
  totalFocusMinutes: number;
  lastUpdate: string;
  dailyStats: DailyStat[];
  rank?: number; // رتبه در leaderboard
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalHours: number;
  streak: number;
  rank: number;
  avatar?: string;
}

export interface GamificationData {
  leaderboard: LeaderboardEntry[];
  userStats: UserStats[];
  lastUpdated: string;
}

export interface AppData {
  tasks: Task[];
  courses: Course[];
  reflections: Reflection[];
  focusSessions: FocusSession[];
  timerState?: TimerState;
  timerSettings?: TimerSettings;
  gamification?: GamificationData;
}
