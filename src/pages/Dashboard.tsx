import React, { useState } from 'react';
import { Plus, Target, TrendingUp, Clock, BookOpen, Brain } from 'lucide-react';
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
  
  // ✅ اضافه کردن focusSessions برای reactivity
  useStore(state => state.focusSessions);
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  
  const todayTasks = getTodayTasks();
  const overdueTasks = getOverdueTasks();
  const progress = getTodayProgress();
  const focusMinutes = getFocusMinutesToday();
  const overdueAssignments = getOverdueAssignments();
  

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
    },
    {
      title: 'دقیقه تمرکز',
      value: focusMinutes,
      icon: Clock,
      color: 'text-info',
      bgColor: 'bg-info bg-opacity-10',
    },
    {
      title: 'کارهای امروز',
      value: todayTasks.length,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary bg-opacity-10',
    },
    {
      title: 'تکالیف عقب‌افتاده',
      value: overdueAssignments.length,
      icon: BookOpen,
      color: 'text-danger',
      bgColor: 'bg-danger bg-opacity-10',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="h2 mb-1 fw-bold text-dark">داشبورد</h1>
          <DateDisplay variant="compact" showTime={true} />
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto">
          <button
            onClick={() => setShowReflectionForm(true)}
            className="btn btn-success flex-fill"
          >
            <Brain size={16} className="me-1" />
            بازتاب روزانه
          </button>
          <button
            onClick={() => setShowTaskForm(true)}
            className="btn btn-primary flex-fill"
          >
            <Plus size={16} className="me-1" />
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
          <div className="row g-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="col-6">
                  <div className={`card h-100 ${stat.bgColor}`}>
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <p className="card-text text-muted small mb-1">{stat.title}</p>
                          <h4 className={`mb-0 ${stat.color}`}>{stat.value}</h4>
                        </div>
                        <Icon className={`${stat.color} fs-4`} />
                      </div>
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
        {/* Focus Timer */}
        <div className="col-lg-4">
          <FocusTimer />
        </div>

        {/* Today's Tasks */}
        <div className="col-lg-8">
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
                    <div className="card-body">
                      <Target size={48} className="text-muted mb-3" />
                      <h5 className="text-muted mb-2">هیچ کاری برای امروز تعریف نشده</h5>
                      <p className="text-muted mb-4">برای شروع، کار جدیدی اضافه کنید</p>
                      <button
                        onClick={() => setShowTaskForm(true)}
                        className="btn btn-primary"
                      >
                        <Plus size={16} className="me-1" />
                        اولین کار را اضافه کن
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