import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export const dbHelpers = {
  // Activities
  async createActivity(activity: Omit<Activity, 'id'>) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getActivities(userId: string, startDate?: Date, endDate?: Date) {
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
    return data;
  },

  // Focus Sessions
  async createFocusSession(session: Omit<FocusSession, 'id'>) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([session])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateFocusSession(id: string, updates: Partial<FocusSession>) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Goals
  async createGoal(goal: Omit<Goal, 'id'>) {
    const { data, error } = await supabase
      .from('goals')
      .insert([goal])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateGoal(id: string, updates: Partial<Goal>) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getGoals(userId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};