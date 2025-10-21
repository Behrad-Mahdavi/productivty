import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Target, 
  TrendingUp,
  Medal,
  Zap
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useUser } from '../contexts/UserContext';
import type { LeaderboardEntry, UserStats } from '../types';

export const GamificationDashboard: React.FC = () => {
  const { currentUser } = useUser();
  const { focusSessions, tasks } = useStore();
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // محاسبه آمار کاربر فعلی
  useEffect(() => {
    if (!currentUser) return;

    const calculateUserStats = () => {
      const now = new Date();
      const startDate = new Date();
      
      if (timeRange === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setDate(now.getDate() - 30);
      }

      // فیلتر کردن sessions بر اساس بازه زمانی
      const filteredSessions = focusSessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= startDate && sessionDate <= now && session.type === 'work';
      });

      // محاسبه مجموع ساعت‌ها
      const totalMinutes = filteredSessions.reduce((total, session) => 
        total + Math.round(session.durationSec / 60), 0
      );
      const totalHours = totalMinutes / 60;

      // محاسبه استریک
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

      // محاسبه آمار روزانه
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
        userId: currentUser.id,
        streak,
        totalHours,
        totalFocusMinutes: totalMinutes,
        lastUpdate: now.toISOString(),
        dailyStats
      };
    };

    const stats = calculateUserStats();
    setUserStats(stats);
  }, [currentUser, focusSessions, tasks, timeRange]);

  // شبیه‌سازی leaderboard (در آینده از Firestore می‌آید)
  useEffect(() => {
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        userId: 'user1',
        userName: 'بهراد',
        totalHours: 45.5,
        streak: 12,
        rank: 1
      },
      {
        userId: 'user2',
        userName: 'رادمان',
        totalHours: 38.2,
        streak: 8,
        rank: 2
      },
      {
        userId: 'user3',
        userName: 'مهدیسا',
        totalHours: 32.1,
        streak: 15,
        rank: 3
      }
    ];

    // اضافه کردن کاربر فعلی اگر در لیست نیست
    if (currentUser && userStats) {
      const currentUserEntry = mockLeaderboard.find(entry => entry.userId === currentUser.id);
      if (!currentUserEntry) {
        mockLeaderboard.push({
          userId: currentUser.id,
          userName: currentUser.name,
          totalHours: userStats.totalHours,
          streak: userStats.streak,
          rank: mockLeaderboard.length + 1
        });
      }
    }

    // مرتب‌سازی بر اساس totalHours
    mockLeaderboard.sort((a, b) => b.totalHours - a.totalHours);
    mockLeaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLeaderboard(mockLeaderboard);
  }, [currentUser, userStats]);

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Medal className="text-yellow-500" size={20} />;
      case 2: return <Medal className="text-gray-400" size={20} />;
      case 3: return <Medal className="text-orange-500" size={20} />;
      default: return <span className="text-muted">#{rank}</span>;
    }
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 15) return '🔥 آتشین!';
    if (streak >= 7) return '💪 عالی!';
    if (streak >= 3) return '🌱 شروع خوب!';
    return '🚀 شروع کن!';
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="h2 mb-2 fw-bold text-dark">🏆 رقابت دوستان</h1>
            <p className="text-muted mb-4">ببینید چه کسی بیشتر کار می‌کند!</p>
            
            <div className="btn-group" role="group">
              <button
                className={`btn ${timeRange === 'weekly' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setTimeRange('weekly')}
              >
                هفتگی
              </button>
              <button
                className={`btn ${timeRange === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setTimeRange('monthly')}
              >
                ماهانه
              </button>
            </div>
          </div>

          {/* User Stats Cards */}
          {userStats && (
            <div className="row g-4 mb-5">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <Clock className="text-primary mb-3" size={32} />
                    <h3 className="text-primary mb-1">{formatTime(userStats.totalHours)}</h3>
                    <p className="text-muted mb-0">ساعت کار</p>
                    <small className="text-success">{timeRange === 'weekly' ? 'این هفته' : 'این ماه'}</small>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <Flame className="text-warning mb-3" size={32} />
                    <h3 className="text-warning mb-1">{userStats.streak}</h3>
                    <p className="text-muted mb-0">روز متوالی</p>
                    <small className="text-success">{getStreakMessage(userStats.streak)}</small>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <Target className="text-success mb-3" size={32} />
                    <h3 className="text-success mb-1">{userStats.dailyStats.reduce((sum, day) => sum + day.completedTasks, 0)}</h3>
                    <p className="text-muted mb-0">تسک انجام‌شده</p>
                    <small className="text-success">مجموع {timeRange === 'weekly' ? 'هفته' : 'ماه'}</small>
                  </div>
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <TrendingUp className="text-info mb-3" size={32} />
                    <h3 className="text-info mb-1">{Math.round(userStats.totalHours / (timeRange === 'weekly' ? 7 : 30) * 10) / 10}</h3>
                    <p className="text-muted mb-0">میانگین روزانه</p>
                    <small className="text-success">ساعت در روز</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="row g-4 mb-5">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light">
                  <div className="d-flex align-items-center">
                    <Trophy className="text-warning me-2" size={24} />
                    <h6 className="mb-0">جدول رتبه‌بندی</h6>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>رتبه</th>
                          <th>نام</th>
                          <th>ساعت کار</th>
                          <th>استریک</th>
                          <th>وضعیت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry) => (
                          <tr 
                            key={entry.userId}
                            className={entry.userId === currentUser?.id ? 'table-primary' : ''}
                          >
                            <td className="fw-bold">
                              {getRankIcon(entry.rank)}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" 
                                     style={{ width: '32px', height: '32px' }}>
                                  <span className="text-white fw-bold">
                                    {entry.userName.charAt(0)}
                                  </span>
                                </div>
                                <span className="fw-bold">{entry.userName}</span>
                                {entry.userId === currentUser?.id && (
                                  <span className="badge bg-primary ms-2">شما</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="fw-bold text-success">
                                {formatTime(entry.totalHours)}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <Flame className="text-warning me-1" size={16} />
                                <span className="fw-bold">{entry.streak} روز</span>
                              </div>
                            </td>
                            <td>
                              {entry.rank === 1 && <span className="badge bg-warning text-dark">🥇 اول</span>}
                              {entry.rank === 2 && <span className="badge bg-secondary">🥈 دوم</span>}
                              {entry.rank === 3 && <span className="badge bg-warning">🥉 سوم</span>}
                              {entry.rank > 3 && <span className="badge bg-light text-dark">#{entry.rank}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Progress Chart */}
          {userStats && (
            <div className="row g-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light">
                    <div className="d-flex align-items-center">
                      <TrendingUp className="text-success me-2" size={24} />
                      <h6 className="mb-0">پیشرفت روزانه</h6>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {userStats.dailyStats.slice(-7).map((day) => (
                        <div key={day.date} className="col">
                          <div className="text-center">
                            <div className="mb-2">
                              <small className="text-muted">
                                {new Date(day.date).toLocaleDateString('fa-IR', { 
                                  weekday: 'short',
                                  day: 'numeric'
                                })}
                              </small>
                            </div>
                            <div className="mb-2">
                              <div className="progress" style={{ height: '80px' }}>
                                <div
                                  className="progress-bar bg-success"
                                  style={{ 
                                    height: `${Math.min(100, (day.workedHours / 8) * 100)}%`,
                                    transform: 'rotate(180deg)',
                                    transformOrigin: 'bottom'
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="d-flex justify-content-between small">
                              <span className="text-success">{Math.round(day.workedHours * 10) / 10}h</span>
                              <span className="text-muted">{day.completedTasks}تسک</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Motivation Messages */}
          <div className="row g-4 mt-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <Zap className="text-warning mb-3" size={32} />
                  <h5 className="text-warning mb-2">
                    {userStats && userStats.streak >= 7 
                      ? '🔥 شما در حال آتش گرفتن هستید!' 
                      : userStats && userStats.streak >= 3 
                      ? '💪 عالی! ادامه دهید!' 
                      : '🚀 شروع کنید و رکورد بزنید!'
                    }
                  </h5>
                  <p className="text-muted mb-0">
                    {userStats && userStats.totalHours > 0 
                      ? `شما ${formatTime(userStats.totalHours)} کار کرده‌اید. ${leaderboard.find(l => l.userId === currentUser?.id)?.rank ? `رتبه شما: ${leaderboard.find(l => l.userId === currentUser?.id)?.rank}` : ''}`
                      : 'اولین ساعت کار خود را شروع کنید!'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
