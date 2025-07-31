/*
  # Create focus sessions table

  1. New Tables
    - `focus_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (text) - 'pomodoro', 'short_break', 'long_break', etc.
      - `duration` (bigint) - planned duration in seconds
      - `completed` (boolean) - whether the session was completed
      - `start_time` (timestamptz) - when the session started
      - `end_time` (timestamptz, optional) - when the session ended
      - `notes` (text, optional) - optional notes about the session

  2. Security
    - Enable RLS on `focus_sessions` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  duration bigint NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  notes text
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own focus sessions"
  ON focus_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
  ON focus_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions"
  ON focus_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions"
  ON focus_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON focus_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_type ON focus_sessions(type);