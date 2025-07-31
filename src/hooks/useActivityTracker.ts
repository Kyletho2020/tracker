import { useState, useEffect, useCallback } from 'react';
import { Activity } from '../types';
import { dbHelpers } from '../lib/supabase';

// Simulated activity data for demo purposes
const DEMO_WEBSITES = [
  { name: 'GitHub', url: 'github.com', category: 'Development', productivity: 5 },
  { name: 'Stack Overflow', url: 'stackoverflow.com', category: 'Development', productivity: 4 },
  { name: 'YouTube', url: 'youtube.com', category: 'Entertainment', productivity: 2 },
  { name: 'Twitter', url: 'twitter.com', category: 'Social Media', productivity: 2 },
  { name: 'LinkedIn', url: 'linkedin.com', category: 'Professional', productivity: 4 },
  { name: 'Gmail', url: 'gmail.com', category: 'Communication', productivity: 3 },
  { name: 'Slack', url: 'slack.com', category: 'Communication', productivity: 4 },
  { name: 'Notion', url: 'notion.so', category: 'Productivity', productivity: 5 },
];

const DEMO_APPLICATIONS = [
  { name: 'VS Code', category: 'Development', productivity: 5 },
  { name: 'Chrome', category: 'Browser', productivity: 3 },
  { name: 'Spotify', category: 'Entertainment', productivity: 3 },
  { name: 'Discord', category: 'Communication', productivity: 2 },
  { name: 'Figma', category: 'Design', productivity: 5 },
];

export function useActivityTracker(userId: string | undefined) {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  // Simulate activity tracking
  const generateRandomActivity = useCallback((): Activity => {
    const isWebsite = Math.random() > 0.5;
    const source = isWebsite ? DEMO_WEBSITES : DEMO_APPLICATIONS;
    const item = source[Math.floor(Math.random() * source.length)];
    
    return {
      id: crypto.randomUUID(),
      type: isWebsite ? 'website' : 'application',
      name: item.name,
      url: isWebsite ? item.url : undefined,
      category: item.category,
      duration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
      timestamp: new Date(),
      productivity_score: item.productivity,
    };
  }, []);

  // Start tracking
  const startTracking = useCallback(() => {
    setIsTracking(true);
  }, []);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    setCurrentActivity(null);
  }, []);

  // Simulate real-time activity updates
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      const newActivity = generateRandomActivity();
      setCurrentActivity(newActivity);
      
      // Add to activities list
      setActivities(prev => [newActivity, ...prev.slice(0, 99)]); // Keep last 100
      
      // Save to database if user is logged in
      if (userId) {
        dbHelpers.createActivity({
          ...newActivity,
          user_id: userId,
        }).catch(console.error);
      }
    }, 5000); // New activity every 5 seconds for demo

    return () => clearInterval(interval);
  }, [isTracking, userId, generateRandomActivity]);

  // Load activities from database
  useEffect(() => {
    if (!userId) return;

    const loadActivities = async () => {
      try {
        const data = await dbHelpers.getActivities(userId);
        setActivities(data || []);
      } catch (error) {
        console.error('Failed to load activities:', error);
      }
    };

    loadActivities();
  }, [userId]);

  return {
    currentActivity,
    activities,
    isTracking,
    startTracking,
    stopTracking,
  };
}