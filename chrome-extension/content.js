// Content script for website tracking
let pageStartTime = Date.now();
let isVisible = true;

// Track page visibility changes
document.addEventListener('visibilitychange', () => {
  isVisible = !document.hidden;
  
  if (isVisible) {
    pageStartTime = Date.now();
  } else {
    // Page became hidden, could record time spent
    const timeSpent = Date.now() - pageStartTime;
    if (timeSpent > 5000) { // Only track if more than 5 seconds
      chrome.runtime.sendMessage({
        action: 'pageTimeUpdate',
        timeSpent: timeSpent,
        url: window.location.href,
        title: document.title
      });
    }
  }
});

// Track scroll and interaction events to measure engagement
let lastActivity = Date.now();
let totalScrollDistance = 0;
let interactions = 0;

function updateActivity() {
  lastActivity = Date.now();
  interactions++;
}

// Listen for user interactions
['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
  document.addEventListener(event, updateActivity, { passive: true });
});

// Track scroll distance
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  totalScrollDistance += Math.abs(currentScrollY - lastScrollY);
  lastScrollY = currentScrollY;
}, { passive: true });

// Send engagement data periodically
setInterval(() => {
  if (isVisible && (Date.now() - lastActivity) < 30000) { // Active in last 30 seconds
    chrome.runtime.sendMessage({
      action: 'engagementUpdate',
      url: window.location.href,
      title: document.title,
      scrollDistance: totalScrollDistance,
      interactions: interactions,
      timeActive: Date.now() - pageStartTime
    });
  }
}, 30000); // Every 30 seconds

// Inject floating timer widget (optional)
function createFloatingTimer() {
  const timerWidget = document.createElement('div');
  timerWidget.id = 'rize-timer-widget';
  timerWidget.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 120px;
    height: 60px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    font-weight: bold;
    z-index: 10000;
    cursor: pointer;
    transition: opacity 0.3s;
    opacity: 0.7;
  `;
  
  timerWidget.innerHTML = '<div id="timer-display">25:00</div>';
  
  timerWidget.addEventListener('mouseenter', () => {
    timerWidget.style.opacity = '1';
  });
  
  timerWidget.addEventListener('mouseleave', () => {
    timerWidget.style.opacity = '0.7';
  });
  
  timerWidget.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  document.body.appendChild(timerWidget);
  
  // Update timer display
  function updateTimerDisplay() {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (response && response.pomodoroState) {
        const { timeLeft, isActive, mode } = response.pomodoroState;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const display = document.getElementById('timer-display');
        if (display) {
          display.textContent = timeString;
          timerWidget.style.background = isActive ? 
            (mode === 'pomodoro' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)') :
            'rgba(0, 0, 0, 0.8)';
        }
      }
    });
  }
  
  // Update every second
  setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

// Only show timer widget on certain sites (configurable)
const showTimerSites = ['github.com', 'stackoverflow.com', 'notion.so'];
const currentDomain = window.location.hostname;

if (showTimerSites.some(site => currentDomain.includes(site))) {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingTimer);
  } else {
    createFloatingTimer();
  }
}