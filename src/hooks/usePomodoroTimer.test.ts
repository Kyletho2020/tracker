import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePomodoroTimer } from './usePomodoroTimer';

vi.mock('../lib/supabase', () => ({
  dbHelpers: {
    createFocusSession: vi.fn().mockResolvedValue({ id: '1' }),
    updateFocusSession: vi.fn().mockResolvedValue({}),
  },
}));

describe('usePomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts and counts down', async () => {
    const { result } = renderHook(() => usePomodoroTimer(undefined));

    expect(result.current.timeLeft).toBe(25 * 60);
    act(() => {
      result.current.startTimer();
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(25 * 60 - 1);
  });

  it('switches modes', () => {
    const { result } = renderHook(() => usePomodoroTimer(undefined));
    act(() => {
      result.current.switchMode('short_break');
    });
    expect(result.current.mode).toBe('short_break');
    expect(result.current.timeLeft).toBe(5 * 60);
  });
});
