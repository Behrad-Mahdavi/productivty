import type { AppData, Task, Course, Reflection, FocusSession, TimerState } from '../types';

// Get current user ID from localStorage
const getCurrentUserId = (): string | null => {
  return localStorage.getItem('ppj_currentUser');
};

// Get storage key with user prefix
const getStorageKey = (key: string, userId?: string): string => {
  const currentUserId = userId || getCurrentUserId();
  return currentUserId ? `ppj_${currentUserId}_${key}` : `ppj_${key}`;
};

export const loadData = (userId?: string): AppData => {
  try {
    const tasks = JSON.parse(localStorage.getItem(getStorageKey('tasks', userId)) || '[]');
    const courses = JSON.parse(localStorage.getItem(getStorageKey('courses', userId)) || '[]');
    const reflections = JSON.parse(localStorage.getItem(getStorageKey('reflections', userId)) || '[]');
    const focusSessions = JSON.parse(localStorage.getItem(getStorageKey('focusSessions', userId)) || '[]');
    const timerState = JSON.parse(localStorage.getItem(getStorageKey('timerState', userId)) || 'null');

    return {
      tasks,
      courses,
      reflections,
      focusSessions,
      timerState: timerState || undefined
    };
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return {
      tasks: [],
      courses: [],
      reflections: [],
      focusSessions: [],
    };
  }
};

export const saveData = (data: AppData, userId?: string): void => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) {
      console.error('No current user found');
      return;
    }

    localStorage.setItem(getStorageKey('tasks', currentUserId), JSON.stringify(data.tasks));
    localStorage.setItem(getStorageKey('courses', currentUserId), JSON.stringify(data.courses));
    localStorage.setItem(getStorageKey('reflections', currentUserId), JSON.stringify(data.reflections));
    localStorage.setItem(getStorageKey('focusSessions', currentUserId), JSON.stringify(data.focusSessions));
    
    if (data.timerState) {
      localStorage.setItem(getStorageKey('timerState', currentUserId), JSON.stringify(data.timerState));
    }
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

export const saveTasks = (tasks: Task[], userId?: string): void => {
  const data = loadData(userId);
  data.tasks = tasks;
  saveData(data, userId);
};

export const saveCourses = (courses: Course[], userId?: string): void => {
  const data = loadData(userId);
  data.courses = courses;
  saveData(data, userId);
};

export const saveReflections = (reflections: Reflection[], userId?: string): void => {
  const data = loadData(userId);
  data.reflections = reflections;
  saveData(data, userId);
};

export const saveFocusSessions = (sessions: FocusSession[], userId?: string): void => {
  const data = loadData(userId);
  data.focusSessions = sessions;
  saveData(data, userId);
};

export const saveTimerState = (timerState: TimerState | null, userId?: string): void => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return;

  if (timerState) {
    localStorage.setItem(getStorageKey('timerState', currentUserId), JSON.stringify(timerState));
  } else {
    localStorage.removeItem(getStorageKey('timerState', currentUserId));
  }
};

export const loadTimerState = (userId?: string): TimerState | null => {
  const currentUserId = userId || getCurrentUserId();
  if (!currentUserId) return null;

  try {
    const data = localStorage.getItem(getStorageKey('timerState', currentUserId));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading timer state:', error);
    return null;
  }
};

// User management functions
export const saveUsers = (users: any[]): void => {
  localStorage.setItem('ppj_users', JSON.stringify(users));
};

export const loadUsers = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('ppj_users') || '[]');
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

export const setCurrentUser = (userId: string): void => {
  localStorage.setItem('ppj_currentUser', userId);
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem('ppj_currentUser');
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem('ppj_currentUser');
};