import React from 'react';
import { Play, Pause, RotateCcw, Coffee, Clock } from 'lucide-react';
import { usePomodoroTimer, TimerMode } from '../hooks/usePomodoroTimer';

interface FocusTimerProps {
  userId: string;
}

export function FocusTimer({ userId }: FocusTimerProps) {
  const {
    timeLeft,
    isActive,
    mode,
    completedSessions,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    formatTime,
  } = usePomodoroTimer(userId);

  const modeConfig = {
    pomodoro: {
      label: 'Focus Time',
      color: 'from-gray-800 to-gray-900',
      icon: Clock,
      description: 'Time to focus and be productive'
    },
    short_break: {
      label: 'Short Break',
      color: 'from-gray-800 to-gray-900',
      icon: Coffee,
      description: 'Take a quick 5-minute break'
    },
    long_break: {
      label: 'Long Break',
      color: 'from-gray-800 to-gray-900',
      icon: Coffee,
      description: 'Enjoy a longer 15-minute break'
    }
  };

  const currentConfig = modeConfig[mode];
  const Icon = currentConfig.icon;
  const progress = ((mode === 'pomodoro' ? 25 * 60 : mode === 'short_break' ? 5 * 60 : 15 * 60) - timeLeft) / 
                  (mode === 'pomodoro' ? 25 * 60 : mode === 'short_break' ? 5 * 60 : 15 * 60) * 100;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Focus Timer</h1>
        <p className="text-gray-400">Stay focused with the Pomodoro Technique</p>
      </div>

      {/* Timer Card */}
      <div className={`bg-gradient-to-br ${currentConfig.color} rounded-2xl p-8 text-white mb-6`}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icon className="w-8 h-8" />
            <h2 className="text-2xl font-bold">{currentConfig.label}</h2>
          </div>
          <p className="text-white/80 mb-8">{currentConfig.description}</p>
          
          {/* Timer Display */}
          <div className="relative mb-8">
            <div className="w-64 h-64 mx-auto relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">{formatTime(timeLeft)}</div>
                  <div className="text-white/80">
                    {isActive ? 'Running' : 'Paused'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={isActive ? pauseTimer : startTimer}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 transition-colors"
            >
              {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </button>
            <button
              onClick={resetTimer}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 transition-colors"
            >
              <RotateCcw className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Timer Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(modeConfig) as TimerMode[]).map((timerMode) => (
            <button
              key={timerMode}
              onClick={() => switchMode(timerMode)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                mode === timerMode
                  ? 'border-white bg-gray-800 text-white'
                  : 'border-gray-700 hover:border-gray-500 text-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold capitalize">
                  {timerMode.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-400">
                  {timerMode === 'pomodoro' ? '25 min' :
                   timerMode === 'short_break' ? '5 min' : '15 min'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Today's Progress</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {completedSessions}
            </div>
            <div className="text-gray-400">Completed Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {Math.floor(completedSessions * 25 / 60)}h {(completedSessions * 25) % 60}m
            </div>
            <div className="text-gray-400">Focus Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}