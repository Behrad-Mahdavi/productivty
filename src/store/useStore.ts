import { create } from 'zustand';
import type { Task, Course, Reflection, FocusSession, TimerState, Assignment } from '../types';
import { 
  loadData, 
  saveTasks, 
  saveCourses, 
  saveReflections, 
  saveTimerState,
  loadTimerState,
  subscribeToTasks,
  subscribeToCourses,
  subscribeToReflections,
  subscribeToFocusSessions
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
  currentUserId: string | null;
  
  // Actions
  setCurrentUserId: (userId: string | null) => void;
  loadAppData: (userId: string) => Promise<void>;
  setupRealtimeSync: (userId: string) => void;
  cleanupRealtimeSync: () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  
  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addAssignment: (courseId: string, assignment: Omit<Assignment, 'id' | 'courseId'>) => Promise<void>;
  updateAssignment: (courseId: string, assignmentId: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (courseId: string, assignmentId: string) => Promise<void>;
  
  addReflection: (reflection: Reflection) => Promise<void>;
  updateReflection: (date: string, updates: Partial<Reflection>) => Promise<void>;
  getReflection: (date: string) => Reflection | undefined;
  deleteReflection: (date: string) => Promise<void>;
  
  // Timer actions
  startTimer: (mode: 'work' | 'shortBreak' | 'longBreak', taskId?: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  skipTimer: () => Promise<void>;
  
  // Computed values
  getTodayTasks: () => Task[];
  getTodayProgress: () => number;
  getFocusMinutesToday: () => number;
  getOverdueAssignments: () => Assignment[];
}

export const useStore = create<AppStore>((set, get) => {
  let unsubscribeFunctions: (() => void)[] = [];

  return {
    // Initial state
    tasks: [],
    courses: [],
    reflections: [],
    focusSessions: [],
    timerState: null,
    currentUserId: null,
  
  setCurrentUserId: (userId: string | null) => {
    set({ currentUserId: userId });
  },

  setupRealtimeSync: (userId: string) => {
    console.log('Setting up real-time sync for user:', userId);
    
    // Clean up existing subscriptions
    get().cleanupRealtimeSync();
    
    // Subscribe to tasks
    const unsubscribeTasks = subscribeToTasks(userId, (tasks) => {
      console.log('Real-time tasks update received:', tasks.length);
      set({ tasks });
    });
    
    // Subscribe to courses
    const unsubscribeCourses = subscribeToCourses(userId, (courses) => {
      console.log('Real-time courses update received:', courses.length);
      set({ courses });
    });
    
    // Subscribe to reflections
    const unsubscribeReflections = subscribeToReflections(userId, (reflections) => {
      console.log('Real-time reflections update received:', reflections.length);
      set({ reflections });
    });
    
    // Subscribe to focus sessions
    const unsubscribeFocusSessions = subscribeToFocusSessions(userId, (sessions) => {
      console.log('Real-time focus sessions update received:', sessions.length);
      set({ focusSessions: sessions });
    });
    
    // Store unsubscribe functions
    unsubscribeFunctions = [
      unsubscribeTasks,
      unsubscribeCourses,
      unsubscribeReflections,
      unsubscribeFocusSessions
    ];
  },

  cleanupRealtimeSync: () => {
    console.log('Cleaning up real-time sync subscriptions');
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctions = [];
  },
  
  // Load data from Firestore
  loadAppData: async (userId: string) => {
    try {
      console.log('Loading app data for user:', userId);
      const data = await loadData(userId);
      const timerState = await loadTimerState(userId);
      
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
            // Remove undefined taskId before saving
            const timerStateToSave = { ...newTimerState };
            if (!timerStateToSave.taskId) {
              delete timerStateToSave.taskId;
            }
            set({ timerState: newTimerState });
            await saveTimerState(userId, timerStateToSave);
          } else {
            // Start break
            const newTimerState = createTimerState(nextMode, undefined, newCycles);
            // Remove undefined taskId before saving
            const timerStateToSave = { ...newTimerState };
            if (!timerStateToSave.taskId) {
              delete timerStateToSave.taskId;
            }
            set({ timerState: newTimerState });
            await saveTimerState(userId, timerStateToSave);
          }
          
          set({ focusSessions: [...data.focusSessions, session] });
          return;
        }
      }
      
      console.log('Setting app data:', data);
      set({ 
        ...data, 
        timerState,
        currentUserId: userId
      });
    } catch (error) {
      console.error('Error loading app data:', error);
    }
  },
  
  // Task actions
  addTask: async (taskData) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    console.log('Adding task to Firestore:', taskData);
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...get().tasks, newTask];
    set({ tasks: updatedTasks });
    await saveTasks(currentUserId, updatedTasks);
    console.log('Task saved to Firestore');
  },
  
  updateTask: async (id, updates) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedTasks = get().tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    set({ tasks: updatedTasks });
    await saveTasks(currentUserId, updatedTasks);
  },
  
  deleteTask: async (id) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedTasks = get().tasks.filter(task => task.id !== id);
    set({ tasks: updatedTasks });
    await saveTasks(currentUserId, updatedTasks);
  },
  
  toggleTask: async (id) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedTasks = get().tasks.map(task => 
      task.id === id ? { ...task, done: !task.done } : task
    );
    set({ tasks: updatedTasks });
    await saveTasks(currentUserId, updatedTasks);
  },
  
  // Course actions
  addCourse: async (courseData) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const newCourse: Course = {
      ...courseData,
      id: `course_${Date.now()}`,
      assignments: []
    };
    const updatedCourses = [...get().courses, newCourse];
    set({ courses: updatedCourses });
    await saveCourses(currentUserId, updatedCourses);
  },
  
  updateCourse: async (id, updates) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedCourses = get().courses.map(course => 
      course.id === id ? { ...course, ...updates } : course
    );
    set({ courses: updatedCourses });
    await saveCourses(currentUserId, updatedCourses);
  },
  
  deleteCourse: async (id) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedCourses = get().courses.filter(course => course.id !== id);
    set({ courses: updatedCourses });
    await saveCourses(currentUserId, updatedCourses);
  },

  // Assignment actions
  addAssignment: async (courseId, assignmentData) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
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
    await saveCourses(currentUserId, updatedCourses);
  },

  updateAssignment: async (courseId, assignmentId, updates) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
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
    await saveCourses(currentUserId, updatedCourses);
  },

  deleteAssignment: async (courseId, assignmentId) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedCourses = get().courses.map(course =>
      course.id === courseId
        ? {
            ...course,
            assignments: course.assignments.filter(assignment => assignment.id !== assignmentId)
          }
        : course
    );
    
    set({ courses: updatedCourses });
    await saveCourses(currentUserId, updatedCourses);
  },
  
  // Reflection actions
  addReflection: async (reflection) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedReflections = get().reflections.filter(r => r.date !== reflection.date);
    updatedReflections.push(reflection);
    set({ reflections: updatedReflections });
    await saveReflections(currentUserId, updatedReflections);
  },
  
  updateReflection: async (date, updates) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedReflections = get().reflections.map(reflection => 
      reflection.date === date ? { ...reflection, ...updates } : reflection
    );
    set({ reflections: updatedReflections });
    await saveReflections(currentUserId, updatedReflections);
  },
  
  getReflection: (date) => {
    return get().reflections.find(r => r.date === date);
  },
  
  deleteReflection: async (date: string) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedReflections = get().reflections.filter(r => r.date !== date);
    set({ reflections: updatedReflections });
    await saveReflections(currentUserId, updatedReflections);
  },
  
  // Timer actions
  startTimer: async (mode: 'work' | 'shortBreak' | 'longBreak', taskId?: string) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const currentTimer = get().timerState;
    const cyclesCompleted = currentTimer?.mode === 'work' ? currentTimer.cyclesCompleted + 1 : 0;
    const newTimerState = createTimerState(mode as 'work' | 'shortBreak' | 'longBreak', taskId, cyclesCompleted);
    set({ timerState: newTimerState });
    
    // Clean timer state before saving
    const timerStateToSave = { ...newTimerState };
    if (!timerStateToSave.taskId) {
      delete timerStateToSave.taskId;
    }
    await saveTimerState(currentUserId, timerStateToSave);
  },
  
  pauseTimer: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const currentTimer = get().timerState;
    if (currentTimer) {
      const pausedTimer = pauseTimer(currentTimer);
      set({ timerState: pausedTimer });
      
      // Clean timer state before saving
      const timerStateToSave = { ...pausedTimer };
      if (!timerStateToSave.taskId) {
        delete timerStateToSave.taskId;
      }
      await saveTimerState(currentUserId, timerStateToSave);
    }
  },
  
  resumeTimer: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const currentTimer = get().timerState;
    if (currentTimer) {
      const resumedTimer = resumeTimer(currentTimer);
      set({ timerState: resumedTimer });
      
      // Clean timer state before saving
      const timerStateToSave = { ...resumedTimer };
      if (!timerStateToSave.taskId) {
        delete timerStateToSave.taskId;
      }
      await saveTimerState(currentUserId, timerStateToSave);
    }
  },
  
  stopTimer: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const currentTimer = get().timerState;
    if (currentTimer) {
      completeSession(currentTimer);
      set({ timerState: null });
      await saveTimerState(currentUserId, null);
    }
  },
  
  skipTimer: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const currentTimer = get().timerState;
    if (currentTimer) {
      completeSession(currentTimer);
      const nextMode = getNextMode(currentTimer.mode as 'work' | 'shortBreak' | 'longBreak', currentTimer.cyclesCompleted);
      const newCycles = currentTimer.mode === 'work' ? currentTimer.cyclesCompleted + 1 : currentTimer.cyclesCompleted;
      
      if (nextMode === 'work') {
        const newTimerState = createTimerState('work', undefined, newCycles);
        set({ timerState: newTimerState });
        await saveTimerState(currentUserId, newTimerState);
      } else {
        set({ timerState: null });
        await saveTimerState(currentUserId, null);
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

  };
});