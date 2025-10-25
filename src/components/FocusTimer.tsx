import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, SkipForward, Loader2, Clock, Coffee, Zap } from 'lucide-react'; 
import { useStore } from '../store/useStore';
import { formatTime, getRemainingTime, getTimerProgress, isTimerComplete } from '../utils/timer';
import { TimerSettings } from './TimerSettings';

// توابع ثابت برای حالت‌های تایمر، خوانایی و کاهش خطاهای تایپی
const TIMER_MODES = {
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
} as const;

export const FocusTimer: React.FC = () => {
  // *** ✅ اصلاح: حذف completeCurrentTimer از انتخابگر که باعث ارور می‌شد ***
  // ✅ اضافه کردن focusMinutesToday به انتخابگر برای رفع باگ رندرینگ آمار
  const { 
    timerState, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    stopTimer, 
    skipTimer,
    moveToNextPhase,
    getFocusMinutesToday
  } = useStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ✅ Sound effects for better UX
  const playSound = (type: 'start' | 'end' | 'pause') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'start':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
          break;
        case 'end':
          oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
          break;
        case 'pause':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          break;
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Sound not supported, continue silently
    }
  };
  
  // ✅ محاسبه focusMinutesToday در component به جای selector
  const focusMinutesToday = getFocusMinutesToday(); 

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

    // ✅ اصلاح ساختاری: استفاده از moveToNextPhase برای انتقال خودکار به فاز بعدی
    if (isTimerComplete(timerState)) {
      if (remaining <= 0) { 
        moveToNextPhase(); // انتقال خودکار به فاز بعدی (تمرکز → استراحت → تمرکز)
      }
      return;
    }
  }, [timerState, moveToNextPhase]); // ✅ وابستگی به moveToNextPhase برای انتقال فاز

  useEffect(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [updateTimer]); 

  // --- Handlers ---

  const handleStart = () => {
    setIsProcessing(true);
    startTimer(TIMER_MODES.WORK);
    playSound('start');
    setTimeout(() => setIsProcessing(false), 50); 
  };

  const handlePause = () => {
    setIsProcessing(true);
    if (timerState?.isPaused) {
      resumeTimer();
      playSound('start');
    } else {
      pauseTimer();
      playSound('pause');
    }
    setTimeout(() => setIsProcessing(false), 50);
  };

  const handleStop = () => {
    setIsProcessing(true);
    stopTimer();
    setTimeout(() => setIsProcessing(false), 50);
  };

  const handleSkip = () => {
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
    if (!timerState) return 'timer-ready'; 
    switch (timerState.mode) {
      case TIMER_MODES.WORK: return 'timer-work-mode';
      case TIMER_MODES.SHORT_BREAK: return 'timer-break-mode';
      case TIMER_MODES.LONG_BREAK: return 'timer-long-break-mode';
      default: return '';
    }
  };


  // ✅ Helper functions for new design
  const getMotivationalText = () => {
    if (!timerState) return 'آماده‌ای برای تمرکز؟';
    switch (timerState.mode) {
      case TIMER_MODES.WORK: 
        if (timerState.isPaused) return 'یه نفس بکش';
        return 'فقط تمرکز کن، بقیه منتظر بمونن.';
      case TIMER_MODES.SHORT_BREAK: 
      case TIMER_MODES.LONG_BREAK: 
        return 'وقت استراحته 🍃';
      default: return 'آماده‌ای برای تمرکز؟';
    }
  };

  const getActionButton = () => {
    if (!timerState) {
      return {
        text: 'شروع تمرکز',
        icon: <Play size={20} className="me-2" />,
        className: 'btn-primary',
        onClick: handleStart
      };
    }
    
    if (timerState.isPaused) {
      return {
        text: 'ادامه',
        icon: <Play size={20} className="me-2" />,
        className: 'btn-success',
        onClick: handlePause
      };
    }
    
    return {
      text: 'توقف',
      icon: <Pause size={20} className="me-2" />,
      className: 'btn-warning',
      onClick: handlePause
    };
  };

  const getTimerIcon = () => {
    if (!timerState) return <Clock size={24} className="text-muted" />;
    switch (timerState.mode) {
      case TIMER_MODES.WORK: return <Zap size={24} className="text-primary" />;
      case TIMER_MODES.SHORT_BREAK: 
      case TIMER_MODES.LONG_BREAK: return <Coffee size={24} className="text-success" />;
      default: return <Clock size={24} className="text-muted" />;
    }
  };

  const actionButton = getActionButton();

  return (
    <div className={`card shadow-lg border-0 timer-container ${getModeClass()}`}>
      <div className="card-header bg-transparent border-0 pb-0">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-bold">تایمر تمرکز</h5>
          <TimerSettings />
        </div>
      </div>
      
      <div className="card-body text-center py-5">
        {/* Progress Ring */}
        <div className="timer-ring-container mb-4">
          <div className={`timer-ring ${getModeClass()} ${timerState && !timerState.isPaused ? 'breathing' : ''}`}>
            <svg className="progress-ring" width="240" height="240">
              <circle
                className="progress-ring-circle"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                r="110"
                cx="120"
                cy="120"
                style={{
                  strokeDasharray: '691.15',
                  strokeDashoffset: `${691.15 - (691.15 * progress) / 100}`,
                  transition: 'stroke-dashoffset 0.3s ease'
                }}
              />
            </svg>
            
            {/* Center Content */}
            <div className="timer-center">
              <div className="timer-icon mb-2">
                {getTimerIcon()}
              </div>
              <div className="timer-time-display">
                {formatTime(timeLeft)}
              </div>
              <div className="timer-mode-text">
                {getModeText()}
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Text */}
        <div className="motivational-text mb-4">
          <p className="mb-0 text-muted fs-6">
            {getMotivationalText()}
          </p>
        </div>

        {/* Action Button */}
        <div className="d-flex justify-content-center gap-3 mb-4">
          <button
            onClick={actionButton.onClick}
            disabled={isProcessing}
            className={`btn ${actionButton.className} btn-lg px-5 py-3 timer-action-btn`}
          >
            {isProcessing ? (
              <Loader2 size={20} className="me-2 animate-spin" />
            ) : (
              actionButton.icon
            )}
            {actionButton.text}
          </button>
          
          {timerState && (
            <>
              <button
                onClick={handleStop}
                disabled={isProcessing}
                className="btn btn-outline-danger btn-lg px-4 py-3"
              >
                <Square size={20} className="me-2" />
                پایان
              </button>
              
              <button
                onClick={handleSkip}
                disabled={isProcessing}
                className="btn btn-outline-secondary btn-lg px-4 py-3"
              >
                <SkipForward size={20} className="me-2" />
                رد کردن
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="row g-3">
          <div className="col-6">
            <div className="text-center">
              <div className="h4 mb-1 text-primary number-display">{focusMinutesToday}</div>
              <div className="text-muted small">دقیقه امروز</div>
            </div>
          </div>
          <div className="col-6">
            <div className="text-center">
              <div className="h4 mb-1 text-success number-display">{timerState?.cyclesCompleted || 0}</div>
              <div className="text-muted small">چرخه‌ها</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};