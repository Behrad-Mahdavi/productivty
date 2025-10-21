import type { UserStats, LeaderboardEntry } from '../types';

const GAMIFICATION_STORAGE_KEY = 'gamification_data';

export interface GamificationStorage {
  userStats: { [userId: string]: UserStats };
  lastUpdated: string;
}

// ذخیره آمار کاربر در localStorage
export const saveUserStats = (userId: string, stats: UserStats): void => {
  try {
    const existingData = getGamificationData();
    existingData.userStats[userId] = stats;
    existingData.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(existingData));
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
};

// دریافت آمار کاربر
export const getUserStats = (userId: string): UserStats | null => {
  try {
    const data = getGamificationData();
    return data.userStats[userId] || null;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

// دریافت همه آمار کاربران
export const getAllUserStats = (): UserStats[] => {
  try {
    const data = getGamificationData();
    return Object.values(data.userStats);
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

// دریافت داده‌های گیمیفیکیشن
export const getGamificationData = (): GamificationStorage => {
  try {
    const stored = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error parsing gamification data:', error);
  }
  
  return {
    userStats: {},
    lastUpdated: new Date().toISOString()
  };
};

// پاک کردن داده‌های گیمیفیکیشن
export const clearGamificationData = (): void => {
  localStorage.removeItem(GAMIFICATION_STORAGE_KEY);
};
