import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface AnalyticsProps {
  userId: string;
}

interface ProductivityPoint {
  date: string;
  productivity: number;
}

interface SessionPoint {
  date: string;
  sessions: number;
}

interface ActivityRow {
  timestamp: string;
  productivity_score: number;
}

interface FocusSessionRow {
  start_time: string;
}

export function Analytics({ userId }: AnalyticsProps) {
  const [productivityData, setProductivityData] = useState<ProductivityPoint[]>([]);
  const [sessionData, setSessionData] = useState<SessionPoint[]>([]);

  useEffect(() => {
    async function loadData() {
      // Activities productivity over time
      const { data: activities } = await supabase
        .from('activities')
        .select('timestamp, productivity_score')
        .eq('user_id', userId);

      const productivityByDate: Record<string, { sum: number; count: number }> = {};
      activities?.forEach((a: ActivityRow) => {
        const date = new Date(a.timestamp).toISOString().split('T')[0];
        if (!productivityByDate[date]) {
          productivityByDate[date] = { sum: 0, count: 0 };
        }
        productivityByDate[date].sum += a.productivity_score;
        productivityByDate[date].count += 1;
      });

      const productivityPoints = Object.entries(productivityByDate)
        .map(([date, { sum, count }]) => ({ date, productivity: sum / count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setProductivityData(productivityPoints);

      // Focus session counts per day
      const { data: sessions } = await supabase
        .from('focus_sessions')
        .select('start_time')
        .eq('user_id', userId);

      const sessionCountByDate: Record<string, number> = {};
      sessions?.forEach((s: FocusSessionRow) => {
        const date = new Date(s.start_time).toISOString().split('T')[0];
        sessionCountByDate[date] = (sessionCountByDate[date] || 0) + 1;
      });

      const sessionPoints = Object.entries(sessionCountByDate)
        .map(([date, sessions]) => ({ date, sessions }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setSessionData(sessionPoints);
    }

    loadData();
  }, [userId]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-gray-400">Insights from your activities and focus sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Productivity Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[0, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="productivity" stroke="#14B8A6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Focus Sessions per Day</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sessions" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Analytics;

