import React, { useState, useEffect, useMemo } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { DateDisplay } from '../components/DateDisplay';
import { PersianDatePicker } from '../components/PersianDatePicker';

export const TasksPage: React.FC = React.memo(() => {
  // ✅ بهینه‌سازی Selectors - فقط داده‌های مورد نیاز
  const tasks = useStore(state => state.tasks);
  const startTimer = useStore(state => state.startTimer);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState<'همه' | 'دانشگاه' | 'پروژه' | 'شخصی'>('همه');
  const [statusFilter, setStatusFilter] = useState<'همه' | 'انجام‌شده' | 'انجام‌نشده'>('همه');

  // ✅ ریست کردن فیلترها با تغییر تاریخ برای بهبود UX
  useEffect(() => {
    // فقط اگر فیلترها روی حالت پیش‌فرض نیستند، آن‌ها را ریست کن
    if (categoryFilter !== 'همه' || statusFilter !== 'همه') {
      setCategoryFilter('همه');
      setStatusFilter('همه');
    }
  }, [selectedDate]);

  // ✅ بهینه‌سازی عملکرد با useMemo - فیلترینگ فقط در صورت تغییر وابستگی‌ها
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const dateMatch = task.date === selectedDate;
      const categoryMatch = categoryFilter === 'همه' || task.category === categoryFilter;
      const statusMatch = statusFilter === 'همه' || 
        (statusFilter === 'انجام‌شده' && task.done) ||
        (statusFilter === 'انجام‌نشده' && !task.done);
      
      return dateMatch && categoryMatch && statusMatch;
    });
  }, [tasks, selectedDate, categoryFilter, statusFilter]); // ✅ وابستگی‌های مشخص

  const handleStartTimer = (taskId: string) => {
    startTimer('work', taskId);
  };

  const completedTasks = filteredTasks.filter(task => task.done).length;
  const totalTasks = filteredTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h2 mb-1 fw-bold text-dark">مدیریت کارها</h1>
          <p className="text-muted mb-0 fs-6">سازمان‌دهی و پیگیری کارهای روزانه</p>
        </div>
        <button
          onClick={() => setShowTaskForm(true)}
          className="btn btn-success"
        >
          <Plus size={16} className="me-1" />
          کار جدید
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <PersianDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                label="تاریخ"
              />
            </div>
            
            <div className="col-md-4">
              <label className="form-label">دسته‌بندی</label>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
              >
                <option value="همه">همه</option>
                <option value="دانشگاه">دانشگاه</option>
                <option value="پروژه">پروژه</option>
                <option value="شخصی">شخصی</option>
              </select>
            </div>
            
            <div className="col-md-4">
              <label className="form-label">وضعیت</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="همه">همه</option>
                <option value="انجام‌شده">انجام‌شده</option>
                <option value="انجام‌نشده">انجام‌نشده</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">پیشرفت روزانه</h6>
              <span className="text-muted small">{completedTasks} از {totalTasks}</span>
            </div>
            <div className="progress">
              <div 
                className="progress-bar bg-success" 
                style={{ width: `${progress}%` }}
              >
                {progress}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            کارهای امروز
          </h5>
          <DateDisplay date={new Date(selectedDate)} variant="compact" />
        </div>
        
        <div className="card-body">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <CheckCircle size={48} className="mb-3 opacity-50" />
              <p className="mb-2">هیچ کاری برای این تاریخ یافت نشد</p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="btn btn-success btn-sm"
              >
                اولین کار را اضافه کن
              </button>
            </div>
          ) : (
            <div>
              {filteredTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStartTimer={handleStartTimer}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Form */}
      {showTaskForm && (
        <TaskForm 
          onClose={() => setShowTaskForm(false)} 
          defaultDate={selectedDate} // ✅ ارسال تاریخ انتخاب‌شده
        />
      )}
    </div>
  );
});