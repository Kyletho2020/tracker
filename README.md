# RizeTracker Dashboard

This project provides a web dashboard for the RizeTracker extension, offering activity tracking and productivity analytics.

## Hosted Dashboard

A live deployment is available at:

https://example.com

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Configure Supabase credentials in a `.env` file or via your hosting provider:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

The `src/` folder contains a Vite + React app that can be deployed to services like Vercel. Set the above environment variables in the hosting platform's settings before deploying.

## Features

- Supabase authentication so users log into the same account as the extension.
- Analytics view with charts for activity over time, productivity scores, and Pomodoro completion stats.

