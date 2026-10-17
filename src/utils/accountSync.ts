import type { LineupPlan } from './lineupAdvisor';
import { supabase } from '../lib/supabase';

export type ManagerAccount = { user_id: string; fpl_entry_id: string | null };

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured for this Play XI deployment.');
  return supabase;
}

export async function loadManagerAccount(userId: string): Promise<ManagerAccount | null> {
  const { data, error } = await requireSupabase()
    .from('manager_accounts')
    .select('user_id, fpl_entry_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveManagerAccount(userId: string, entryId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('manager_accounts')
    .upsert({ user_id: userId, fpl_entry_id: entryId }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function loadGameweekPlan(userId: string, entryId: string, eventId: number): Promise<LineupPlan | null> {
  const { data, error } = await requireSupabase()
    .from('gameweek_plans')
    .select('plan_data')
    .eq('user_id', userId)
    .eq('fpl_entry_id', entryId)
    .eq('event_id', eventId)
    .maybeSingle();
  if (error) throw error;
  return (data?.plan_data as LineupPlan | undefined) ?? null;
}

export async function saveGameweekPlan(userId: string, entryId: string, eventId: number, plan: LineupPlan): Promise<void> {
  const { error } = await requireSupabase()
    .from('gameweek_plans')
    .upsert({ user_id: userId, fpl_entry_id: entryId, event_id: eventId, plan_data: plan }, {
      onConflict: 'user_id,fpl_entry_id,event_id',
    });
  if (error) throw error;
}
