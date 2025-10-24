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
  
  // ✅ مدیریت خطا و وضعیت
  isProcessing: boolean;
  error: string | null;
  notification: { id: string; message: string; type: 'success' | 'error' } | null;
  
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
  
  // ✅ اکشن جدید برای برنامه‌ریزی فعال
  createTasksFromAssignment: (courseId: string, assignmentId: string, taskCount: number, minutesPerTask: number) => Promise<void>;
  
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
  moveToNextPhase: () => Promise<void>;
  
  // Computed values
  getTodayTasks: () => Task[];
  getOverdueTasks: () => Task[];
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
  
  // Helper functions (internal)
  _finalizeSession: (session: FocusSession) => Promise<void>;
  _syncGamification: () => Promise<void>;
  
  // ✅ اکشن‌های مدیریت خطا و اعلان
  setNotification: (message: string, type: 'success' | 'error') => void;
  clearNotification: () => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppStore>((set, get) => {
  let unsubscribeFunctions: (() => void)[] = [];

  // ✅ تابع کمکی ضدگلوله برای مدیریت خطا در عملیات async
  const withAsyncErrorHandling = <T extends any[]>(
    action: (...args: T) => Promise<void>,
    successMessage: string
  ) => async (...args: T) => {
    try {
      set({ isProcessing: true, error: null });
      await action(...args);
      get().setNotification(successMessage, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داد';
      get().setNotification(errorMessage, 'error');
      set({ error: errorMessage });
    } finally {
      set({ isProcessing: false });
    }
  };

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
    
    // ✅ مقادیر اولیه مدیریت خطا
    isProcessing: false,
    error: null,
    notification: null,
  
  setCurrentUserId: (userId: string | null) => {
    set({ currentUserId: userId });
  },

  setupRealtimeSync: (userId: string) => {
    console.log('Setting up real-time sync for user:', userId);
    
    // Clean up existing subscriptions only if there are any
    if (unsubscribeFunctions.length > 0) {
      console.log('Cleaning up existing subscriptions before setting up new ones');
      get().cleanupRealtimeSync();
    }
    
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
      
      // ✅ بررسی اینکه آیا تایمر در زمان دور بودن کاربر تمام شده
      if (timerState && !timerState.isPaused) {
        const elapsed = calculateElapsedTime(timerState);
        if (elapsed >= timerState.durationSec) {
          // تایمر در زمان دور بودن تمام شده - نهایی کردن سشن
          const session = completeSession(timerState);
          
          // تنظیم داده‌های اولیه برای _finalizeSession
          set({ 
            focusSessions: data.focusSessions,
            reflections: data.reflections
          });
          
          // نهایی کردن سشن با استفاده از تابع مشترک
          await get()._finalizeSession(session);
          
          // پاک کردن وضعیت تایمر
          set({ timerState: null });
          await saveTimerState(userId, null);
          return;
        }
      }
      
      console.log('Setting app data:', data);
      
      // ✅ ایمن‌سازی داده‌های courses - تضمین وجود assignments
      const safeCourses = (data.courses || []).map(course => ({
        ...course,
        assignments: course.assignments || []
      }));
      
      set({ 
        tasks: data.tasks || [],
        courses: safeCourses,
        reflections: data.reflections || [],
        focusSessions: data.focusSessions || [],
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
    
    // ✅ هماهنگ‌سازی گیمیفیکیشن بعد از تغییر تسک
    await get()._syncGamification();
  },
  
  // Course actions
  addCourse: withAsyncErrorHandling(
    async (courseData) => {
      const { currentUserId } = get();
      if (!currentUserId) throw new Error('کاربر وارد نشده است');
      
      const newCourse: Course = {
        ...courseData,
        id: `course_${Date.now()}`,
        // ✅ تضمین وجود آرایه assignments
        assignments: courseData.assignments || []
      };
      const updatedCourses = [...get().courses, newCourse];
      set({ courses: updatedCourses });
      await saveCourses(currentUserId, updatedCourses);
    },
    'درس با موفقیت اضافه شد'
  ),
  
  updateCourse: async (id, updates) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const updatedCourses = get().courses.map(course => 
      course.id === id ? { ...course, ...updates } : course
    );
    set({ courses: updatedCourses });
    await saveCourses(currentUserId, updatedCourses);
  },
  
  deleteCourse: withAsyncErrorHandling(
    async (id) => {
      const { currentUserId } = get();
      if (!currentUserId) throw new Error('کاربر وارد نشده است');
      
      const updatedCourses = get().courses.filter(course => course.id !== id);
      set({ courses: updatedCourses });
      await saveCourses(currentUserId, updatedCourses);
    },
    'درس با موفقیت حذف شد'
  ),

  // Assignment actions
  addAssignment: withAsyncErrorHandling(
    async (courseId, assignmentData) => {
      const { currentUserId } = get();
      if (!currentUserId) throw new Error('کاربر وارد نشده است');
      
      const newAssignment: Assignment = {
        ...assignmentData,
        id: `assignment_${Date.now()}`,
        courseId,
        // ✅ مقادیر پیش‌فرض برای فیلدهای جدید
        estimatedHours: assignmentData.estimatedHours || 0,
        linkedTaskIds: assignmentData.linkedTaskIds || []
      };
      
      const updatedCourses = get().courses.map(course =>
        course.id === courseId
          ? { ...course, assignments: [...course.assignments, newAssignment] }
          : course
      );
      
      set({ courses: updatedCourses });
      await saveCourses(currentUserId, updatedCourses);
    },
    'تکلیف با موفقیت اضافه شد'
  ),

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

  // ✅ اکشن جدید برای برنامه‌ریزی فعال - ایجاد تسک‌ها از تکلیف
  createTasksFromAssignment: withAsyncErrorHandling(
    async (courseId: string, assignmentId: string, taskCount: number, minutesPerTask: number) => {
      const { currentUserId } = get();
      if (!currentUserId) throw new Error('کاربر وارد نشده است');
      if (taskCount <= 0) throw new Error('تعداد تسک‌ها باید بیشتر از صفر باشد');
      if (minutesPerTask <= 0) throw new Error('مدت زمان هر تسک باید بیشتر از صفر باشد');
      
      // الف) دریافت اطلاعات تکلیف
      const course = get().courses.find(c => c.id === courseId);
      if (!course) throw new Error('درس مورد نظر یافت نشد');
      
      const assignment = course.assignments.find(a => a.id === assignmentId);
      if (!assignment) throw new Error('تکلیف مورد نظر یافت نشد');
      
      // ب) ایجاد تسک‌های جدید
      const newTasks: Task[] = [];
      const linkedTaskIds: string[] = [];
      
      for (let i = 1; i <= taskCount; i++) {
        const taskId = `task_${Date.now()}_${i}`;
        const newTask: Task = {
          id: taskId,
          title: `${assignment.title} - بخش ${i}`,
          category: 'دانشگاه',
          date: assignment.dueDate.split('T')[0], // تبدیل به YYYY-MM-DD
          done: false,
          createdAt: new Date().toISOString()
        };
        
        newTasks.push(newTask);
        linkedTaskIds.push(taskId);
      }
      
      // ج) اضافه کردن تسک‌های جدید به store
      const updatedTasks = [...get().tasks, ...newTasks];
      set({ tasks: updatedTasks });
      await saveTasks(currentUserId, updatedTasks);
      
      // د) لینک کردن تسک‌ها به تکلیف
      const updatedCourses = get().courses.map(course =>
        course.id === courseId
          ? {
              ...course,
              assignments: course.assignments.map(assignment =>
                assignment.id === assignmentId
                  ? { ...assignment, linkedTaskIds: [...assignment.linkedTaskIds, ...linkedTaskIds] }
                  : assignment
              )
            }
          : course
      );
      
      set({ courses: updatedCourses });
      await saveCourses(currentUserId, updatedCourses);
    },
    'تسک‌های برنامه‌ریزی با موفقیت ایجاد شدند'
  ),
  
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
      // ✅ فقط اگر تایمر واقعاً در حال اجرا بوده و مدت زمان معناداری داشته
      if (!currentTimer.isPaused && currentTimer.remainingSec < currentTimer.durationSec && currentTimer.remainingSec > 0) {
        const session = completeSession(currentTimer);
        await get()._finalizeSession(session);
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
      // ✅ فقط اگر تایمر واقعاً در حال اجرا بوده و مدت زمان معناداری داشته
      if (!currentTimer.isPaused && currentTimer.remainingSec < currentTimer.durationSec && currentTimer.remainingSec > 0) {
        const session = completeSession(currentTimer);
        await get()._finalizeSession(session);
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
  
  moveToNextPhase: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    const currentTimer = get().timerState;
    if (currentTimer) {
      // ✅ نهایی کردن سشن فعلی
      const session = completeSession(currentTimer);
      await get()._finalizeSession(session);
      
      // انتقال به فاز بعدی در چرخه Pomodoro
      const nextMode = getNextMode(currentTimer.mode as 'work' | 'shortBreak' | 'longBreak', currentTimer.cyclesCompleted);
      const newCycles = currentTimer.mode === 'work' ? currentTimer.cyclesCompleted + 1 : currentTimer.cyclesCompleted;
      
      if (nextMode === 'work') {
        // شروع سشن کار جدید
        const newTimerState = createTimerState('work', undefined, newCycles);
        set({ timerState: newTimerState });
        await saveTimerState(currentUserId, newTimerState);
      } else {
        // شروع سشن استراحت
        const newTimerState = createTimerState(nextMode, undefined, newCycles);
        set({ timerState: newTimerState });
        await saveTimerState(currentUserId, newTimerState);
      }
    }
  },
  
  // Computed values
  getTodayTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(task => task.date === today);
  },
  
  getOverdueTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(task => task.date < today && !task.done);
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
      // ✅ بررسی ایمنی: مطمئن شو assignments وجود دارد و آرایه است
      if (course.assignments && Array.isArray(course.assignments)) {
        course.assignments.forEach(assignment => {
          if (!assignment.done && assignment.dueDate < today) {
            overdue.push(assignment);
          }
        });
      }
    });
    
    return overdue;
  },

  // Timer settings actions
  updateTimerSettings: withAsyncErrorHandling(
    async (settings: Partial<TimerSettings>) => {
      const { currentUserId } = get();
      if (!currentUserId) throw new Error('کاربر وارد نشده است');
      
      const currentSettings = get().timerSettings;
      const newSettings = { ...currentSettings, ...settings };
      
      set({ timerSettings: newSettings });
      await setDoc(doc(db, 'timerSettings', currentUserId), newSettings);
    },
    'تنظیمات تایمر با موفقیت ذخیره شد'
  ),

  addFocusSession: withAsyncErrorHandling(
    async (minutes: number) => {
      const { currentUserId } = get();
      if (!currentUserId) throw new Error('کاربر وارد نشده است');
      if (minutes <= 0) throw new Error('مدت زمان باید بیشتر از صفر باشد');
      
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
      await saveFocusSessions(currentUserId, updatedSessions);
      
      // ✅ هماهنگ‌سازی گیمیفیکیشن بعد از اضافه کردن سشن
      await get()._syncGamification();
    },
    'سشن تمرکز با موفقیت اضافه شد'
  ),

  updateFocusSession: withAsyncErrorHandling(
    async (sessionId: string, minutes: number) => {
      const { currentUserId } = get();
      if (!currentUserId) throw new Error('کاربر وارد نشده است');
      if (minutes <= 0) throw new Error('مدت زمان باید بیشتر از صفر باشد');
      
      const sessions = get().focusSessions;
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) throw new Error('سشن مورد نظر یافت نشد');
      
      const session = sessions[sessionIndex];
      const updatedSession = {
        ...session,
        durationSec: minutes * 60,
        endTime: new Date(new Date(session.startTime).getTime() + minutes * 60 * 1000).toISOString()
      };
      
      const updatedSessions = [...sessions];
      updatedSessions[sessionIndex] = updatedSession;
      set({ focusSessions: updatedSessions });
      await saveFocusSessions(currentUserId, updatedSessions);
      
      // ✅ هماهنگ‌سازی گیمیفیکیشن بعد از ویرایش سشن
      await get()._syncGamification();
    },
    'سشن تمرکز با موفقیت ویرایش شد'
  ),

  deleteFocusSession: withAsyncErrorHandling(
    async (sessionId: string) => {
      const { currentUserId } = get();
      if (!currentUserId) throw new Error('کاربر وارد نشده است');
      
      const sessions = get().focusSessions;
      const sessionExists = sessions.some(s => s.id === sessionId);
      if (!sessionExists) throw new Error('سشن مورد نظر یافت نشد');
      
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      set({ focusSessions: updatedSessions });
      await saveFocusSessions(currentUserId, updatedSessions);
      
      // ✅ هماهنگ‌سازی گیمیفیکیشن بعد از حذف سشن
      await get()._syncGamification();
    },
    'سشن تمرکز با موفقیت حذف شد'
  ),

  // ✅ تابع کمکی برای نهایی کردن سشن - حذف تکرار کد
  _finalizeSession: async (session: FocusSession) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    // اضافه کردن سشن به focusSessions
    const updatedFocusSessions = [...get().focusSessions, session];
    set({ focusSessions: updatedFocusSessions });
    await saveFocusSessions(currentUserId, updatedFocusSessions);
    
    // اضافه کردن focus minutes به reflection اگر سشن کار باشد
    if (session.type === 'work' && session.durationSec > 0) {
      const focusMinutes = Math.round(session.durationSec / 60);
      const today = new Date().toISOString().split('T')[0];
      
      // دریافت یا ایجاد reflection امروز
      const todayReflection = get().reflections.find(r => r.date === today);
      if (todayReflection) {
        // به‌روزرسانی reflection موجود
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
        // ایجاد reflection جدید با focus minutes
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
    
    // هماهنگ‌سازی گیمیفیکیشن
    await get()._syncGamification();
  },

  // ✅ لایه هماهنگ‌سازی گیمیفیکیشن - به‌روزرسانی خودکار آمار
  _syncGamification: async () => {
    const { currentUserId, gamification } = get();
    if (!currentUserId || !gamification) return;
    
    try {
      // محاسبه مجدد آمار کاربر
      const updatedUserStats = get().calculateUserStats(currentUserId);
      
      // به‌روزرسانی آمار در store
      const updatedGamification = {
        ...gamification,
        userStats: [updatedUserStats], // تبدیل به آرایه
        lastUpdated: new Date().toISOString()
      };
      set({ gamification: updatedGamification });
      
      // به‌روزرسانی لیدربورد در سرور
      await get().updateLeaderboard();
    } catch (error) {
      console.error('Error syncing gamification data:', error);
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

    // ✅ رفع باگ محاسبه Streak - شروع از دیروز و مدیریت صحیح روز جاری
    let streak = 0;
    const today = new Date();
    
    // تابع کمکی برای محاسبه دقیق تاریخ روزانه (بدون اثرگذاری ساعت)
    const getDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // ✅ شروع از دیروز (i=1) نه امروز (i=0)
    for (let i = 1; i <= 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      const dateStr = getDateString(checkDate);
      
      const daySessions = focusSessions.filter(session => {
        const sessionDate = getDateString(new Date(session.startTime));
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
    
    // ✅ بررسی امروز فقط اگر دیروز تمرکز داشته‌ای
    if (streak > 0) {
      const todayStr = getDateString(today);
      const todaySessions = focusSessions.filter(session => {
        const sessionDate = getDateString(new Date(session.startTime));
        return sessionDate === todayStr && session.type === 'work';
      });
      
      const todayMinutes = todaySessions.reduce((total, session) => 
        total + Math.round(session.durationSec / 60), 0
      );
      
      if (todayMinutes > 0) {
        streak++;
      }
    }

    // ✅ محاسبه dailyStats با استفاده از تابع کمکی
    const dailyStats = [];
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = daysDiff; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = getDateString(date);
      
      const daySessions = focusSessions.filter(session => {
        const sessionDate = getDateString(new Date(session.startTime));
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
      userName: 'کاربر', // این باید از context کاربر بیاد
      streak,
      totalHours,
      totalFocusMinutes: totalMinutes,
      lastUpdate: now.toISOString(),
      dailyStats
    };
  },

  updateLeaderboard: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    
    try {
      const { updateLeaderboard } = await import('../utils/gamificationStorage');
      await updateLeaderboard();
      console.log('Leaderboard updated successfully');
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  },

  loadGamificationData: async (_userId: string) => {
    try {
      const { getAllUserStats, getLeaderboard } = await import('../utils/gamificationStorage');
      
      const [userStats, leaderboard] = await Promise.all([
        getAllUserStats(),
        getLeaderboard()
      ]);
      
      const gamificationData: GamificationData = {
        leaderboard,
        userStats,
        lastUpdated: new Date().toISOString()
      };
      
      set({ gamification: gamificationData });
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  },

  // ✅ اکشن‌های مدیریت خطا و اعلان
  setNotification: (message: string, type: 'success' | 'error') => {
    const id = `notification_${Date.now()}`;
    set({ 
      notification: { id, message, type },
      error: null // پاک کردن خطای قبلی
    });
    
    // پاک کردن خودکار اعلان بعد از 5 ثانیه
    setTimeout(() => {
      const currentNotification = get().notification;
      if (currentNotification?.id === id) {
        set({ notification: null });
      }
    }, 5000);
  },

  clearNotification: () => {
    set({ notification: null });
  },

  setError: (error: string | null) => {
    set({ error });
  }

  };
});