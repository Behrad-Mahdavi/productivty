import { create } from 'zustand';
import type { Task, Course, Reflection, FocusSession, TimerState, Assignment, TimerSettings, GamificationData, UserStats } from '../types';
import { 
  loadData, 
  saveTasks, 
  saveCourses, 
  saveReflections, 
  saveFocusSessions,
  saveTimerState,
  loadTimerState,
  subscribeToTasks,
  subscribeToCourses,
  subscribeToReflections,
  subscribeToFocusSessions
} from '../utils/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
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
  timerSettings: TimerSettings;
  currentUserId: string | null;
  gamification: GamificationData | null;
  
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
  
  // Timer settings actions
  updateTimerSettings: (settings: Partial<TimerSettings>) => Promise<void>;
  addFocusSession: (minutes: number) => Promise<void>;
  updateFocusSession: (sessionId: string, minutes: number) => Promise<void>;
  deleteFocusSession: (sessionId: string) => Promise<void>;
  
  // Gamification actions
  calculateUserStats: (userId: string) => UserStats;
  updateLeaderboard: () => Promise<void>;
  loadGamificationData: (userId: string) => Promise<void>;
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
    gamification: null,
    timerSettings: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      cyclesBeforeLongBreak: 4
    },
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
          // Timer completed while away - just complete the session and stop
          const session = completeSession(timerState);
          set({ focusSessions: [...data.focusSessions, session] });
          
          // Clear timer state instead of starting new one
          set({ timerState: null });
          await saveTimerState(userId, null);
          return;
        }
      }
      
      console.log('Setting app data:', data);
      set({ 
        tasks: data.tasks,
        courses: data.courses,
        reflections: data.reflections,
        focusSessions: data.focusSessions,
        timerState,
        timerSettings: data.timerSettings || {
          workDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          cyclesBeforeLongBreak: 4
        },
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
    const { currentUserId, timerSettings } = get();
    if (!currentUserId) return;

    const currentTimer = get().timerState;
    const cyclesCompleted = currentTimer?.mode === 'work' ? currentTimer.cyclesCompleted + 1 : 0;
    
    // Get duration from settings
    let durationMinutes: number;
    switch (mode) {
      case 'work':
        durationMinutes = timerSettings.workDuration;
        break;
      case 'shortBreak':
        durationMinutes = timerSettings.shortBreakDuration;
        break;
      case 'longBreak':
        durationMinutes = timerSettings.longBreakDuration;
        break;
      default:
        durationMinutes = 25;
    }
    
    const newTimerState = createTimerState(mode as 'work' | 'shortBreak' | 'longBreak', taskId, cyclesCompleted, durationMinutes * 60);
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
      // Complete the session and save focus minutes
      const session = completeSession(currentTimer);
      
      // Add session to focusSessions
      const updatedFocusSessions = [...get().focusSessions, session];
      set({ focusSessions: updatedFocusSessions });
      await saveFocusSessions(currentUserId, updatedFocusSessions);
      
      // Add focus minutes to today's reflection if it's a work session
      if (currentTimer.mode === 'work' && session.durationSec > 0) {
        const focusMinutes = Math.round(session.durationSec / 60);
        const today = new Date().toISOString().split('T')[0];
        
        // Get or create today's reflection
        const todayReflection = get().reflections.find(r => r.date === today);
        if (todayReflection) {
          // Update existing reflection
          const updatedReflection = {
            ...todayReflection,
            focusMinutes: (todayReflection.focusMinutes || 0) + focusMinutes
          };
          const updatedReflections = get().reflections.map(r => 
            r.date === today ? updatedReflection : r
          );
          set({ reflections: updatedReflections });
          await saveReflections(currentUserId, updatedReflections);
        } else {
          // Create new reflection with focus minutes
          const newReflection = {
            date: today,
            good: '',
            distraction: '',
            improve: '',
            focusMinutes: focusMinutes
          };
          const updatedReflections = [...get().reflections, newReflection];
          set({ reflections: updatedReflections });
          await saveReflections(currentUserId, updatedReflections);
        }
      }
      
      set({ timerState: null });
      await saveTimerState(currentUserId, null);
    }
  },
  
  skipTimer: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const currentTimer = get().timerState;
    if (currentTimer) {
      // Complete the session and save focus minutes
      const session = completeSession(currentTimer);
      
      // Add session to focusSessions
      const updatedFocusSessions = [...get().focusSessions, session];
      set({ focusSessions: updatedFocusSessions });
      await saveFocusSessions(currentUserId, updatedFocusSessions);
      
      // Add focus minutes to today's reflection if it's a work session
      if (currentTimer.mode === 'work' && session.durationSec > 0) {
        const focusMinutes = Math.round(session.durationSec / 60);
        const today = new Date().toISOString().split('T')[0];
        
        // Get or create today's reflection
        const todayReflection = get().reflections.find(r => r.date === today);
        if (todayReflection) {
          // Update existing reflection
          const updatedReflection = {
            ...todayReflection,
            focusMinutes: (todayReflection.focusMinutes || 0) + focusMinutes
          };
          const updatedReflections = get().reflections.map(r => 
            r.date === today ? updatedReflection : r
          );
          set({ reflections: updatedReflections });
          await saveReflections(currentUserId, updatedReflections);
        } else {
          // Create new reflection with focus minutes
          const newReflection = {
            date: today,
            good: '',
            distraction: '',
            improve: '',
            focusMinutes: focusMinutes
          };
          const updatedReflections = [...get().reflections, newReflection];
          set({ reflections: updatedReflections });
          await saveReflections(currentUserId, updatedReflections);
        }
      }
      
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

  // Timer settings actions
  updateTimerSettings: async (settings: Partial<TimerSettings>) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const currentSettings = get().timerSettings;
    const newSettings = { ...currentSettings, ...settings };
    
    set({ timerSettings: newSettings });
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'timerSettings', currentUserId), newSettings);
    } catch (error) {
      console.error('Error saving timer settings:', error);
    }
  },

  addFocusSession: async (minutes: number) => {
    const { currentUserId } = get();
    if (!currentUserId || minutes <= 0) return;
    
    const now = new Date();
    const session = {
      id: `manual_session_${Date.now()}`,
      taskId: undefined,
      startTime: new Date(now.getTime() - minutes * 60 * 1000).toISOString(),
      endTime: now.toISOString(),
      durationSec: minutes * 60,
      completed: true,
      type: 'work' as const
    };
    
    const updatedSessions = [...get().focusSessions, session];
    set({ focusSessions: updatedSessions });
    
    // Save to Firestore
    try {
      await saveFocusSessions(currentUserId, updatedSessions);
    } catch (error) {
      console.error('Error saving manual focus session:', error);
    }
  },

  updateFocusSession: async (sessionId: string, minutes: number) => {
    const { currentUserId } = get();
    if (!currentUserId || minutes <= 0) return;
    
    const sessions = get().focusSessions;
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return;
    
    const session = sessions[sessionIndex];
    const updatedSession = {
      ...session,
      durationSec: minutes * 60,
      endTime: new Date(new Date(session.startTime).getTime() + minutes * 60 * 1000).toISOString()
    };
    
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex] = updatedSession;
    set({ focusSessions: updatedSessions });
    
    // Save to Firestore
    try {
      await saveFocusSessions(currentUserId, updatedSessions);
    } catch (error) {
      console.error('Error updating focus session:', error);
    }
  },

  deleteFocusSession: async (sessionId: string) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const sessions = get().focusSessions;
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    set({ focusSessions: updatedSessions });
    
    // Save to Firestore
    try {
      await saveFocusSessions(currentUserId, updatedSessions);
    } catch (error) {
      console.error('Error deleting focus session:', error);
    }
  },

  // Gamification actions
  calculateUserStats: (userId: string) => {
    const { focusSessions, tasks } = get();
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 30); // Last 30 days

    // Filter sessions for the user and time range
    const userSessions = focusSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate && sessionDate <= now && session.type === 'work';
    });

    // Calculate total hours
    const totalMinutes = userSessions.reduce((total, session) => 
      total + Math.round(session.durationSec / 60), 0
    );
    const totalHours = totalMinutes / 60;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const daySessions = focusSessions.filter(session => {
        const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
        return sessionDate === dateStr && session.type === 'work';
      });
      
      const dayMinutes = daySessions.reduce((total, session) => 
        total + Math.round(session.durationSec / 60), 0
      );
      
      if (dayMinutes > 0) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate daily stats
    const dailyStats = [];
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = daysDiff; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = focusSessions.filter(session => {
        const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
        return sessionDate === dateStr && session.type === 'work';
      });
      
      const dayTasks = tasks.filter(task => task.date === dateStr);
      
      const workedHours = daySessions.reduce((total, session) => 
        total + Math.round(session.durationSec / 60), 0
      ) / 60;
      
      const completedTasks = dayTasks.filter(task => task.done).length;
      const focusMinutes = daySessions.reduce((total, session) => 
        total + Math.round(session.durationSec / 60), 0
      );
      
      dailyStats.push({
        date: dateStr,
        workedHours,
        completedTasks,
        focusMinutes
      });
    }

    return {
      userId,
      userName: 'کاربر', // این باید از context بیاد
      streak,
      totalHours,
      totalFocusMinutes: totalMinutes,
      lastUpdate: now.toISOString(),
      dailyStats
    };
  },

  updateLeaderboard: async () => {
    // This will be implemented to sync with Firestore
    // For now, we'll just update local state
    console.log('Updating leaderboard...');
  },

  loadGamificationData: async () => {
    // This will load gamification data from Firestore
    // For now, we'll just set up the structure
    const gamificationData: GamificationData = {
      leaderboard: [],
      userStats: [],
      lastUpdated: new Date().toISOString()
    };
    
    set({ gamification: gamificationData });
  }

  };
});