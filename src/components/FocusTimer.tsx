import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatTime, getRemainingTime, getTimerProgress, isTimerComplete } from '../utils/timer';
import { TimerSettings } from './TimerSettings';

export const FocusTimer: React.FC = () => {
  const { timerState, startTimer, pauseTimer, resumeTimer, stopTimer, skipTimer } = useStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!timerState) {
      setTimeLeft(0);
      setProgress(0);
      return;
    }

    const updateTimer = () => {
      const remaining = getRemainingTime(timerState);
      const timerProgress = getTimerProgress(timerState);
      
      setTimeLeft(remaining);
      setProgress(timerProgress);

      if (isTimerComplete(timerState)) {
        return;
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timerState]);

  const handleStart = () => {
    startTimer('work');
  };

  const handlePause = () => {
    if (timerState?.isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const handleStop = () => {
    stopTimer();
  };

  const handleSkip = () => {
    skipTimer();
  };

  const getModeText = () => {
    if (!timerState) return 'آماده';
    switch (timerState.mode) {
      case 'work': return 'تمرکز';
      case 'shortBreak': return 'استراحت کوتاه';
      case 'longBreak': return 'استراحت طولانی';
      default: return 'آماده';
    }
  };

  const getModeClass = () => {
    if (!timerState) return '';
    switch (timerState.mode) {
      case 'work': return 'timer-work';
      case 'shortBreak': return 'timer-break';
      case 'longBreak': return 'timer-long-break';
      default: return '';
    }
  };

  return (
    <div className="card">
      <div className="card-body text-center">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="card-title mb-0">تایمر تمرکز</h5>
          <TimerSettings />
        </div>
        
        {/* Timer Circle */}
        <div className={`timer-circle ${getModeClass()}`} style={{ '--progress': `${progress * 3.6}deg` } as any}>
          <div className="text-center">
            <div className={`h3 mb-1 ${timerState?.mode === 'work' ? 'text-danger' : timerState?.mode === 'shortBreak' ? 'text-info' : 'text-success'}`}>
              {formatTime(timeLeft)}
            </div>
            <div className={`small ${timerState?.mode === 'work' ? 'text-danger' : timerState?.mode === 'shortBreak' ? 'text-info' : 'text-success'}`}>
              {getModeText()}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4">
          {!timerState ? (
            <button
              onClick={handleStart}
              className="btn btn-success btn-lg"
            >
              <Play size={20} className="me-2" />
              شروع
            </button>
          ) : (
            <div className="d-flex gap-2 justify-content-center">
              <button
                onClick={handlePause}
                className="btn btn-primary"
              >
                {timerState.isPaused ? <Play size={16} className="me-1" /> : <Pause size={16} className="me-1" />}
                {timerState.isPaused ? 'ادامه' : 'توقف'}
              </button>
              
              <button
                onClick={handleStop}
                className="btn btn-danger"
              >
                <Square size={16} className="me-1" />
                توقف
              </button>
              
              <button
                onClick={handleSkip}
                className="btn btn-secondary"
              >
                <SkipForward size={16} className="me-1" />
                رد کردن
              </button>
            </div>
          )}
        </div>

        {/* Timer info */}
        {timerState && (
          <div className="mt-3 text-muted small">
            <div>چرخه‌های تکمیل شده: {timerState.cyclesCompleted}</div>
            {timerState.taskId && (
              <div className="text-success">متصل به کار</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};