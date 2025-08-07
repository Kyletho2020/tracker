# RizeTracker Chrome Extension

A Chrome extension for tracking website usage and managing Pomodoro focus sessions.

## Features

- **Website Tracking**: Automatically tracks time spent on different websites
- **Pomodoro Timer**: Built-in focus timer with 25-minute work sessions and breaks
- **Real-time Statistics**: View daily productivity stats
- **Floating Timer Widget**: Optional on-page timer display for certain websites
- **Productivity Scoring**: Automatic categorization and scoring of websites
- **Browser Notifications**: Get notified when Pomodoro sessions complete

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension will appear in your browser toolbar

## Usage

### Website Tracking
1. Click the extension icon in your browser toolbar
2. Click "Start" to begin tracking your website usage
3. The extension will automatically track time spent on different sites
4. View real-time stats in the popup

### Pomodoro Timer
1. Open the extension popup
2. Select your preferred mode (Focus, Short Break, Long Break)
3. Click "Start" to begin a focus session
4. The timer will count down and notify you when complete
5. The extension badge will show remaining minutes during active sessions

### Floating Timer Widget
- Appears automatically on productivity-focused websites (GitHub, Stack Overflow, Notion)
- Shows current timer status
- Click to open the main extension popup

## Website Categories

The extension automatically categorizes websites:
- **Development**: GitHub, Stack Overflow (Productivity: 5/5)
- **Communication**: Gmail, Slack (Productivity: 3-4/5)
- **Social Media**: Twitter, Facebook, Instagram (Productivity: 2/5)
- **Entertainment**: YouTube (Productivity: 2/5)
- **Productivity**: Notion, Trello, Asana (Productivity: 5/5)
- **Professional**: LinkedIn (Productivity: 4/5)

## Data Storage

- All data is stored locally in Chrome's storage
- No data is sent to external servers unless syncing is enabled
- Option to sync activities to a Supabase backend (when configured)

## Permissions

The extension requires these permissions:
- `activeTab`: To track current website
- `tabs`: To monitor tab changes
- `storage`: To save tracking data locally
- `alarms`: For timer functionality
- `notifications`: To alert when sessions complete
- `host_permissions`: To track all websites

## Privacy

- All tracking data stays on your device
- No personal information is collected
- Website tracking can be turned on/off at any time