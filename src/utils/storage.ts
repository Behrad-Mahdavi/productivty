import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { debounce } from 'lodash';
import { db } from '../config/firebase';
import type { Task, Course, Reflection, FocusSession, TimerState, AppData, TimerSettings } from '../types';

// Firestore collection names
const COLLECTIONS = {
  TASKS: 'tasks',
  COURSES: 'courses', 
  REFLECTIONS: 'reflections',
  FOCUS_SESSIONS: 'focusSessions',
  TIMER_STATE: 'timerState'
};

// ✅ Data Cleansing Functions برای حذف فیلدهای undefined
const cleanTaskData = (task: Task): any => {
  const cleaned: any = { ...task };
  
  // حذف فیلدهای undefined
  if (cleaned.description === undefined) delete cleaned.description;
  if (cleaned.priority === undefined) delete cleaned.priority;
  if (cleaned.tags === undefined) delete cleaned.tags;
  if (cleaned.estimatedMinutes === undefined) delete cleaned.estimatedMinutes;
  
  return cleaned;
};

const cleanSessionData = (session: FocusSession): any => {
  const cleaned: any = { ...session };
  
  // ✅ پاکسازی فیلد اختیاری taskId
  if (cleaned.taskId === undefined) {
    delete cleaned.taskId;
  }
  
  return cleaned;
};

const cleanReflectionData = (reflection: Reflection): any => {
  const cleaned: any = { ...reflection };
  
  // حذف فیلدهای undefined
  if (cleaned.focusMinutes === undefined) delete cleaned.focusMinutes;
  if (cleaned.note === undefined) delete cleaned.note;
  if (cleaned.rating === undefined) delete cleaned.rating;
  
  return cleaned;
};

const cleanAssignmentData = (assignment: any): any => {
  const cleaned: any = { ...assignment };
  
  // حذف فیلدهای undefined
  if (cleaned.description === undefined) delete cleaned.description;
  if (cleaned.estimatedHours === undefined) delete cleaned.estimatedHours;
  if (cleaned.linkedTaskIds === undefined) delete cleaned.linkedTaskIds;
  
  return cleaned;
};

// ✅ Debounced save functions برای بهینه‌سازی عملکرد
const saveTasksDebounced = debounce(async (userId: string, tasks: Task[]) => {
  try {
    const cleanedTasks = tasks.map(cleanTaskData);
    await setDoc(doc(db, COLLECTIONS.TASKS, userId), { tasks: cleanedTasks });
    console.log('Tasks saved to Firestore (debounced)');
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}, 300);

const saveCoursesDebounced = debounce(async (userId: string, courses: Course[]) => {
  try {
    const cleanedCourses = courses.map(course => ({
      ...course,
      assignments: course.assignments.map(cleanAssignmentData)
    }));
    await setDoc(doc(db, COLLECTIONS.COURSES, userId), { courses: cleanedCourses });
    console.log('Courses saved to Firestore (debounced)');
  } catch (error) {
    console.error('Error saving courses:', error);
  }
}, 300);

const saveReflectionsDebounced = debounce(async (userId: string, reflections: Reflection[]) => {
  try {
    const cleanedReflections = reflections.map(cleanReflectionData);
    await setDoc(doc(db, COLLECTIONS.REFLECTIONS, userId), { reflections: cleanedReflections });
    console.log('Reflections saved to Firestore (debounced)');
  } catch (error) {
    console.error('Error saving reflections:', error);
  }
}, 300);

const saveFocusSessionsDebounced = debounce(async (userId: string, focusSessions: FocusSession[]) => {
  try {
    const cleanedSessions = focusSessions.map(cleanSessionData);
    await setDoc(doc(db, COLLECTIONS.FOCUS_SESSIONS, userId), { focusSessions: cleanedSessions });
    console.log('Focus sessions saved to Firestore (debounced)');
  } catch (error) {
    console.error('Error saving focus sessions:', error);
  }
}, 300);

// Load all data for a user from Firestore
export const loadData = async (userId: string): Promise<AppData> => {
  console.log('Loading data for user:', userId);
  try {
    const [tasksSnapshot, coursesSnapshot, reflectionsSnapshot, focusSessionsSnapshot, timerStateSnapshot, timerSettingsSnapshot] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.TASKS), where('userId', '==', userId))),
      getDocs(query(collection(db, COLLECTIONS.COURSES), where('userId', '==', userId))),
      getDocs(query(collection(db, COLLECTIONS.REFLECTIONS), where('userId', '==', userId))),
      getDocs(query(collection(db, COLLECTIONS.FOCUS_SESSIONS), where('userId', '==', userId))),
      getDoc(doc(db, COLLECTIONS.TIMER_STATE, userId)),
      getDoc(doc(db, 'timerSettings', userId))
    ]);

    const tasks: Task[] = [];
    tasksSnapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        title: data.title,
        category: data.category || 'شخصی',
        date: data.date || new Date().toISOString().split('T')[0],
        done: data.done,
        createdAt: data.createdAt
      });
    });
    console.log('Loaded tasks:', tasks.length);

    const courses: Course[] = [];
    coursesSnapshot.forEach((doc) => {
      const data = doc.data();
      courses.push({
        id: doc.id,
        name: data.name,
        code: data.code,
        instructor: data.instructor,
        assignments: data.assignments || []
      });
    });

    const reflections: Reflection[] = [];
    reflectionsSnapshot.forEach((doc) => {
      const data = doc.data();
      reflections.push({
        date: data.date,
        good: data.good,
        distraction: data.distraction,
        improve: data.improve,
        focusMinutes: data.focusMinutes
      });
    });

    const focusSessions: FocusSession[] = [];
    focusSessionsSnapshot.forEach((doc) => {
      const data = doc.data();
      focusSessions.push({
        id: doc.id,
        taskId: data.taskId || undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        durationSec: data.durationSec,
        completed: data.completed,
        type: data.type
      });
    });

    const timerState: TimerState | null = timerStateSnapshot.exists() ? {
      mode: timerStateSnapshot.data().mode,
      startTime: timerStateSnapshot.data().startTime || new Date(timerStateSnapshot.data().startTimestamp).toISOString(),
      durationSec: timerStateSnapshot.data().durationSec,
      remainingSec: timerStateSnapshot.data().remainingSec,
      taskId: timerStateSnapshot.data().taskId,
      cyclesCompleted: timerStateSnapshot.data().cyclesCompleted,
      isPaused: timerStateSnapshot.data().isPaused
    } : null;

    const timerSettings: TimerSettings = timerSettingsSnapshot.exists() ? {
      workDuration: timerSettingsSnapshot.data().workDuration || 25,
      shortBreakDuration: timerSettingsSnapshot.data().shortBreakDuration || 5,
      longBreakDuration: timerSettingsSnapshot.data().longBreakDuration || 15,
      cyclesBeforeLongBreak: timerSettingsSnapshot.data().cyclesBeforeLongBreak || 4
    } : {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      cyclesBeforeLongBreak: 4
    };

    return {
      tasks,
      courses,
      reflections,
      focusSessions,
      timerState: timerState || {
        mode: 'work',
        startTime: new Date().toISOString(),
        durationSec: 25 * 60,
        remainingSec: 25 * 60,
        cyclesCompleted: 0,
        isPaused: false
      },
      timerSettings
    };
  } catch (error) {
    console.error('Error loading data from Firestore:', error);
    return {
      tasks: [],
      courses: [],
      reflections: [],
      focusSessions: [],
      timerState: {
        mode: 'work',
        startTime: new Date().toISOString(),
        durationSec: 25 * 60,
        remainingSec: 25 * 60,
        cyclesCompleted: 0,
        isPaused: false
      },
      timerSettings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        cyclesBeforeLongBreak: 4
      }
    };
  }
};

// Save all data for a user to Firestore
export const saveData = async (userId: string, data: AppData): Promise<void> => {
  try {
    await Promise.all([
      saveTasks(userId, data.tasks),
      saveCourses(userId, data.courses),
      saveReflections(userId, data.reflections),
      saveFocusSessions(userId, data.focusSessions),
      saveTimerState(userId, data.timerState ?? null)
    ]);
  } catch (error) {
    console.error('Error saving data to Firestore:', error);
  }
};

// Save tasks to Firestore
export const saveTasks = async (userId: string, tasks: Task[]): Promise<void> => {
  // ✅ استفاده از debounced function برای بهینه‌سازی عملکرد
  saveTasksDebounced(userId, tasks);
};

// Save courses to Firestore
export const saveCourses = async (userId: string, courses: Course[]): Promise<void> => {
  // ✅ استفاده از debounced function برای بهینه‌سازی عملکرد
  saveCoursesDebounced(userId, courses);
};

// Save reflections to Firestore
export const saveReflections = async (userId: string, reflections: Reflection[]): Promise<void> => {
  // ✅ استفاده از debounced function برای بهینه‌سازی عملکرد
  saveReflectionsDebounced(userId, reflections);
};

// Save focus sessions to Firestore
export const saveFocusSessions = async (userId: string, focusSessions: FocusSession[]): Promise<void> => {
  // ✅ استفاده از debounced function برای بهینه‌سازی عملکرد
  saveFocusSessionsDebounced(userId, focusSessions);
};

// Save timer state to Firestore
export const saveTimerState = async (userId: string, timerState: TimerState | null): Promise<void> => {
  try {
    if (timerState) {
      const timerData: any = {
        userId,
        mode: timerState.mode,
        startTime: timerState.startTime,
        durationSec: timerState.durationSec,
        remainingSec: timerState.remainingSec,
        cyclesCompleted: timerState.cyclesCompleted,
        isPaused: timerState.isPaused
      };
      
      // ✅ فقط اگر taskId وجود دارد و undefined نیست اضافه کن
      if (timerState.taskId !== undefined && timerState.taskId !== null) {
        timerData.taskId = timerState.taskId;
      }
      
      await setDoc(doc(db, COLLECTIONS.TIMER_STATE, userId), timerData);
    } else {
      await deleteDoc(doc(db, COLLECTIONS.TIMER_STATE, userId));
    }
  } catch (error) {
    console.error('Error saving timer state to Firestore:', error);
  }
};

// Load timer state from Firestore
export const loadTimerState = async (userId: string): Promise<TimerState> => {
  try {
    const timerStateDoc = await getDoc(doc(db, COLLECTIONS.TIMER_STATE, userId));
    if (timerStateDoc.exists()) {
      const data = timerStateDoc.data();
      return {
        mode: data.mode,
        startTime: data.startTime || new Date(data.startTimestamp).toISOString(),
        durationSec: data.durationSec,
        remainingSec: data.remainingSec,
        taskId: data.taskId || undefined,
        cyclesCompleted: data.cyclesCompleted,
        isPaused: data.isPaused
      };
    }
  } catch (error) {
    console.error('Error loading timer state from Firestore:', error);
  }

  return {
    mode: 'work',
    startTime: new Date().toISOString(),
    durationSec: 25 * 60,
    remainingSec: 25 * 60,
    cyclesCompleted: 0,
    isPaused: false
  };
};

// Real-time sync functions
export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void): Unsubscribe => {
  console.log('Subscribing to tasks for user:', userId);
  return onSnapshot(
    query(collection(db, COLLECTIONS.TASKS), where('userId', '==', userId)),
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          title: data.title,
          category: data.category || 'شخصی',
          date: data.date || new Date().toISOString().split('T')[0],
          done: data.done,
          createdAt: data.createdAt
        });
      });
      console.log('Real-time tasks update:', tasks.length);
      callback(tasks);
    },
    (error) => {
      console.error('Error in tasks subscription:', error);
    }
  );
};

export const subscribeToCourses = (userId: string, callback: (courses: Course[]) => void): Unsubscribe => {
  console.log('Subscribing to courses for user:', userId);
  return onSnapshot(
    query(collection(db, COLLECTIONS.COURSES), where('userId', '==', userId)),
    (snapshot) => {
      const courses: Course[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        courses.push({
          id: doc.id,
          name: data.name,
          code: data.code,
          instructor: data.instructor,
          assignments: data.assignments || []
        });
      });
      console.log('Real-time courses update:', courses.length);
      callback(courses);
    },
    (error) => {
      console.error('Error in courses subscription:', error);
    }
  );
};

export const subscribeToReflections = (userId: string, callback: (reflections: Reflection[]) => void): Unsubscribe => {
  console.log('Subscribing to reflections for user:', userId);
  return onSnapshot(
    query(collection(db, COLLECTIONS.REFLECTIONS), where('userId', '==', userId)),
    (snapshot) => {
      const reflections: Reflection[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reflections.push({
          date: data.date,
          good: data.good,
          distraction: data.distraction,
          improve: data.improve,
          focusMinutes: data.focusMinutes
        });
      });
      console.log('Real-time reflections update:', reflections.length);
      callback(reflections);
    },
    (error) => {
      console.error('Error in reflections subscription:', error);
    }
  );
};

export const subscribeToFocusSessions = (userId: string, callback: (sessions: FocusSession[]) => void): Unsubscribe => {
  console.log('Subscribing to focus sessions for user:', userId);
  return onSnapshot(
    query(collection(db, COLLECTIONS.FOCUS_SESSIONS), where('userId', '==', userId)),
    (snapshot) => {
      const sessions: FocusSession[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          taskId: data.taskId || undefined,
          startTime: data.startTime,
          endTime: data.endTime,
          durationSec: data.durationSec,
          completed: data.completed,
          type: data.type
        });
      });
      console.log('Real-time focus sessions update:', sessions.length);
      callback(sessions);
    },
    (error) => {
      console.error('Error in focus sessions subscription:', error);
    }
  );
};