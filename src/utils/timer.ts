import type { TimerState, FocusSession } from '../types';

export const TIMER_DURATIONS = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

export const CYCLES_FOR_LONG_BREAK = 4;

export const createTimerState = (
  mode: 'work' | 'shortBreak' | 'longBreak',
  taskId?: string,
  cyclesCompleted = 0,
  durationSec?: number
): TimerState => {
  const now = Date.now();
  const duration = durationSec || TIMER_DURATIONS[mode];
  return {
    mode,
    startTimestamp: now,
    durationSec: duration,
    remainingSec: duration,
    taskId,
    cyclesCompleted,
    isPaused: false,
  };
};

export const calculateElapsedTime = (timerState: TimerState): number => {
  if (timerState.isPaused) {
    return timerState.durationSec - timerState.remainingSec;
  }
  const elapsed = Math.floor((Date.now() - timerState.startTimestamp) / 1000);
  return Math.min(elapsed, timerState.durationSec);
};

export const getRemainingTime = (timerState: TimerState): number => {
  const elapsed = calculateElapsedTime(timerState);
  return Math.max(0, timerState.durationSec - elapsed);
};

export const isTimerComplete = (timerState: TimerState): boolean => {
  return getRemainingTime(timerState) <= 0;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const pauseTimer = (timerState: TimerState): TimerState => {
  const elapsed = calculateElapsedTime(timerState);
  const newState = {
    ...timerState,
    remainingSec: Math.max(0, timerState.durationSec - elapsed),
    isPaused: true,
  };
  return newState;
};

export const resumeTimer = (timerState: TimerState): TimerState => {
  const elapsed = calculateElapsedTime(timerState);
  const newState = {
    ...timerState,
    startTimestamp: Date.now() - (elapsed * 1000), // Adjust start time to account for elapsed time
    isPaused: false,
  };
  return newState;
};

export const completeSession = (timerState: TimerState): FocusSession => {
  const elapsed = calculateElapsedTime(timerState);
  const completed = elapsed >= timerState.durationSec * 0.9; // 90% threshold
  
  const session: FocusSession = {
    id: `session_${Date.now()}`,
    taskId: timerState.taskId,
    startTime: new Date(timerState.startTimestamp).toISOString(),
    endTime: new Date().toISOString(),
    durationSec: elapsed,
    completed,
    type: timerState.mode as 'work' | 'shortBreak' | 'longBreak',
  };

  return session;
};

export const getNextMode = (currentMode: 'work' | 'shortBreak' | 'longBreak', cyclesCompleted: number): 'work' | 'shortBreak' | 'longBreak' => {
  if (currentMode === 'work') {
    return cyclesCompleted >= CYCLES_FOR_LONG_BREAK ? 'longBreak' : 'shortBreak';
  }
  return 'work';
};

export const getTimerProgress = (timerState: TimerState): number => {
  const elapsed = calculateElapsedTime(timerState);
  return Math.min(100, (elapsed / timerState.durationSec) * 100);
};
