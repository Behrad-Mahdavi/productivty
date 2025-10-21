import { create } from 'zustand';
import type { Task, Course, Reflection, FocusSession, TimerState, Assignment } from '../types';
import { 
  loadData, 
  saveTasks, 
  saveCourses, 
  saveReflections, 
  saveTimerState,
  loadTimerState
} from '../utils/storage';
import { 
  createTimerState, 
  pauseTimer, 
  resumeTimer, 
  completeSession, 
  getNextMode,
  calculateElapsedTime
} from '../utils/timer';

interface AppStore {
  // Data
  tasks: Task[];
  courses: Course[];
  reflections: Reflection[];
  focusSessions: FocusSession[];
  timerState: TimerState | null;
  
  // Actions
  loadAppData: () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  addAssignment: (courseId: string, assignment: Omit<Assignment, 'id' | 'courseId'>) => void;
  updateAssignment: (courseId: string, assignmentId: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (courseId: string, assignmentId: string) => void;
  
  addReflection: (reflection: Reflection) => void;
  updateReflection: (date: string, updates: Partial<Reflection>) => void;
  getReflection: (date: string) => Reflection | undefined;
  
  // Timer actions
  startTimer: (mode: 'work' | 'shortBreak' | 'longBreak', taskId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  skipTimer: () => void;
  
  // Computed values
  getTodayTasks: () => Task[];
  getTodayProgress: () => number;
  getFocusMinutesToday: () => number;
  getOverdueAssignments: () => Assignment[];
}

export const useStore = create<AppStore>((set, get) => ({
  // Initial state
  tasks: [],
  courses: [],
  reflections: [],
  focusSessions: [],
  timerState: null,
  
  // Load data from localStorage
  loadAppData: () => {
    const data = loadData();
    
    const timerState = loadTimerState();
    
    // Check if timer needs to be completed
    if (timerState && !timerState.isPaused) {
      const elapsed = calculateElapsedTime(timerState);
      if (elapsed >= timerState.durationSec) {
        // Timer completed while away
        const session = completeSession(timerState);
        const nextMode = getNextMode(timerState.mode as 'work' | 'shortBreak' | 'longBreak', timerState.cyclesCompleted);
        const newCycles = timerState.mode === 'work' ? timerState.cyclesCompleted + 1 : timerState.cyclesCompleted;
        
        if (nextMode === 'work') {
          // Start new work session
          const newTimerState = createTimerState('work', undefined, newCycles);
          set({ timerState: newTimerState });
          saveTimerState(newTimerState);
        } else {
          // Start break
          const newTimerState = createTimerState(nextMode, undefined, newCycles);
          set({ timerState: newTimerState });
          saveTimerState(newTimerState);
        }
        
        set({ focusSessions: [...data.focusSessions, session] });
        return;
      }
    }
    
    set({ 
      ...data, 
      timerState 
    });
  },
  
  // Task actions
  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...get().tasks, newTask];
    set({ tasks: updatedTasks });
    saveTasks(updatedTasks);
  },
  
  updateTask: (id, updates) => {
    const updatedTasks = get().tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    set({ tasks: updatedTasks });
    saveTasks(updatedTasks);
  },
  
  deleteTask: (id) => {
    const updatedTasks = get().tasks.filter(task => task.id !== id);
    set({ tasks: updatedTasks });
    saveTasks(updatedTasks);
  },
  
  toggleTask: (id) => {
    const updatedTasks = get().tasks.map(task => 
      task.id === id ? { ...task, done: !task.done } : task
    );
    set({ tasks: updatedTasks });
    saveTasks(updatedTasks);
  },
  
  // Course actions
  addCourse: (courseData) => {
    const newCourse: Course = {
      ...courseData,
      id: `course_${Date.now()}`,
      assignments: []
    };
    const updatedCourses = [...get().courses, newCourse];
    set({ courses: updatedCourses });
    saveCourses(updatedCourses);
  },
  
  updateCourse: (id, updates) => {
    const updatedCourses = get().courses.map(course => 
      course.id === id ? { ...course, ...updates } : course
    );
    set({ courses: updatedCourses });
    saveCourses(updatedCourses);
  },
  
  deleteCourse: (id) => {
    const updatedCourses = get().courses.filter(course => course.id !== id);
    set({ courses: updatedCourses });
    saveCourses(updatedCourses);
  },

  // Assignment actions
  addAssignment: (courseId, assignmentData) => {
    const newAssignment: Assignment = {
      ...assignmentData,
      id: `assignment_${Date.now()}`,
      courseId,
    };
    
    const updatedCourses = get().courses.map(course =>
      course.id === courseId
        ? { ...course, assignments: [...course.assignments, newAssignment] }
        : course
    );
    
    set({ courses: updatedCourses });
    saveCourses(updatedCourses);
  },

  updateAssignment: (courseId, assignmentId, updates) => {
    const updatedCourses = get().courses.map(course =>
      course.id === courseId
        ? {
            ...course,
            assignments: course.assignments.map(assignment =>
              assignment.id === assignmentId
                ? { ...assignment, ...updates }
                : assignment
            )
          }
        : course
    );
    
    set({ courses: updatedCourses });
    saveCourses(updatedCourses);
  },

  deleteAssignment: (courseId, assignmentId) => {
    const updatedCourses = get().courses.map(course =>
      course.id === courseId
        ? {
            ...course,
            assignments: course.assignments.filter(assignment => assignment.id !== assignmentId)
          }
        : course
    );
    
    set({ courses: updatedCourses });
    saveCourses(updatedCourses);
  },
  
  
  // Reflection actions
  addReflection: (reflection) => {
    const updatedReflections = get().reflections.filter(r => r.date !== reflection.date);
    updatedReflections.push(reflection);
    set({ reflections: updatedReflections });
    saveReflections(updatedReflections);
  },
  
  updateReflection: (date, updates) => {
    const updatedReflections = get().reflections.map(reflection => 
      reflection.date === date ? { ...reflection, ...updates } : reflection
    );
    set({ reflections: updatedReflections });
    saveReflections(updatedReflections);
  },
  
  getReflection: (date) => {
    return get().reflections.find(r => r.date === date);
  },
  
  deleteReflection: (date: string) => {
    const updatedReflections = get().reflections.filter(r => r.date !== date);
    set({ reflections: updatedReflections });
    saveReflections(updatedReflections);
  },
  
  // Timer actions
  startTimer: (mode: 'work' | 'shortBreak' | 'longBreak', taskId?: string) => {
    const currentTimer = get().timerState;
    const cyclesCompleted = currentTimer?.mode === 'work' ? currentTimer.cyclesCompleted + 1 : 0;
    const newTimerState = createTimerState(mode as 'work' | 'shortBreak' | 'longBreak', taskId, cyclesCompleted);
    set({ timerState: newTimerState });
    saveTimerState(newTimerState);
  },
  
  pauseTimer: () => {
    const currentTimer = get().timerState;
    if (currentTimer) {
      const pausedTimer = pauseTimer(currentTimer);
      set({ timerState: pausedTimer });
    }
  },
  
  resumeTimer: () => {
    const currentTimer = get().timerState;
    if (currentTimer) {
      const resumedTimer = resumeTimer(currentTimer);
      set({ timerState: resumedTimer });
    }
  },
  
  stopTimer: () => {
    const currentTimer = get().timerState;
    if (currentTimer) {
      completeSession(currentTimer);
      set({ timerState: null });
      saveTimerState(null);
    }
  },
  
  skipTimer: () => {
    const currentTimer = get().timerState;
    if (currentTimer) {
      completeSession(currentTimer);
      const nextMode = getNextMode(currentTimer.mode as 'work' | 'shortBreak' | 'longBreak', currentTimer.cyclesCompleted);
      const newCycles = currentTimer.mode === 'work' ? currentTimer.cyclesCompleted + 1 : currentTimer.cyclesCompleted;
      
      if (nextMode === 'work') {
        const newTimerState = createTimerState('work', undefined, newCycles);
        set({ timerState: newTimerState });
        saveTimerState(newTimerState);
      } else {
        set({ timerState: null });
        saveTimerState(null);
      }
    }
  },
  
  // Computed values
  getTodayTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(task => task.date === today);
  },
  
  getTodayProgress: () => {
    const todayTasks = get().getTodayTasks();
    if (todayTasks.length === 0) return 0;
    const completedTasks = todayTasks.filter(task => task.done).length;
    return Math.round((completedTasks / todayTasks.length) * 100);
  },
  
  getFocusMinutesToday: () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = get().focusSessions.filter(session => 
      session.startTime.startsWith(today) && session.type === 'work'
    );
    return todaySessions.reduce((total, session) => total + Math.floor(session.durationSec / 60), 0);
  },
  
  getOverdueAssignments: () => {
    const today = new Date().toISOString();
    const overdue: Assignment[] = [];
    
    get().courses.forEach(course => {
      course.assignments.forEach(assignment => {
        if (!assignment.done && assignment.dueDate < today) {
          overdue.push(assignment);
        }
      });
    });
    
    return overdue;
  },

}));
