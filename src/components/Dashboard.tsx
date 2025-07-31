import React from 'react';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useActivityTracker } from '../hooks/useActivityTracker';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';

interface DashboardProps {
  userId: string;
}

export function Dashboard({ userId }: DashboardProps) {
  const { activities, currentActivity, isTracking } = useActivityTracker(userId);
  const { completedSessions } = usePomodoroTimer(userId);

  // Calculate today's stats
  const today = new Date().toDateString();
  const todayActivities = activities.filter(
    activity => new Date(activity.timestamp).toDateString() === today
  );

  const totalTimeToday = todayActivities.reduce((sum, activity) => sum + activity.duration, 0);
  const productiveTime = todayActivities
    .filter(activity => activity.productivity_score >= 4)
    .reduce((sum, activity) => sum + activity.duration, 0);
  
  const productivityScore = todayActivities.length > 0 
    ? Math.round(todayActivities.reduce((sum, activity) => sum + activity.productivity_score, 0) / todayActivities.length)
    : 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const stats = [
    {
      title: 'Total Time Today',
      value: formatDuration(totalTimeToday),
      icon: Clock,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Productive Time',
      value: formatDuration(productiveTime),
      icon: TrendingUp,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Focus Sessions',
      value: completedSessions.toString(),
      icon: Target,
      color: 'bg-purple-500',
      change: '+3'
    },
    {
      title: 'Productivity Score',
      value: `${productivityScore}/5`,
      icon: Activity,
      color: 'bg-orange-500',
      change: productivityScore >= 4 ? '+0.2' : '-0.1'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your productivity overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium text-gray-700">
            {isTracking ? 'Tracking Active' : 'Tracking Paused'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Current Activity */}
      {currentActivity && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-semibold text-gray-900">Current Activity</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{currentActivity.name}</h3>
              <p className="text-gray-600">{currentActivity.category}</p>
              {currentActivity.url && (
                <p className="text-sm text-gray-500">{currentActivity.url}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < currentActivity.productivity_score ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">Productivity Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
        <div className="space-y-3">
          {todayActivities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.productivity_score >= 4 ? 'bg-green-500' : 
                  activity.productivity_score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{activity.name}</p>
                  <p className="text-sm text-gray-500">{activity.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatDuration(activity.duration)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <CheckCircle className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Start Focus Session</h3>
          <p className="text-blue-100 text-sm">Begin a 25-minute Pomodoro session</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <Target className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Set New Goal</h3>
          <p className="text-green-100 text-sm">Create a productivity goal</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <AlertCircle className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-2">View Analytics</h3>
          <p className="text-purple-100 text-sm">Check your progress trends</p>
        </div>
      </div>
    </div>
  );
}