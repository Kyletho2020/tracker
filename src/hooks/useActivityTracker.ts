import { useState, useEffect, useCallback } from 'react';
import { Activity } from '../types';
import { dbHelpers } from '../lib/supabase';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const chrome: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Simulated activity data for development only
const DEMO_WEBSITES = import.meta.env.DEV
  ? [
      { name: 'GitHub', url: 'github.com', category: 'Development', productivity: 5 },
      { name: 'Stack Overflow', url: 'stackoverflow.com', category: 'Development', productivity: 4 },
      { name: 'YouTube', url: 'youtube.com', category: 'Entertainment', productivity: 2 },
      { name: 'Twitter', url: 'twitter.com', category: 'Social Media', productivity: 2 },
      { name: 'LinkedIn', url: 'linkedin.com', category: 'Professional', productivity: 4 },
      { name: 'Gmail', url: 'gmail.com', category: 'Communication', productivity: 3 },
      { name: 'Slack', url: 'slack.com', category: 'Communication', productivity: 4 },
      { name: 'Notion', url: 'notion.so', category: 'Productivity', productivity: 5 },
    ]
  : [];

const DEMO_APPLICATIONS = import.meta.env.DEV
  ? [
      { name: 'VS Code', category: 'Development', productivity: 5 },
      { name: 'Chrome', category: 'Browser', productivity: 3 },
      { name: 'Spotify', category: 'Entertainment', productivity: 3 },
      { name: 'Discord', category: 'Communication', productivity: 2 },
      { name: 'Figma', category: 'Design', productivity: 5 },
    ]
  : [];

type IncomingActivity = Omit<Activity, 'timestamp'> & {
  timestamp: string | Date;
  domain?: string;
};

export function useActivityTracker(userId: string | undefined) {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const ingestActivity = useCallback(
    (activity: IncomingActivity) => {
      const { timestamp, ...rest } = activity;
      const formatted: Activity = {
        ...(rest as Omit<Activity, 'timestamp'>),
        timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
      };

      setCurrentActivity(formatted);
      setActivities(prev => [formatted, ...prev.slice(0, 99)]);

      if (userId) {
        dbHelpers
          .createActivity({ ...formatted, user_id: userId })
          .catch(console.error);
      }
    },
    [userId]
  );

  // Start tracking
  const startTracking = useCallback(() => {
    setIsTracking(true);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'startTracking' });
    }
  }, []);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    setCurrentActivity(null);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'stopTracking' });
    }
  }, []);

  // Listen for messages from the Chrome extension
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) return;

    const handler = (message: { action?: string; activity?: IncomingActivity }) => {
      if (message?.action === 'activity' && message.activity) {
        ingestActivity(message.activity);
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, [ingestActivity]);

  // Request initial state from the extension
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;

    chrome.runtime.sendMessage(
      { action: 'getState' },
      (response: { isTracking?: boolean }) => {
        if (response?.isTracking !== undefined) {
          setIsTracking(response.isTracking);
        }
      }
    );
  }, []);

  // Development: simulate activity events when extension is unavailable
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
      duration: Math.floor(Math.random() * 300) + 60,
      timestamp: new Date(),
      productivity_score: item.productivity,
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (typeof chrome !== 'undefined') return; // Extension available
    if (!isTracking) return;

    const interval = setInterval(() => {
      ingestActivity(generateRandomActivity());
    }, 5000);

    return () => clearInterval(interval);
  }, [isTracking, ingestActivity, generateRandomActivity]);

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
    ingestActivity,
  };
}