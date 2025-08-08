import { createClient } from '@supabase/supabase-js';
import { Activity, FocusSession, Goal } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export const dbHelpers = {
  // Activities
  async createActivity(activity: Omit<Activity & { user_id: string }, 'id'>) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single();

    if (error) throw error;
    return data as Activity;
  },

  async getActivities(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Activity[]> {
    let query = supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Activity[];
  },

  // Focus Sessions
  async createFocusSession(
    session: Omit<FocusSession & { user_id: string }, 'id' | 'end_time' | 'completed'>
  ) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([session])
      .select()
      .single();

    if (error) throw error;
    return data as FocusSession;
  },

  async updateFocusSession(id: string, updates: Partial<FocusSession>) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FocusSession;
  },

  // Goals
  async createGoal(
    goal: Omit<Goal & { user_id: string }, 'id' | 'progress' | 'created_at'>
  ) {
    const { data, error } = await supabase
      .from('goals')
      .insert([goal])
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  },

  async updateGoal(id: string, updates: Partial<Goal>) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  },

  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Goal[];
  },

  async getActivityStats(userId: string) {
    const { data, error } = await supabase
      .from('activities')
      .select(
        "date:date_trunc('day', timestamp), total_duration:sum(duration), average_productivity:avg(productivity_score)"
      )
      .eq('user_id', userId)
      .group('date')
      .order('date');

    if (error) throw error;
    return data as { date: string; total_duration: number; average_productivity: number }[];
  },

  async getPomodoroStats(userId: string) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select(
        "date:date_trunc('day', start_time), completed_sessions:count(id)"
      )
      .eq('user_id', userId)
      .eq('completed', true)
      .group('date')
      .order('date');

    if (error) throw error;
    return data as { date: string; completed_sessions: number }[];
  },
};