// Background service worker for Chrome extension
// Supabase project configuration
const SUPABASE_URL = 'https://YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let currentTab = null;
let startTime = null;
let isTracking = false;
let pomodoroTimer = null;
let pomodoroState = {
  isActive: false,
  timeLeft: 25 * 60, // 25 minutes in seconds
  mode: 'pomodoro', // 'pomodoro', 'short_break', 'long_break'
  completedSessions: 0
};

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

  const { supabaseSession } = await chrome.storage.local.get(['supabaseSession']);
  if (!supabaseSession) return;

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
    productivity_score: categoryInfo.productivity
  };

  // Store activity locally
  await storeActivity(activity);

  // Send to main app if configured
  await syncWithMainApp(activity);
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

// Sync with main app (if configured)
async function syncWithMainApp(activity) {
  try {
    const { supabaseSession } = await chrome.storage.local.get(['supabaseSession']);
    if (!supabaseSession) return;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${supabaseSession.access_token}`,
      },
      body: JSON.stringify([{ ...activity, user_id: supabaseSession.user.id }]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to sync activity:', errorText);
    }
  } catch (error) {
    console.error('Error syncing with main app:', error);
  }
}

// Pomodoro timer functions
function startPomodoroTimer() {
  if (pomodoroTimer) {
    clearInterval(pomodoroTimer);
  }

  pomodoroState.isActive = true;
  
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
  
  const durations = {
    pomodoro: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60
  };
  
  pomodoroState.isActive = false;
  pomodoroState.timeLeft = durations[pomodoroState.mode];
  chrome.storage.local.set({ pomodoroState });
  updateBadge();
}

async function handlePomodoroComplete() {
  pausePomodoroTimer();
  
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
  const durations = {
    pomodoro: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60
  };
  
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
  switch (request.action) {
    case 'startTracking':
      chrome.storage.local.get(['supabaseSession']).then(({ supabaseSession }) => {
        if (supabaseSession) {
          isTracking = true;
          chrome.storage.local.set({ isTracking: true });
          updateBadge();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Please sign in first' });
        }
      });
      return true;
      
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
      
    case 'getState':
      sendResponse({
        isTracking,
        pomodoroState,
        currentTab
      });
      break;
  }
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