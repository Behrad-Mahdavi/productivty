import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Flame,
  TrendingUp,
  Star,
  Target,
  Brain,
  Activity
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatPersianDate, getPersianDayName } from '../utils/dateUtils';

export const StatsPage: React.FC = () => {
  const { tasks, reflections, focusSessions } = useStore();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [todayNote, setTodayNote] = useState('');
  const [todayRating, setTodayRating] = useState(0);

  // Force refresh to clear cache
  console.log('Stats page loaded - cache cleared');


  // محاسبه آمار بر اساس بازه زمانی انتخاب شده
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'daily':
        startDate.setDate(endDate.getDate());
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setDate(endDate.getDate() - 30);
        break;
    }
    
    return { startDate, endDate };
  };

  const stats = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= startDate && taskDate <= endDate;
    });

    const filteredReflections = reflections.filter(reflection => {
      const reflectionDate = new Date(reflection.date);
      return reflectionDate >= startDate && reflectionDate <= endDate;
    });

    const filteredFocusSessions = focusSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.done).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalFocusMinutes = filteredFocusSessions
      .filter(session => session.type === 'work')
      .reduce((total, session) => total + Math.round(session.durationSec / 60), 0);

    const reflectionDays = filteredReflections.length;
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      totalFocusMinutes,
      reflectionDays,
      totalDays
    };
  }, [tasks, reflections, focusSessions, timeRange]);

  // محاسبه آمار روزانه برای نمودار بر اساس بازه زمانی
  const dailyStats = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    const days = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = daysDiff; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => task.date === dateStr);
      const dayReflections = reflections.filter(reflection => reflection.date === dateStr);
      const dayFocusSessions = focusSessions.filter(session => {
        const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
        return sessionDate === dateStr;
      });

      const completedTasks = dayTasks.filter(task => task.done).length;
      const totalTasks = dayTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const focusMinutes = dayFocusSessions
        .filter(session => session.type === 'work')
        .reduce((total, session) => total + Math.round(session.durationSec / 60), 0);

      days.push({
        date: dateStr,
        dateLabel: formatPersianDate(date, 'short'),
        dayName: getPersianDayName(date),
        completionRate,
        focusMinutes,
        hasReflection: dayReflections.length > 0,
        totalTasks,
        completedTasks
      });
    }

    return days;
  }, [tasks, reflections, focusSessions, timeRange]);

  // آمار تمرکز بر اساس ساعت روز (داینامیک)
  const hourlyFocusStats = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      const hourSessions = focusSessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        const sessionHour = sessionDate.getHours();
        return sessionDate >= startDate && 
               sessionDate <= endDate && 
               sessionHour === hour && 
               session.type === 'work';
      });
      
      const totalMinutes = hourSessions.reduce((total, session) => 
        total + Math.round(session.durationSec / 60), 0
      );
      
      return {
        hour,
        label: `${hour}:00`,
        minutes: totalMinutes,
        sessions: hourSessions.length
      };
    });
  }, [focusSessions, timeRange]);

  // بهترین و ضعیف‌ترین روز
  const bestDay = dailyStats.reduce((best, day) => 
    day.focusMinutes > best.focusMinutes ? day : best, dailyStats[0] || { focusMinutes: 0 }
  );
  
  const worstDay = dailyStats.reduce((worst, day) => 
    day.focusMinutes < worst.focusMinutes ? day : worst, dailyStats[0] || { focusMinutes: 0 }
  );

  // Streak calculation (داینامیک)
  const streakDays = useMemo(() => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayFocusSessions = focusSessions.filter(session => {
        const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
        return sessionDate === dateStr;
      });
      
      const dayFocusMinutes = dayFocusSessions
        .filter(session => session.type === 'work')
        .reduce((total, session) => total + Math.round(session.durationSec / 60), 0);
      
      if (dayFocusMinutes > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [focusSessions]);
  
  // هدف هفتگی (داینامیک)
  const weeklyGoal = 15 * 60; // 15 hours in minutes
  const goalProgress = Math.min(100, (stats.totalFocusMinutes / weeklyGoal) * 100);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="h2 mb-2 fw-bold text-dark">آمار عملکرد من</h1>
            <p className="text-muted mb-4">مرور سریع بازده و تمرکز هفته اخیر</p>
            
            <div className="btn-group" role="group">
              <button
                className={`btn ${timeRange === 'daily' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setTimeRange('daily')}
              >
                روزانه
              </button>
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

          {/* Summary Cards */}
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <Clock className="text-primary mb-3" size={32} />
                  <h3 className="text-primary mb-1">{formatTime(stats.totalFocusMinutes)}</h3>
                  <p className="text-muted mb-0">زمان مفید</p>
                  <small className="text-success">مجموع دقایق ثبت‌شده تمرکز</small>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <CheckCircle className="text-success mb-3" size={32} />
                  <h3 className="text-success mb-1">{stats.completedTasks}</h3>
                  <p className="text-muted mb-0">کارهای انجام‌شده</p>
                  <small className="text-success">تعداد تسک‌های تیک‌خورده</small>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <Flame className="text-warning mb-3" size={32} />
                  <h3 className="text-warning mb-1">{streakDays}</h3>
                  <p className="text-muted mb-0">استمرار</p>
                  <small className="text-success">چند روز متوالی بدون وقفه</small>
                </div>
              </div>
            </div>
          </div>

          {/* Focus Trend Chart */}
          <div className="row g-4 mb-5">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light">
                  <h6 className="mb-0">روند تمرکز هفته</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    {dailyStats.map((day) => (
                      <div key={day.date} className="col">
                        <div className="text-center">
                          <div className="mb-2">
                            <small className="text-muted">{day.dateLabel}</small>
                          </div>
                          <div className="mb-2">
                            <div className="progress" style={{ height: '120px' }}>
                              <div
                                className="progress-bar bg-success"
                                style={{ 
                                  height: `${Math.min(100, (day.focusMinutes / 180) * 100)}%`,
                                  transform: 'rotate(180deg)',
                                  transformOrigin: 'bottom'
                                }}
                              ></div>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between small">
                            <span className="text-success">{day.focusMinutes}د</span>
                            <span className="text-muted">{day.completedTasks}/{day.totalTasks}</span>
                          </div>
                          {day.hasReflection && (
                            <div className="mt-1">
                              <Brain size={12} className="text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="row g-4 mb-5">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light">
                  <h6 className="mb-0">نقشه حرارتی تمرکز</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <div className="heatmap-container">
                        <div className="heatmap-grid">
                        {Array.from({ length: 7 }, (_, dayIndex) => (
                          <div key={dayIndex} className="heatmap-row">
                            {Array.from({ length: 24 }, (_, hourIndex) => {
                              const hour = hourlyFocusStats[hourIndex];
                              const intensity = Math.min(1, hour.minutes / 30); // Normalize to 0-1 (30 min max)
                              const hasData = hour.minutes > 0;
                              
                              return (
                                <div
                                  key={hourIndex}
                                  className="heatmap-cell"
                                  style={{
                                    backgroundColor: hasData 
                                      ? `rgba(34, 197, 94, ${Math.max(0.3, intensity)})` 
                                      : 'rgba(240, 240, 240, 0.3)',
                                    border: hasData ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(200, 200, 200, 0.3)',
                                    opacity: hasData ? 1 : 0.5
                                  }}
                                  title={`${hour.label}: ${hour.minutes} دقیقه`}
                                ></div>
                              );
                            })}
                          </div>
                        ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center">
                        <h6 className="text-muted mb-3">ساعات مؤثر</h6>
                        {hourlyFocusStats
                          .filter(stat => stat.minutes > 0)
                          .sort((a, b) => b.minutes - a.minutes)
                          .slice(0, 3)
                          .map((hour) => (
                            <div key={hour.hour} className="d-flex justify-content-between align-items-center mb-2">
                              <span>{hour.label}</span>
                              <span className="text-success">{hour.minutes}د</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insight Cards */}
          <div className="row g-4 mb-5">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <Target className="text-success me-2" size={24} />
                    <h6 className="mb-0">بهترین روز هفته</h6>
                  </div>
                  <h5 className="text-success mb-2">{bestDay.dayName} — {bestDay.focusMinutes} دقیقه</h5>
                  <p className="text-muted small mb-0">
                    {bestDay.focusMinutes > 120 ? 'روز فوق‌العاده‌ای بود! 🎉' : 'روز خوبی داشتید! 👍'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <Activity className="text-warning me-2" size={24} />
                    <h6 className="mb-0">ضعیف‌ترین روز</h6>
                  </div>
                  <h5 className="text-warning mb-2">{worstDay.dayName} — {worstDay.focusMinutes} دقیقه</h5>
                  <p className="text-muted small mb-0">
                    {worstDay.focusMinutes < 30 ? 'روز استراحت بود! 😴' : 'روز آرامی داشتید! 🌱'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress & Streak */}
          <div className="row g-4 mb-5">
            <div className="col-md-8">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light">
                  <h6 className="mb-0">پیشرفت هفتگی</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>هدفت: 15 ساعت تمرکز در هفته</span>
                    <span className="text-success">{Math.round(goalProgress)}%</span>
                  </div>
                  <div className="progress mb-3" style={{ height: '10px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${goalProgress}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between">
                    <small className="text-muted">{formatTime(stats.totalFocusMinutes)} / 15h</small>
                    <small className="text-success">
                      {goalProgress >= 100 ? '🎉 هدف محقق شد!' : `${Math.round((15 * 60 - stats.totalFocusMinutes) / 60)} ساعت باقی مانده`}
                    </small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <Flame className="text-warning mb-3" size={32} />
                  <h4 className="text-warning mb-1">{streakDays}</h4>
                  <p className="text-muted mb-0">روز متوالی</p>
                  <small className="text-success">
                    {streakDays > 7 ? '🔥 آتشین!' : streakDays > 3 ? '💪 عالی!' : '🌱 شروع خوب!'}
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Note */}
          <div className="row g-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light">
                  <h6 className="mb-0">یادداشت امروز</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="امروز حس تمرکزم چطور بود؟"
                        value={todayNote}
                        onChange={(e) => setTodayNote(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <div className="text-center">
                        <h6 className="text-muted mb-3">امتیاز امروز</h6>
                        <div className="d-flex justify-content-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={24}
                              className={`cursor-pointer ${
                                star <= todayRating ? 'text-warning fill-current' : 'text-muted'
                              }`}
                              onClick={() => setTodayRating(star)}
                            />
                          ))}
                        </div>
                        <small className="text-muted mt-2 d-block">
                          {todayRating === 0 ? 'امتیاز دهید' : 
                           todayRating === 1 ? 'خیلی ضعیف' :
                           todayRating === 2 ? 'ضعیف' :
                           todayRating === 3 ? 'متوسط' :
                           todayRating === 4 ? 'خوب' : 'عالی'}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {tasks.length === 0 && reflections.length === 0 && focusSessions.length === 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <TrendingUp className="text-muted mb-3" size={48} />
                <h5 className="text-muted mb-2">هنوز داده‌ای برای نمایش وجود ندارد</h5>
                <p className="text-muted mb-3">برای مشاهده آمار، ابتدا کارها و بازتاب‌هایی ثبت کنید</p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};