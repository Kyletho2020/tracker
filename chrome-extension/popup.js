// Popup script for Chrome extension
// Supabase client setup - replace with your project's credentials
const SUPABASE_URL = 'https://YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
});

let currentState = {
  isTracking: false,
  pomodoroState: {
    isActive: false,
    timeLeft: 25 * 60,
    mode: 'pomodoro',
    completedSessions: 0,
  },
  currentTab: null,
};

// DOM elements
const authSection = document.getElementById('auth-section');
const mainContent = document.getElementById('main-content');
const mainFooter = document.getElementById('main-footer');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signInBtn = document.getElementById('sign-in-btn');
const signUpBtn = document.getElementById('sign-up-btn');
const authMessage = document.getElementById('auth-message');

const trackingDot = document.getElementById('tracking-dot');
const trackingStatus = document.getElementById('tracking-status');
const trackingToggle = document.getElementById('tracking-toggle');
const currentSite = document.getElementById('current-site');
const siteName = document.getElementById('site-name');

const timerTime = document.getElementById('timer-time');
const timerMode = document.getElementById('timer-mode');
const timerStart = document.getElementById('timer-start');
const timerPause = document.getElementById('timer-pause');
const timerReset = document.getElementById('timer-reset');

const totalTime = document.getElementById('total-time');
const productiveTime = document.getElementById('productive-time');
const sessionsCompleted = document.getElementById('sessions-completed');
const sitesVisited = document.getElementById('sites-visited');

const openDashboard = document.getElementById('open-dashboard');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await initializeAuth();
  await loadCurrentState();
  updateUI();
  setupEventListeners();

  // Update every second
  setInterval(updateUI, 1000);
});

// Load current state from background script
async function loadCurrentState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (response) {
        currentState = response;
      }
      resolve();
    });
  });
}

// Initialize authentication
async function initializeAuth() {
  const { supabaseSession } = await chrome.storage.local.get(['supabaseSession']);
  if (supabaseSession) {
    const { data, error } = await sb.auth.setSession(supabaseSession);
    if (!error && data.session) {
      showMainContent();
    } else {
      await chrome.storage.local.remove(['supabaseSession', 'userId']);
      showAuth();
    }
  } else {
    showAuth();
  }

  sb.auth.onAuthStateChange(async (_event, session) => {
    if (session) {
      await chrome.storage.local.set({
        supabaseSession: session,
        userId: session.user.id,
      });
      showMainContent();
    } else {
      await chrome.storage.local.remove(['supabaseSession', 'userId']);
      showAuth();
    }
  });
}

function showAuth() {
  authSection.style.display = 'block';
  mainContent.style.display = 'none';
  mainFooter.style.display = 'none';
}

function showMainContent() {
  authSection.style.display = 'none';
  mainContent.style.display = 'block';
  mainFooter.style.display = 'block';
}

// Setup event listeners
function setupEventListeners() {
  // Auth buttons
  signInBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    authMessage.textContent = '';
    const email = emailInput.value;
    const password = passwordInput.value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) authMessage.textContent = error.message;
  });

  signUpBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    authMessage.textContent = '';
    const email = emailInput.value;
    const password = passwordInput.value;
    const { error } = await sb.auth.signUp({ email, password });
    if (error) authMessage.textContent = error.message;
    else authMessage.textContent = 'Check your email to confirm sign up';
  });

  // Tracking toggle
  trackingToggle.addEventListener('click', () => {
    const action = currentState.isTracking ? 'stopTracking' : 'startTracking';
    chrome.runtime.sendMessage({ action }, (response) => {
      if (response.success) {
        currentState.isTracking = !currentState.isTracking;
        updateUI();
      } else if (response && response.error) {
        alert(response.error);
      }
    });
  });

  // Timer controls
  timerStart.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startPomodoro' }, (response) => {
      if (response.success) {
        currentState.pomodoroState.isActive = true;
        updateUI();
      }
    });
  });

  timerPause.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'pausePomodoro' }, (response) => {
      if (response.success) {
        currentState.pomodoroState.isActive = false;
        updateUI();
      }
    });
  });

  timerReset.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'resetPomodoro' }, (response) => {
      if (response.success) {
        currentState.pomodoroState.isActive = false;
        updateUI();
      }
    });
  });

  // Mode selector
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      chrome.runtime.sendMessage({ 
        action: 'switchPomodoroMode', 
        mode 
      }, (response) => {
        if (response.success) {
          currentState.pomodoroState.mode = mode;
          updateUI();
        }
      });
    });
  });

  // Open dashboard
  openDashboard.addEventListener('click', () => {
    chrome.tabs.create({ 
      url: 'https://lighthearted-sable-4057e7.netlify.app' 
    });
  });
}

// Update UI elements
function updateUI() {
  updateTrackingStatus();
  updateTimerDisplay();
  updateModeSelector();
  updateStats();
}

// Update tracking status
function updateTrackingStatus() {
  if (currentState.isTracking) {
    trackingDot.classList.add('active');
    trackingStatus.textContent = 'Active';
    trackingToggle.textContent = 'Stop';
    trackingToggle.classList.add('danger');
    
    if (currentState.currentTab) {
      currentSite.style.display = 'block';
      siteName.textContent = currentState.currentTab.domain || 'Unknown';
    }
  } else {
    trackingDot.classList.remove('active');
    trackingStatus.textContent = 'Stopped';
    trackingToggle.textContent = 'Start';
    trackingToggle.classList.remove('danger');
    currentSite.style.display = 'none';
  }
}

// Update timer display
function updateTimerDisplay() {
  const { timeLeft, isActive, mode } = currentState.pomodoroState;
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  timerTime.textContent = timeString;
  
  const modeLabels = {
    pomodoro: 'Focus Time',
    short_break: 'Short Break',
    long_break: 'Long Break'
  };
  timerMode.textContent = modeLabels[mode];
  
  if (isActive) {
    timerStart.style.display = 'none';
    timerPause.style.display = 'inline-block';
  } else {
    timerStart.style.display = 'inline-block';
    timerPause.style.display = 'none';
  }
}

// Update mode selector
function updateModeSelector() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === currentState.pomodoroState.mode) {
      btn.classList.add('active');
    }
  });
}

// Update statistics
async function updateStats() {
  try {
    // Get today's stats from storage
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get(['dailyStats', 'activities']);
    
    const todayStats = result.dailyStats?.[today] || {
      totalTime: 0,
      productiveTime: 0,
      activities: 0,
      categories: {}
    };
    
    const activities = result.activities || [];
    const todayActivities = activities.filter(
      activity => new Date(activity.timestamp).toDateString() === today
    );
    
    // Format time
    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };
    
    // Update display
    totalTime.textContent = formatTime(todayStats.totalTime);
    productiveTime.textContent = formatTime(todayStats.productiveTime);
    sessionsCompleted.textContent = currentState.pomodoroState.completedSessions.toString();
    
    // Count unique sites
    const uniqueSites = new Set(todayActivities.map(a => a.domain)).size;
    sitesVisited.textContent = uniqueSites.toString();
    
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// Refresh state periodically
setInterval(async () => {
  await loadCurrentState();
}, 2000);