import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Background service worker for Chrome extension
let currentTab = null;
let startTime = null;
let isTracking = false;
let pomodoroTimer = null;
let pomodoroStartTime = null;
let pomodoroState = {
  isActive: false,
  timeLeft: 25 * 60, // 25 minutes in seconds
  mode: 'pomodoro', // 'pomodoro', 'short_break', 'long_break'
  completedSessions: 0
};

const POMODORO_DURATIONS = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60
};

initializeSupabase();

async function initializeSupabase() {
  await restoreSession();
  await syncPendingActivities();
}

// Website categorization
const WEBSITE_CATEGORIES = {
  'github.com': { category: 'Development', productivity: 5 },
  'stackoverflow.com': { category: 'Development', productivity: 4 },
  'youtube.com': { category: 'Entertainment', productivity: 2 },
  'twitter.com': { category: 'Social Media', productivity: 2 },
  'facebook.com': { category: 'Social Media', productivity: 2 },
  'instagram.com': { category: 'Social Media', productivity: 2 },
  'linkedin.com': { category: 'Professional', productivity: 4 },
  'gmail.com': { category: 'Communication', productivity: 3 },
  'slack.com': { category: 'Communication', productivity: 4 },
  'notion.so': { category: 'Productivity', productivity: 5 },
  'trello.com': { category: 'Productivity', productivity: 5 },
  'asana.com': { category: 'Productivity', productivity: 5 },
  'reddit.com': { category: 'Social Media', productivity: 2 },
  'news.ycombinator.com': { category: 'News', productivity: 3 },
  'medium.com': { category: 'Reading', productivity: 4 }
};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('RizeTracker extension installed');
  chrome.storage.local.set({
    isTracking: false,
    dailyStats: {},
    pomodoroState: pomodoroState
  });
});

// Tab change listener
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (isTracking) {
    await recordCurrentActivity();
    await startTrackingNewTab(activeInfo.tabId);
  }
});

// Tab update listener (URL changes)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && isTracking && tab.active) {
    await recordCurrentActivity();
    await startTrackingNewTab(tabId);
  }
});

// Window focus change listener
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    if (isTracking) {
      await recordCurrentActivity();
      currentTab = null;
      startTime = null;
    }
  } else {
    // Browser gained focus
    if (isTracking) {
      const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
      if (tabs[0]) {
        await startTrackingNewTab(tabs[0].id);
      }
    }
  }
});

// Start tracking a new tab
async function startTrackingNewTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      currentTab = {
        id: tabId,
        url: tab.url,
        title: tab.title,
        domain: new URL(tab.url).hostname
      };
      startTime = Date.now();
    }
  } catch (error) {
    console.error('Error starting tab tracking:', error);
  }
}

// Record current activity
async function recordCurrentActivity() {
  if (!currentTab || !startTime) return;

  const endTime = Date.now();
  const duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds

  if (duration < 5) return; // Ignore very short visits

  const domain = currentTab.domain;
  const categoryInfo = WEBSITE_CATEGORIES[domain] || { 
    category: 'Other', 
    productivity: 3 
  };

  const activity = {
    id: generateId(),
    type: 'website',
    name: currentTab.title || domain,
    url: currentTab.url,
    domain: domain,
    category: categoryInfo.category,
    duration: duration,
    timestamp: new Date(startTime).toISOString(),
    productivity_score: categoryInfo.productivity,
    synced: false
  };

  // Store activity locally
  await storeActivity(activity);

  // Sync with Supabase
  await syncActivityWithSupabase(activity);
}

// Store activity in local storage
async function storeActivity(activity) {
  try {
    const result = await chrome.storage.local.get(['activities']);
    const activities = result.activities || [];
    activities.unshift(activity);
    
    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.splice(1000);
    }

    await chrome.storage.local.set({ activities });
    
    // Update daily stats
    await updateDailyStats(activity);
  } catch (error) {
    console.error('Error storing activity:', error);
  }
}

// Update daily statistics
async function updateDailyStats(activity) {
  try {
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get(['dailyStats']);
    const dailyStats = result.dailyStats || {};
    
    if (!dailyStats[today]) {
      dailyStats[today] = {
        totalTime: 0,
        productiveTime: 0,
        activities: 0,
        categories: {}
      };
    }

    const todayStats = dailyStats[today];
    todayStats.totalTime += activity.duration;
    todayStats.activities += 1;

    if (activity.productivity_score >= 4) {
      todayStats.productiveTime += activity.duration;
    }

    if (!todayStats.categories[activity.category]) {
      todayStats.categories[activity.category] = 0;
    }
    todayStats.categories[activity.category] += activity.duration;

    await chrome.storage.local.set({ dailyStats });
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}

// Sync activity with Supabase
async function syncActivityWithSupabase(activity) {
  try {
    const { error } = await supabase.from('activities').insert([
      {
        type: activity.type,
        name: activity.name,
        url: activity.url,
        category: activity.category,
        duration: activity.duration,
        timestamp: activity.timestamp,
        productivity_score: activity.productivity_score
      }
    ]);

    if (error) {
      console.error('Failed to sync activity:', error);
    } else {
      await markActivitySynced(activity.id);
    }
  } catch (error) {
    console.error('Error syncing activity with Supabase:', error);
  }
}

// Sync focus session with Supabase
async function syncFocusSession(session) {
  try {
    const { error } = await supabase.from('focus_sessions').insert([session]);
    if (error) {
      console.error('Failed to sync focus session:', error);
    }
  } catch (error) {
    console.error('Error syncing focus session with Supabase:', error);
  }
}

// Restore Supabase session from storage
async function restoreSession() {
  const { supabaseSession } = await chrome.storage.local.get(['supabaseSession']);
  if (supabaseSession) {
    await supabase.auth.setSession(supabaseSession);
  }
}

// Sync any unsynced activities from local storage
async function syncPendingActivities() {
  const { activities } = await chrome.storage.local.get(['activities']);
  if (!activities) return;

  const unsynced = activities.filter(a => !a.synced);
  if (unsynced.length === 0) return;

  const payload = unsynced.map(a => ({
    type: a.type,
    name: a.name,
    url: a.url,
    category: a.category,
    duration: a.duration,
    timestamp: a.timestamp,
    productivity_score: a.productivity_score
  }));

  const { error } = await supabase.from('activities').insert(payload);
  if (error) {
    console.error('Failed to sync pending activities:', error);
  } else {
    const updated = activities.map(a => ({ ...a, synced: true }));
    await chrome.storage.local.set({ activities: updated });
  }
}

async function markActivitySynced(id) {
  const { activities } = await chrome.storage.local.get(['activities']);
  if (!activities) return;
  const updated = activities.map(a => (a.id === id ? { ...a, synced: true } : a));
  await chrome.storage.local.set({ activities: updated });
}

// Pomodoro timer functions
function startPomodoroTimer() {
  if (pomodoroTimer) {
    clearInterval(pomodoroTimer);
  }

  pomodoroState.isActive = true;
  pomodoroStartTime = Date.now();

  pomodoroTimer = setInterval(async () => {
    pomodoroState.timeLeft--;
    
    if (pomodoroState.timeLeft <= 0) {
      await handlePomodoroComplete();
    }
    
    // Update storage and badge
    await chrome.storage.local.set({ pomodoroState });
    updateBadge();
  }, 1000);
}

function pausePomodoroTimer() {
  if (pomodoroTimer) {
    clearInterval(pomodoroTimer);
    pomodoroTimer = null;
  }
  pomodoroState.isActive = false;
  chrome.storage.local.set({ pomodoroState });
  updateBadge();
}

function resetPomodoroTimer() {
  if (pomodoroTimer) {
    clearInterval(pomodoroTimer);
    pomodoroTimer = null;
  }
  pomodoroStartTime = null;

  const durations = POMODORO_DURATIONS;

  pomodoroState.isActive = false;
  pomodoroState.timeLeft = durations[pomodoroState.mode];
  chrome.storage.local.set({ pomodoroState });
  updateBadge();
}

async function handlePomodoroComplete() {
  pausePomodoroTimer();

  await syncFocusSession({
    type: pomodoroState.mode,
    duration: POMODORO_DURATIONS[pomodoroState.mode],
    completed: true,
    start_time: new Date(pomodoroStartTime).toISOString(),
    end_time: new Date().toISOString()
  });

  if (pomodoroState.mode === 'pomodoro') {
    pomodoroState.completedSessions++;
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Pomodoro Complete!',
      message: 'Great work! Time for a break.'
    });
    
    // Auto-switch to break
    const nextMode = pomodoroState.completedSessions % 4 === 0 ? 'long_break' : 'short_break';
    switchPomodoroMode(nextMode);
  } else {
    // Break complete
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Break Complete!',
      message: 'Ready to focus again?'
    });
    
    switchPomodoroMode('pomodoro');
  }
}

function switchPomodoroMode(mode) {
  const durations = POMODORO_DURATIONS;

  pomodoroState.mode = mode;
  pomodoroState.timeLeft = durations[mode];
  pomodoroState.isActive = false;

  chrome.storage.local.set({ pomodoroState });
  updateBadge();
}

// Update extension badge
function updateBadge() {
  if (pomodoroState.isActive) {
    const minutes = Math.floor(pomodoroState.timeLeft / 60);
    chrome.action.setBadgeText({ text: minutes.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else if (isTracking) {
    chrome.action.setBadgeText({ text: '●' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Message handling from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request.action) {
      case 'startTracking':
        isTracking = true;
        chrome.storage.local.set({ isTracking: true });
        updateBadge();
        sendResponse({ success: true });
        break;

      case 'stopTracking':
        isTracking = false;
        recordCurrentActivity();
        currentTab = null;
        startTime = null;
        chrome.storage.local.set({ isTracking: false });
        updateBadge();
        sendResponse({ success: true });
        break;

      case 'startPomodoro':
        startPomodoroTimer();
        sendResponse({ success: true });
        break;

      case 'pausePomodoro':
        pausePomodoroTimer();
        sendResponse({ success: true });
        break;

      case 'resetPomodoro':
        resetPomodoroTimer();
        sendResponse({ success: true });
        break;

      case 'switchPomodoroMode':
        switchPomodoroMode(request.mode);
        sendResponse({ success: true });
        break;

      case 'login':
        try {
          if (request.provider) {
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: request.provider
            });
            if (error) {
              sendResponse({ success: false, error: error.message });
            } else {
              sendResponse({ success: true, url: data.url });
            }
          } else {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: request.email,
              password: request.password
            });
            if (error) {
              sendResponse({ success: false, error: error.message });
            } else {
              await chrome.storage.local.set({ supabaseSession: data.session });
              await syncPendingActivities();
              sendResponse({ success: true });
            }
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'logout':
        await supabase.auth.signOut();
        await chrome.storage.local.remove('supabaseSession');
        sendResponse({ success: true });
        break;

      case 'getState':
        sendResponse({
          isTracking,
          pomodoroState,
          currentTab
        });
        break;
    }
  })();
  return true;
});

// Utility function to generate IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize state on startup
chrome.storage.local.get(['isTracking', 'pomodoroState']).then((result) => {
  isTracking = result.isTracking || false;
  if (result.pomodoroState) {
    pomodoroState = result.pomodoroState;
  }
  updateBadge();
});
