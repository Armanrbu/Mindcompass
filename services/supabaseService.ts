import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, UserStats, PriorityLevel } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
}

// --- User & Streak Management ---

export const getOrCreateUser = async (username: string): Promise<{ profile: UserProfile | null, stats: UserStats }> => {
  // Default empty stats
  const defaultStats: UserStats = { totalCheckIns: 0, lastCheckInDate: null, consistencyStreak: 0 };
  
  if (!supabase) return { profile: null, stats: defaultStats };

  try {
    // 1. Try to find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username) // Assuming username is unique for this MVP
      .single();

    if (user) {
      return {
        profile: { username: user.username, role: user.role, age: user.age_range },
        stats: {
          totalCheckIns: user.total_checkins,
          lastCheckInDate: user.last_checkin_at,
          consistencyStreak: user.consistency_streak
        }
      };
    } else {
      return { profile: null, stats: defaultStats };
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    return { profile: null, stats: defaultStats };
  }
};

export const updateUserProfile = async (profile: UserProfile) => {
  if (!supabase) return;
  
  const { error } = await supabase.from('users').upsert({
    username: profile.username,
    role: profile.role,
    age_range: profile.age,
    updated_at: new Date().toISOString()
  }, { onConflict: 'username' });
  
  if (error) console.error("Error updating profile", error);
};

export const logCheckIn = async (username: string): Promise<UserStats> => {
  if (!supabase) return { totalCheckIns: 1, lastCheckInDate: new Date().toISOString(), consistencyStreak: 1 };

  // Fetch current stats first
  const { data: user } = await supabase.from('users').select('*').eq('username', username).single();
  
  if (!user) return { totalCheckIns: 1, lastCheckInDate: new Date().toISOString(), consistencyStreak: 1 };

  const now = new Date();
  const lastDate = user.last_checkin_at ? new Date(user.last_checkin_at) : null;
  
  let newStreak = user.consistency_streak;
  let newTotal = user.total_checkins;

  // Logic: Check if it's a new day (simple ISO date string comparison)
  const isNewDay = !lastDate || lastDate.toDateString() !== now.toDateString();

  if (isNewDay) {
    newStreak += 1;
    newTotal += 1;
  }

  // Update DB
  await supabase.from('users').update({
    last_checkin_at: now.toISOString(),
    total_checkins: newTotal,
    consistency_streak: newStreak
  }).eq('username', username);

  return {
    totalCheckIns: newTotal,
    lastCheckInDate: now.toISOString(),
    consistencyStreak: newStreak
  };
};

export const saveAssessment = async (username: string, checkinData: any, reflection: string, result: any) => {
  if (!supabase) return;
  await supabase.from('assessments').insert({
    username, // storing username as ref for MVP simplicity
    checkin_data: checkinData,
    reflection_text: reflection,
    priority_level: result.priority,
    created_at: new Date().toISOString()
  });
};
