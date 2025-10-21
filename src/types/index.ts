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
  mode: 'work' | 'shortBreak' | 'longBreak' | 'idle';
  startTimestamp: number;
  durationSec: number;
  remainingSec: number;
  taskId?: string;
  cyclesCompleted: number;
  isPaused: boolean;
}

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

export interface AppData {
  tasks: Task[];
  courses: Course[];
  reflections: Reflection[];
  focusSessions: FocusSession[];
  timerState?: TimerState;
  timerSettings?: TimerSettings;
}
