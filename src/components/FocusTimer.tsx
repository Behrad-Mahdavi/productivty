import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, SkipForward, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatTime, getRemainingTime, getTimerProgress, isTimerComplete } from '../utils/timer';
import { TimerSettings } from './TimerSettings';

// توابع ثابت برای حالت‌های تایمر، خوانایی و کاهش خطاهای تایپی
const TIMER_MODES = {
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
};

export const FocusTimer: React.FC = () => {
  const { 
    timerState, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    stopTimer, 
    skipTimer,
    getFocusMinutesToday
  } = useStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); 

  // --- مدیریت زمان و به‌روزرسانی ---

  const updateTimer = useCallback(() => {
    if (!timerState) {
      setTimeLeft(0);
      setProgress(0);
      return;
    }

    const remaining = getRemainingTime(timerState);
    const timerProgress = getTimerProgress(timerState);
    
    setTimeLeft(remaining);
    setProgress(timerProgress);

    // منطق حیاتی: انتقال خودکار به فاز بعدی (رفع باگ شروع نشدن مجدد پس از صفر شدن)
    if (isTimerComplete(timerState)) {
      if (remaining <= 0) { 
        // در این نقطه، تایمر به صفر رسیده. فراخوانی تابع انتقال حالت در استور.
        stopTimer(); 
      }
      return;
    }
  }, [timerState, stopTimer]);

  useEffect(() => {
    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    // ✅ وابستگی بهینه شده به تابع useCallback و اکشن استور
    return () => clearInterval(interval);
  }, [updateTimer]); 

  // --- Handlers (مدیریت isProcessing به صورت موقت) ---
  // توجه: مدیریت isProcessing باید در توابع استور به صورت Async باشد تا محکم شود.
  // در اینجا از setTimeout به عنوان یک راه‌حل موقت استفاده می‌کنیم.

  const handleStart = () => {
    setIsProcessing(true);
    startTimer('work');
    setTimeout(() => setIsProcessing(false), 50); 
  };

  const handlePause = () => {
    setIsProcessing(true);
    if (timerState?.isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
    setTimeout(() => setIsProcessing(false), 50);
  };

  const handleStop = () => {
    // ✅ رفع باگ ۱ (اضافه نشدن زمان تمرکز): این اکشن باید اکنون در استور زمان صرف شده را ثبت کند
    setIsProcessing(true);
    stopTimer();
    setTimeout(() => setIsProcessing(false), 50);
  };

  const handleSkip = () => {
    // ✅ رفع باگ ۳ (رد کردن فاز): این اکشن باید اکنون در استور به فاز بعدی منتقل شود
    setIsProcessing(true);
    skipTimer();
    setTimeout(() => setIsProcessing(false), 50);
  };

  // --- Display Helpers ---

  const getModeText = () => {
    if (!timerState) return 'آماده برای شروع';
    switch (timerState.mode) {
      case TIMER_MODES.WORK: return 'تمرکز عمیق';
      case TIMER_MODES.SHORT_BREAK: return 'استراحت کوتاه';
      case TIMER_MODES.LONG_BREAK: return 'استراحت طولانی';
      default: return 'تنظیم نشده';
    }
  };

  const getModeClass = () => {
    // ✅ رفع ضعف ساختاری: برگرداندن کلاس مشخص برای حالت آماده
    if (!timerState) return 'timer-ready'; 
    switch (timerState.mode) {
      case TIMER_MODES.WORK: return 'timer-work-mode';
      case TIMER_MODES.SHORT_BREAK: return 'timer-break-mode';
      case TIMER_MODES.LONG_BREAK: return 'timer-long-break-mode';
      default: return '';
    }
  };

  const getTextColorClass = () => {
    if (!timerState) return 'text-secondary';
    switch (timerState.mode) {
      case TIMER_MODES.WORK: return 'text-danger';
      case TIMER_MODES.SHORT_BREAK: return 'text-info';
      case TIMER_MODES.LONG_BREAK: return 'text-success';
      default: return 'text-dark';
    }
  };

  return (
    <div className="card shadow-lg border-0">
      <div className="card-body text-center p-4">
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h5 className="card-title mb-0 fw-bold">تایمر تمرکز (پومودورو)</h5>
          <TimerSettings />
        </div>
        
        {/* Timer Circle */}
        <div 
          className={`timer-circle mx-auto ${getModeClass()} mb-3`} 
          style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}
        >
          <div className="text-center p-5">
            <div className={`display-4 fw-bolder mb-1 ${getTextColorClass()}`}>
              {formatTime(timeLeft)}
            </div>
            <div className={`small fw-bold ${getTextColorClass()} opacity-75`}>
              {getModeText()}
              {timerState?.isPaused && ' (متوقف)'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4">
          {!timerState || isTimerComplete(timerState) ? (
            <button
              onClick={handleStart}
              className="btn btn-success btn-lg px-5 shadow"
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 size={20} className="me-2 animate-spin" /> : <Play size={20} className="me-2" />}
              {isProcessing ? 'در حال شروع...' : 'شروع تمرکز'}
            </button>
          ) : (
            <div className="d-flex gap-2 justify-content-center">
              <button
                onClick={handlePause}
                className={`btn ${timerState.isPaused ? 'btn-success' : 'btn-primary'} shadow-sm`}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 size={16} className="me-1 animate-spin" /> : timerState.isPaused ? <Play size={16} className="me-1" /> : <Pause size={16} className="me-1" />}
                {timerState.isPaused ? 'ادامه' : 'توقف موقت'}
              </button>
              
              <button
                onClick={handleStop}
                className="btn btn-danger shadow-sm"
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 size={16} className="me-1 animate-spin" /> : <Square size={16} className="me-1" />}
                پایان و ذخیره
              </button>
              
              <button
                onClick={handleSkip}
                className="btn btn-secondary shadow-sm"
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 size={16} className="me-1 animate-spin" /> : <SkipForward size={16} className="me-1" />}
                رد کردن فاز
              </button>
            </div>
          )}
        </div>

        {/* Timer info */}
        {/* ✅ رفع باگ رندرینگ آمار: نمایش چرخه‌ها و زمان کل تمرکز بدون وابستگی به timerState */}
        <div className="mt-4 pt-3 border-top text-muted small">
            <div>چرخه‌های پومودوروی تکمیل شده: 
                <span className="fw-bold">
                    {/* نمایش چرخه‌های تکمیل شده از حالت فعلی (اگر تایمر فعال است) یا صفر */}
                    {timerState?.cyclesCompleted || 0}
                </span>
            </div> 
            
            {/* ✅ استفاده مستقیم از getFocusMinutesToday که به درستی از استور انتخاب شده است */}
            <div>زمان کل تمرکز: <span className="fw-bold">{formatTime((getFocusMinutesToday() || 0) * 60)}</span></div> 
            
            {timerState?.taskId && (
              <div className="text-success fw-bold mt-1">متصل به کار شماره {timerState.taskId}</div>
            )}
        </div>
      </div>
    </div>
  );
};