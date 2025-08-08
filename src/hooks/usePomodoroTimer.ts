import { useState, useEffect, useCallback } from 'react';
import { FocusSession } from '../types';
import { dbHelpers } from '../lib/supabase';

export type TimerMode = 'pomodoro' | 'short_break' | 'long_break';

export function usePomodoroTimer(userId: string | undefined) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);

  const TIMER_DURATIONS = {
    pomodoro: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60,
  };

  // Start timer
  const startTimer = useCallback(async () => {
    setIsActive(true);
    
    const session: Omit<
      FocusSession & { user_id: string },
      'id' | 'end_time' | 'completed'
    > = {
      type: mode,
      duration: TIMER_DURATIONS[mode],
      start_time: new Date(),
      user_id: userId!,
    };

    if (userId) {
      try {
        const createdSession = await dbHelpers.createFocusSession(session);
        setCurrentSession(createdSession);
      } catch (error) {
        console.error('Failed to create focus session:', error);
      }
    }
  }, [mode, userId]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  // Reset timer
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(TIMER_DURATIONS[mode]);
    setCurrentSession(null);
  }, [mode]);

  // Switch mode
  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
    setIsActive(false);
    setCurrentSession(null);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      setIsActive(false);
      
      if (mode === 'pomodoro') {
        setCompletedSessions(prev => prev + 1);
      }

      // Update session in database
      if (currentSession && userId) {
        dbHelpers.updateFocusSession(currentSession.id, {
          completed: true,
          end_time: new Date(),
        }).catch(console.error);
      }

      // Auto-switch to break after pomodoro
      if (mode === 'pomodoro') {
        const nextMode = completedSessions % 4 === 3 ? 'long_break' : 'short_break';
        switchMode(nextMode);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, currentSession, userId, completedSessions, switchMode]);

  // Reset timer when mode changes
  useEffect(() => {
    setTimeLeft(TIMER_DURATIONS[mode]);
  }, [mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    isActive,
    mode,
    completedSessions,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    formatTime,
  };
}