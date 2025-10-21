import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserStats, LeaderboardEntry } from '../types';

const COLLECTIONS = {
  USER_STATS: 'userStats',
  LEADERBOARD: 'leaderboard'
};

// ذخیره آمار کاربر
export const saveUserStats = async (userId: string, userStats: UserStats): Promise<void> => {
  try {
    await setDoc(doc(db, COLLECTIONS.USER_STATS, userId), {
      ...userStats,
      lastUpdated: new Date().toISOString()
    });
    console.log('User stats saved successfully');
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
};

// دریافت آمار یک کاربر
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    const userStatsDoc = await getDocs(query(collection(db, COLLECTIONS.USER_STATS), where('userId', '==', userId)));
    if (!userStatsDoc.empty) {
      const data = userStatsDoc.docs[0].data();
      return data as UserStats;
    }
    return null;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

// دریافت آمار همه کاربران
export const getAllUserStats = async (): Promise<UserStats[]> => {
  try {
    const userStatsSnapshot = await getDocs(collection(db, COLLECTIONS.USER_STATS));
    const userStats: UserStats[] = [];
    
    userStatsSnapshot.forEach((doc) => {
      const data = doc.data();
      userStats.push(data as UserStats);
    });
    
    console.log('Loaded user stats from database:', userStats.length, 'users');
    return userStats;
  } catch (error) {
    console.error('Error getting all user stats:', error);
    return [];
  }
};

// محاسبه leaderboard
export const calculateLeaderboard = (userStats: UserStats[]): LeaderboardEntry[] => {
  // مرتب‌سازی بر اساس totalHours
  const sortedStats = userStats.sort((a, b) => b.totalHours - a.totalHours);
  
  return sortedStats.map((stats, index) => ({
    userId: stats.userId,
    userName: stats.userName || 'کاربر ناشناس',
    totalHours: stats.totalHours,
    streak: stats.streak,
    rank: index + 1
  }));
};

// ذخیره leaderboard
export const saveLeaderboard = async (leaderboard: LeaderboardEntry[]): Promise<void> => {
  try {
    await setDoc(doc(db, COLLECTIONS.LEADERBOARD, 'current'), {
      leaderboard,
      lastUpdated: new Date().toISOString()
    });
    console.log('Leaderboard saved successfully');
  } catch (error) {
    console.error('Error saving leaderboard:', error);
  }
};

// دریافت leaderboard
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const leaderboardDoc = await getDocs(query(collection(db, COLLECTIONS.LEADERBOARD), where('__name__', '==', 'current')));
    if (!leaderboardDoc.empty) {
      const data = leaderboardDoc.docs[0].data();
      return data.leaderboard || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};

// Subscribe to real-time leaderboard updates
export const subscribeToLeaderboard = (callback: (leaderboard: LeaderboardEntry[]) => void): Unsubscribe => {
  return onSnapshot(doc(db, COLLECTIONS.LEADERBOARD, 'current'), (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.leaderboard || []);
    } else {
      callback([]);
    }
  });
};

// Subscribe to real-time user stats updates
export const subscribeToUserStats = (callback: (userStats: UserStats[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, COLLECTIONS.USER_STATS), (snapshot) => {
    const userStats: UserStats[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      userStats.push(data as UserStats);
    });
    callback(userStats);
  });
};

// به‌روزرسانی leaderboard
export const updateLeaderboard = async (): Promise<void> => {
  try {
    const allUserStats = await getAllUserStats();
    const leaderboard = calculateLeaderboard(allUserStats);
    await saveLeaderboard(leaderboard);
    console.log('Leaderboard updated successfully');
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
};

// محاسبه آمار همه کاربران از focus sessions واقعی
export const calculateAllUsersStats = async (): Promise<UserStats[]> => {
  try {
    // دریافت همه focus sessions از همه کاربران
    const focusSessionsSnapshot = await getDocs(collection(db, 'focusSessions'));
    const allFocusSessions = focusSessionsSnapshot.docs.map(doc => doc.data());
    
    // دریافت همه tasks از همه کاربران  
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    const allTasks = tasksSnapshot.docs.map(doc => doc.data());
    
    // گروه‌بندی sessions بر اساس userId
    const userSessionsMap = new Map<string, any[]>();
    const userTasksMap = new Map<string, any[]>();
    
    allFocusSessions.forEach(session => {
      if (session.userId) {
        if (!userSessionsMap.has(session.userId)) {
          userSessionsMap.set(session.userId, []);
        }
        userSessionsMap.get(session.userId)!.push(session);
      }
    });
    
    allTasks.forEach(task => {
      if (task.userId) {
        if (!userTasksMap.has(task.userId)) {
          userTasksMap.set(task.userId, []);
        }
        userTasksMap.get(task.userId)!.push(task);
      }
    });
    
    // محاسبه آمار برای هر کاربر
    const allUserStats: UserStats[] = [];
    
    for (const [userId, sessions] of userSessionsMap) {
      const userTasks = userTasksMap.get(userId) || [];
      
      // محاسبه مجموع ساعت‌ها
      const totalMinutes = sessions
        .filter(session => session.type === 'work' && session.completed)
        .reduce((total, session) => total + Math.round(session.durationSec / 60), 0);
      const totalHours = totalMinutes / 60;
      
      // محاسبه استریک
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const daySessions = sessions.filter(session => {
          const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
          return sessionDate === dateStr && session.type === 'work' && session.completed;
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
      
      // محاسبه آمار روزانه
      const dailyStats = [];
      const startDate = new Date();
      startDate.setDate(today.getDate() - 30);
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const daySessions = sessions.filter(session => {
          const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
          return sessionDate === dateStr && session.type === 'work' && session.completed;
        });
        
        const dayTasks = userTasks.filter(task => task.date === dateStr);
        
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
      
      allUserStats.push({
        userId,
        userName: `کاربر ${userId.slice(-4)}`, // نام موقت
        streak,
        totalHours,
        totalFocusMinutes: totalMinutes,
        lastUpdate: new Date().toISOString(),
        dailyStats
      });
    }
    
    console.log('Calculated stats for all users:', allUserStats.length);
    return allUserStats;
  } catch (error) {
    console.error('Error calculating all users stats:', error);
    return [];
  }
};
