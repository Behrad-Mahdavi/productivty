import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Task, Course, Reflection, FocusSession, TimerState, AppData } from '../types';

// Firestore collection names
const COLLECTIONS = {
  TASKS: 'tasks',
  COURSES: 'courses', 
  REFLECTIONS: 'reflections',
  FOCUS_SESSIONS: 'focusSessions',
  TIMER_STATE: 'timerState'
};

// Load all data for a user from Firestore
export const loadData = async (userId: string): Promise<AppData> => {
  console.log('Loading data for user:', userId);
  try {
    const [tasksSnapshot, coursesSnapshot, reflectionsSnapshot, focusSessionsSnapshot, timerStateSnapshot] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.TASKS), where('userId', '==', userId))),
      getDocs(query(collection(db, COLLECTIONS.COURSES), where('userId', '==', userId))),
      getDocs(query(collection(db, COLLECTIONS.REFLECTIONS), where('userId', '==', userId))),
      getDocs(query(collection(db, COLLECTIONS.FOCUS_SESSIONS), where('userId', '==', userId))),
      getDoc(doc(db, COLLECTIONS.TIMER_STATE, userId))
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
        taskId: data.taskId,
        startTime: data.startTime,
        endTime: data.endTime,
        durationSec: data.durationSec,
        completed: data.completed,
        type: data.type
      });
    });

    const timerState: TimerState | null = timerStateSnapshot.exists() ? {
      mode: timerStateSnapshot.data().mode,
      startTimestamp: timerStateSnapshot.data().startTimestamp,
      durationSec: timerStateSnapshot.data().durationSec,
      remainingSec: timerStateSnapshot.data().remainingSec,
      taskId: timerStateSnapshot.data().taskId,
      cyclesCompleted: timerStateSnapshot.data().cyclesCompleted,
      isPaused: timerStateSnapshot.data().isPaused
    } : null;

    return {
      tasks,
      courses,
      reflections,
      focusSessions,
      timerState: timerState || {
        mode: 'idle',
        startTimestamp: 0,
        durationSec: 25 * 60,
        remainingSec: 25 * 60,
        cyclesCompleted: 0,
        isPaused: false
      }
    };
  } catch (error) {
    console.error('Error loading data from Firestore:', error);
    return {
      tasks: [],
      courses: [],
      reflections: [],
      focusSessions: [],
      timerState: {
        mode: 'idle',
        startTimestamp: 0,
        durationSec: 25 * 60,
        remainingSec: 25 * 60,
        cyclesCompleted: 0,
        isPaused: false
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
  try {
    // Get existing tasks
    const tasksSnapshot = await getDocs(query(collection(db, COLLECTIONS.TASKS), where('userId', '==', userId)));
    const existingTasks = new Map();
    tasksSnapshot.forEach((doc) => {
      existingTasks.set(doc.id, doc);
    });

    // Update or create tasks
    for (const task of tasks) {
      const taskData = {
        userId,
        title: task.title,
        category: task.category,
        date: task.date,
        done: task.done,
        createdAt: task.createdAt
      };

      if (existingTasks.has(task.id)) {
        await updateDoc(doc(db, COLLECTIONS.TASKS, task.id), taskData);
      } else {
        await setDoc(doc(db, COLLECTIONS.TASKS, task.id), taskData);
      }
    }

    // Delete removed tasks
    const currentTaskIds = new Set(tasks.map(t => t.id));
    for (const [taskId, taskDoc] of existingTasks) {
      if (!currentTaskIds.has(taskId)) {
        await deleteDoc(taskDoc.ref);
      }
    }
  } catch (error) {
    console.error('Error saving tasks to Firestore:', error);
  }
};

// Save courses to Firestore
export const saveCourses = async (userId: string, courses: Course[]): Promise<void> => {
  try {
    const coursesSnapshot = await getDocs(query(collection(db, COLLECTIONS.COURSES), where('userId', '==', userId)));
    const existingCourses = new Map();
    coursesSnapshot.forEach((doc) => {
      existingCourses.set(doc.id, doc);
    });

    for (const course of courses) {
      const courseData = {
        userId,
        name: course.name,
        code: course.code,
        instructor: course.instructor,
        assignments: course.assignments
      };

      if (existingCourses.has(course.id)) {
        await updateDoc(doc(db, COLLECTIONS.COURSES, course.id), courseData);
      } else {
        await setDoc(doc(db, COLLECTIONS.COURSES, course.id), courseData);
      }
    }

    const currentCourseIds = new Set(courses.map(c => c.id));
    for (const [courseId, courseDoc] of existingCourses) {
      if (!currentCourseIds.has(courseId)) {
        await deleteDoc(courseDoc.ref);
      }
    }
  } catch (error) {
    console.error('Error saving courses to Firestore:', error);
  }
};

// Save reflections to Firestore
export const saveReflections = async (userId: string, reflections: Reflection[]): Promise<void> => {
  try {
    const reflectionsSnapshot = await getDocs(query(collection(db, COLLECTIONS.REFLECTIONS), where('userId', '==', userId)));
    const existingReflections = new Map();
    reflectionsSnapshot.forEach((doc) => {
      existingReflections.set(doc.id, doc);
    });

    for (const reflection of reflections) {
      const reflectionData = {
        userId,
        date: reflection.date,
        good: reflection.good,
        distraction: reflection.distraction,
        improve: reflection.improve,
        focusMinutes: reflection.focusMinutes
      };

      // Find existing reflection by date
      const existingReflection = Array.from(existingReflections.values()).find(doc => doc.data().date === reflection.date);
      if (existingReflection) {
        await updateDoc(existingReflection.ref, reflectionData);
      } else {
        await setDoc(doc(db, COLLECTIONS.REFLECTIONS, `reflection_${Date.now()}`), reflectionData);
      }
    }

    // Delete removed reflections
    const currentReflectionDates = new Set(reflections.map(r => r.date));
    for (const [, reflectionDoc] of existingReflections) {
      if (!currentReflectionDates.has(reflectionDoc.data().date)) {
        await deleteDoc(reflectionDoc.ref);
      }
    }
  } catch (error) {
    console.error('Error saving reflections to Firestore:', error);
  }
};

// Save focus sessions to Firestore
export const saveFocusSessions = async (userId: string, focusSessions: FocusSession[]): Promise<void> => {
  try {
    const sessionsSnapshot = await getDocs(query(collection(db, COLLECTIONS.FOCUS_SESSIONS), where('userId', '==', userId)));
    const existingSessions = new Map();
    sessionsSnapshot.forEach((doc) => {
      existingSessions.set(doc.id, doc);
    });

    for (const session of focusSessions) {
      const sessionData = {
        userId,
        taskId: session.taskId,
        startTime: session.startTime,
        endTime: session.endTime,
        durationSec: session.durationSec,
        completed: session.completed,
        type: session.type
      };

      if (existingSessions.has(session.id)) {
        await updateDoc(doc(db, COLLECTIONS.FOCUS_SESSIONS, session.id), sessionData);
      } else {
        await setDoc(doc(db, COLLECTIONS.FOCUS_SESSIONS, session.id), sessionData);
      }
    }

    const currentSessionIds = new Set(focusSessions.map(s => s.id));
    for (const [sessionId, sessionDoc] of existingSessions) {
      if (!currentSessionIds.has(sessionId)) {
        await deleteDoc(sessionDoc.ref);
      }
    }
  } catch (error) {
    console.error('Error saving focus sessions to Firestore:', error);
  }
};

// Save timer state to Firestore
export const saveTimerState = async (userId: string, timerState: TimerState | null): Promise<void> => {
  try {
    if (timerState) {
      await setDoc(doc(db, COLLECTIONS.TIMER_STATE, userId), {
        userId,
        mode: timerState.mode,
        startTimestamp: timerState.startTimestamp,
        durationSec: timerState.durationSec,
        remainingSec: timerState.remainingSec,
        taskId: timerState.taskId,
        cyclesCompleted: timerState.cyclesCompleted,
        isPaused: timerState.isPaused
      });
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
        startTimestamp: data.startTimestamp,
        durationSec: data.durationSec,
        remainingSec: data.remainingSec,
        taskId: data.taskId,
        cyclesCompleted: data.cyclesCompleted,
        isPaused: data.isPaused
      };
    }
  } catch (error) {
    console.error('Error loading timer state from Firestore:', error);
  }

  return {
    mode: 'idle',
    startTimestamp: 0,
    durationSec: 25 * 60,
    remainingSec: 25 * 60,
    cyclesCompleted: 0,
    isPaused: false
  };
};