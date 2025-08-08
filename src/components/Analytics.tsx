import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { dbHelpers } from '../lib/supabase';
import { ActivityStats, PomodoroStats } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

interface AnalyticsProps {
  userId: string;
}

export function Analytics({ userId }: AnalyticsProps) {
  const [activityStats, setActivityStats] = useState<ActivityStats[]>([]);
  const [pomodoroStats, setPomodoroStats] = useState<PomodoroStats[]>([]);

  useEffect(() => {
    dbHelpers
      .getActivityStats(userId)
      .then(setActivityStats)
      .catch(console.error);
    dbHelpers
      .getPomodoroStats(userId)
      .then(setPomodoroStats)
      .catch(console.error);
  }, [userId]);

  const activityData = {
    labels: activityStats.map((s) => s.date.split('T')[0]),
    datasets: [
      {
        label: 'Total Activity (min)',
        data: activityStats.map((s) => s.total_duration / 60),
        borderColor: 'rgb(255,255,255)',
        backgroundColor: 'rgba(255,255,255,0.3)',
        yAxisID: 'y',
      },
      {
        label: 'Avg Productivity',
        data: activityStats.map((s) => s.average_productivity),
        borderColor: 'rgb(156,163,175)',
        backgroundColor: 'rgba(156,163,175,0.3)',
        yAxisID: 'y1',
      },
    ],
  };

  const activityOptions = {
    responsive: true,
    scales: {
      y: {
        title: { display: true, text: 'Minutes' },
      },
      y1: {
        position: 'right',
        min: 0,
        max: 5,
        title: { display: true, text: 'Score' },
        grid: { drawOnChartArea: false },
      },
    },
  } as const;

  const pomodoroData = {
    labels: pomodoroStats.map((s) => s.date.split('T')[0]),
    datasets: [
      {
        label: 'Completed Pomodoros',
        data: pomodoroStats.map((s) => s.completed_sessions),
        borderColor: 'rgb(74,222,128)',
        backgroundColor: 'rgba(74,222,128,0.3)',
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Activity Over Time
        </h2>
        <Line data={activityData} options={activityOptions} />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Pomodoro Completion
        </h2>
        <Line data={pomodoroData} />
      </div>
    </div>
  );
}
