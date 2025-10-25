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


  const actionButton = getActionButton();

  return (
    <div className={`zen-timer-container ${getModeClass()}`}>
      <div className="zen-timer-header">
        <div className="zen-timer-title">تمرکز</div>
        <TimerSettings />
      </div>
      
      <div className="zen-timer-body">
        {/* Zen Progress Ring */}
        <div className="zen-ring-container">
          <div className={`zen-ring ${getModeClass()} ${timerState && !timerState.isPaused ? 'breathing' : ''}`}>
            <svg className="zen-progress-ring" width="280" height="280">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5B8DEF" />
                  <stop offset="100%" stopColor="#F5A623" />
                </linearGradient>
              </defs>
              <circle
                className="zen-progress-circle"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                fill="transparent"
                r="130"
                cx="140"
                cy="140"
                style={{
                  strokeDasharray: '816.81',
                  strokeDashoffset: `${816.81 - (816.81 * progress) / 100}`,
                  transition: 'stroke-dashoffset 1s ease-in-out'
                }}
              />
            </svg>
            
            {/* Zen Center Content */}
            <div className="zen-center">
              <div className="zen-time-display">
                {formatTime(timeLeft)}
              </div>
              <div className="zen-mode-text">
                {getModeText()}
              </div>
            </div>
          </div>
        </div>

        {/* Zen Motivational Text */}
        <div className="zen-motivational">
          <p className="zen-motivational-text">
            {getMotivationalText()}
          </p>
        </div>

        {/* Zen Action Button */}
        <div className="zen-actions">
          <button
            onClick={actionButton.onClick}
            disabled={isProcessing}
            className={`zen-action-btn ${actionButton.className}`}
          >
            {isProcessing ? (
              <Loader2 size={24} className="zen-btn-icon animate-spin" />
            ) : (
              actionButton.icon
            )}
            <span className="zen-btn-text">{actionButton.text}</span>
          </button>
          
          {timerState && (
            <div className="zen-secondary-actions">
              <button
                onClick={handleStop}
                disabled={isProcessing}
                className="zen-secondary-btn"
                title="پایان"
              >
                <Square size={18} />
              </button>
              
              <button
                onClick={handleSkip}
                disabled={isProcessing}
                className="zen-secondary-btn"
                title="رد کردن"
              >
                <SkipForward size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Zen Stats */}
        <div className="zen-stats">
          <div className="zen-stat">
            <div className="zen-stat-number">{focusMinutesToday}</div>
            <div className="zen-stat-label">دقیقه امروز</div>
          </div>
          <div className="zen-stat">
            <div className="zen-stat-number">{timerState?.cyclesCompleted || 0}</div>
            <div className="zen-stat-label">چرخه‌ها</div>
          </div>
        </div>
      </div>
    </div>
  );
};