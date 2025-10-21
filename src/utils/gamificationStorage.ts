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

// ایجاد کاربران نمونه برای تست
export const createSampleUsers = async (): Promise<void> => {
  try {
    const sampleUsers: UserStats[] = [
      {
        userId: 'sample_user_1',
        userName: 'بهراد',
        streak: 12,
        totalHours: 45.5,
        totalFocusMinutes: 2730,
        lastUpdate: new Date().toISOString(),
        dailyStats: []
      },
      {
        userId: 'sample_user_2',
        userName: 'رادمان',
        streak: 8,
        totalHours: 38.2,
        totalFocusMinutes: 2292,
        lastUpdate: new Date().toISOString(),
        dailyStats: []
      },
      {
        userId: 'sample_user_3',
        userName: 'مهدیسا',
        streak: 15,
        totalHours: 32.1,
        totalFocusMinutes: 1926,
        lastUpdate: new Date().toISOString(),
        dailyStats: []
      }
    ];

    // ذخیره کاربران نمونه
    for (const user of sampleUsers) {
      await saveUserStats(user.userId, user);
    }

    console.log('Sample users created successfully');
  } catch (error) {
    console.error('Error creating sample users:', error);
  }
};
