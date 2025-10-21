import type { AppData, Task, Course, Reflection, FocusSession, TimerState } from '../types';

const STORAGE_KEY = 'ppj';

export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }
  
  return {
    tasks: [],
    courses: [],
    reflections: [],
    focusSessions: [],
  };
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

export const saveTasks = (tasks: Task[]): void => {
  const data = loadData();
  data.tasks = tasks;
  saveData(data);
};

export const saveCourses = (courses: Course[]): void => {
  const data = loadData();
  data.courses = courses;
  saveData(data);
};

export const saveReflections = (reflections: Reflection[]): void => {
  const data = loadData();
  data.reflections = reflections;
  saveData(data);
};

export const saveFocusSessions = (sessions: FocusSession[]): void => {
  const data = loadData();
  data.focusSessions = sessions;
  saveData(data);
};

export const saveTimerState = (timerState: TimerState | null): void => {
  const data = loadData();
  if (timerState) {
    data.timerState = timerState;
  } else {
    delete data.timerState;
  }
  saveData(data);
};

export const loadTimerState = (): TimerState | null => {
  const data = loadData();
  return data.timerState || null;
};
