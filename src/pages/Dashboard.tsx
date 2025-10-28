import React, { useState } from 'react';
import { Plus, Target, TrendingUp, Clock, BookOpen, Brain, Flame } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { FocusTimer } from '../components/FocusTimer';
import { ReflectionForm } from '../components/ReflectionForm';
import { DateDisplay } from '../components/DateDisplay';

export const Dashboard: React.FC = React.memo(() => {
  // ✅ بهینه‌سازی Selectors - فقط داده‌های مورد نیاز
  const getTodayTasks = useStore(state => state.getTodayTasks);
  const getOverdueTasks = useStore(state => state.getOverdueTasks);
  const getTodayProgress = useStore(state => state.getTodayProgress);
  const getFocusMinutesToday = useStore(state => state.getFocusMinutesToday);
  const getOverdueAssignments = useStore(state => state.getOverdueAssignments);
  const startTimer = useStore(state => state.startTimer);
  const timerState = useStore(state => state.timerState);
  
  // ✅ اضافه کردن focusSessions برای reactivity
  useStore(state => state.focusSessions);
  
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  
  const todayTasks = getTodayTasks();
  const overdueTasks = getOverdueTasks();
  const progress = getTodayProgress();
  const focusMinutes = getFocusMinutesToday();
  const overdueAssignments = getOverdueAssignments();
  
  // ✅ محاسبه Streak - تعداد روزهای متوالی تمرکز
  const calculateStreak = () => {
    const focusSessions = useStore.getState().focusSessions;
    if (!focusSessions || focusSessions.length === 0) return 0;
    
    // مرتب‌سازی بر اساس startTime
    const sortedSessions = focusSessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // بررسی روزهای متوالی
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].startTime);
      sessionDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const handleStartTimer = (taskId: string) => {
    startTimer('work', taskId);
  };

  const stats = [
    {
      title: 'پیشرفت امروز',
      value: `${progress}%`,
      icon: Target,
      color: 'text-success',
      bgColor: 'bg-success bg-opacity-10',
      description: 'از کارهای امروز',
    },
    {
      title: 'دقیقه تمرکز',
      value: focusMinutes,
      icon: Clock,
      color: 'text-info',
      bgColor: 'bg-info bg-opacity-10',
      description: 'زمان مفید امروز',
    },
    {
      title: 'کارهای امروز',
      value: todayTasks.length,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary bg-opacity-10',
      description: 'تسک‌های تعریف شده',
    },
    {
      title: 'تکالیف عقب‌افتاده',
      value: overdueAssignments.length,
      icon: BookOpen,
      color: 'text-danger',
      bgColor: 'bg-danger bg-opacity-10',
      description: 'نیاز به توجه',
    },
    {
      title: 'Streak',
      value: calculateStreak(),
      icon: Flame,
      color: 'text-warning',
      bgColor: 'bg-warning bg-opacity-10',
      description: 'روزهای متوالی تمرکز',
    },
  ];

  // ✅ Check if timer is active for Flow Mode
  const isTimerActive = timerState && !timerState.isPaused;

  return (
    <div className={`dashboard-container ${isTimerActive ? 'flow-mode' : ''}`}>
      {/* Header with improved hierarchy */}
      <div className={`d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between mb-5 gap-4 ${isTimerActive ? 'dimmed' : ''}`}>
        <div className="flex-grow-1">
          <h1 className="h1 mb-2 fw-bold text-dark">
            سلام! 👋
          </h1>
          <DateDisplay variant="compact" showTime={true} />
          <p className="text-muted mt-2 mb-0">آماده‌ای برای یک روز پربار؟ 🌅</p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-lg-auto">
          <button
            onClick={() => setShowReflectionForm(true)}
            className="btn btn-success flex-fill px-4 py-3"
          >
            <Brain size={18} className="me-2" />
            بازتاب روزانه
          </button>
          <button
            onClick={() => setShowTaskForm(true)}
            className="btn btn-primary flex-fill px-4 py-3"
          >
            <Plus size={18} className="me-2" />
            کار جدید
          </button>
        </div>
      </div>

      {/* Date Card */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-4">
          <DateDisplay variant="card" showTime={true} />
        </div>
        <div className="col-12 col-lg-8">
          <div className="row g-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="col-6 col-lg-4">
                  <div className={`card h-100 ${stat.bgColor} border-0 card-hover fade-in-up`}>
                    <div className="card-body text-center p-4">
                      <div className={`${stat.color} mb-3`}>
                        <Icon size={28} />
                      </div>
                      <h3 className="h3 mb-2 fw-bold number-display stat-counter">{stat.value}</h3>
                      <h6 className="h6 mb-1 fw-semibold text-dark">{stat.title}</h6>
                      <p className="text-muted mb-0 small">{stat.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-4">
        {/* Focus Timer - مرکز تجربه */}
        <div className={`col-lg-4 ${isTimerActive ? 'timer-focused' : ''}`}>
          <div className={`timer-section ${isTimerActive ? 'focused' : ''}`}>
            <FocusTimer />
          </div>
        </div>

        {/* Today's Tasks */}
        <div className={`col-lg-8 ${isTimerActive ? 'dimmed' : ''}`}>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">کارهای امروز</h5>
              <div className="d-flex align-items-center gap-2">
                <div className="progress" style={{ width: '120px', height: '8px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <small className="text-muted">{progress}%</small>
              </div>
            </div>
            
            <div className="card-body">
              {todayTasks.length === 0 ? (
                <div className="text-center py-5">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-5">
                      <div className="mb-4">
                        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '80px', height: '80px'}}>
                          <Target size={40} className="text-primary" />
                        </div>
                      </div>
                      <h4 className="h4 mb-3 text-dark">اولین قدم روزت رو تعریف کن 🌅</h4>
                      <p className="text-muted mb-4 fs-6">هر سفر بزرگ با یک قدم کوچک شروع می‌شه. بیا اولین کار امروزت رو اضافه کنیم!</p>
                      <button
                        onClick={() => setShowTaskForm(true)}
                        className="btn btn-primary btn-lg px-4 py-3"
                      >
                        <Plus size={20} className="me-2" />
                        شروع کن
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Today's Tasks */}
                  <div>
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                        <Target className="text-primary" size={16} />
                      </div>
                      <h6 className="mb-0 text-primary">کارهای امروز ({todayTasks.length})</h6>
                    </div>
                    {todayTasks.map((task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onStartTimer={handleStartTimer}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Overdue Tasks Section */}
        {overdueTasks.length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-danger">
                <div className="card-header bg-danger bg-opacity-10">
                  <div className="d-flex align-items-center">
                    <div className="bg-danger bg-opacity-20 rounded-circle p-2 me-2">
                      <Target className="text-danger" size={16} />
                    </div>
                    <h5 className="mb-0 text-danger">کارهای گذشته ({overdueTasks.length})</h5>
                  </div>
                </div>
                <div className="card-body">
                  {overdueTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onStartTimer={handleStartTimer}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Overdue Assignments Alert */}
      {overdueAssignments.length > 0 && (
        <div className="alert alert-danger mt-4">
          <div className="d-flex align-items-center">
            <BookOpen className="me-2" />
            <div>
              <strong>{overdueAssignments.length} تکلیف عقب‌افتاده</strong>
              <div className="small">
                {overdueAssignments.map(a => a.title).join('، ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      {showTaskForm && (
        <TaskForm onClose={() => setShowTaskForm(false)} />
      )}
      {showReflectionForm && (
        <ReflectionForm onClose={() => setShowReflectionForm(false)} />
      )}
    </div>
  );
});