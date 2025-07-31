import React, { useState } from 'react';
import { 
  Globe, 
  Monitor, 
  Clock, 
  Filter,
  Search,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useActivityTracker } from '../hooks/useActivityTracker';

interface ActivitiesProps {
  userId: string;
}

export function Activities({ userId }: ActivitiesProps) {
  const { activities, isTracking, startTracking, stopTracking } = useActivityTracker(userId);
  const [filter, setFilter] = useState<'all' | 'website' | 'application'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.type === filter;
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProductivityColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-100';
    if (score >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProductivityIcon = (score: number) => {
    return score >= 3 ? TrendingUp : TrendingDown;
  };

  // Calculate category stats
  const categoryStats = activities.reduce((acc, activity) => {
    if (!acc[activity.category]) {
      acc[activity.category] = { count: 0, totalTime: 0, avgProductivity: 0 };
    }
    acc[activity.category].count++;
    acc[activity.category].totalTime += activity.duration;
    acc[activity.category].avgProductivity += activity.productivity_score;
    return acc;
  }, {} as Record<string, { count: number; totalTime: number; avgProductivity: number }>);

  Object.keys(categoryStats).forEach(category => {
    categoryStats[category].avgProductivity /= categoryStats[category].count;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Tracking</h1>
          <p className="text-gray-600">Monitor your digital activities and productivity</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">
              {isTracking ? 'Tracking Active' : 'Tracking Paused'}
            </span>
          </div>
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isTracking
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        </div>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(categoryStats)
          .sort(([,a], [,b]) => b.totalTime - a.totalTime)
          .slice(0, 3)
          .map(([category, stats]) => (
            <div key={category} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{category}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  getProductivityColor(stats.avgProductivity)
                }`}>
                  {stats.avgProductivity.toFixed(1)}/5
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Time</span>
                  <span className="font-medium">{formatDuration(stats.totalTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Activities</span>
                  <span className="font-medium">{stats.count}</span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Activities</option>
              <option value="website">Websites</option>
              <option value="application">Applications</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          <p className="text-gray-600 text-sm">
            Showing {filteredActivities.length} of {activities.length} activities
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredActivities.slice(0, 20).map((activity) => {
            const ProductivityIcon = getProductivityIcon(activity.productivity_score);
            return (
              <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {activity.type === 'website' ? (
                        <Globe className="w-5 h-5 text-gray-600" />
                      ) : (
                        <Monitor className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{activity.category}</span>
                        {activity.url && (
                          <>
                            <span>•</span>
                            <span>{activity.url}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatDuration(activity.duration)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      getProductivityColor(activity.productivity_score)
                    }`}>
                      <ProductivityIcon className="w-3 h-3" />
                      <span>{activity.productivity_score}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}