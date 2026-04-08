import { supabase } from './supabaseClient';

const PROGRESS_TABLE = 'user_word_progress';
const PROFILE_TABLE = 'profiles';
const EVENTS_TABLE = 'study_events';
const USER_SETS_TABLE = 'user_sets';
const WORD_EXAMPLES_TABLE = 'word_examples';

export async function fetchUserProgress(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function upsertUserProgress(rows) {
  if (!supabase || !rows?.length) return [];

  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .upsert(rows, { onConflict: 'user_id,word_id', ignoreDuplicates: false })
    .select('user_id, word_id, updated_at');

  if (error) throw error;
  return data || [];
}

export async function fetchUserProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertUserProfile(profile) {
  if (!supabase || !profile?.id) return null;

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .upsert(profile, { onConflict: 'id', ignoreDuplicates: false })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchStudyEvents(userId, limit = 180) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function insertStudyEvent(event) {
  if (!supabase || !event?.user_id) return null;

  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .insert(event)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserSets(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from(USER_SETS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchWordExamples(userId, limit = 1000) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from(WORD_EXAMPLES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function replaceWordExamples({ userId, setId, wordId, rows }) {
  if (!supabase || !userId || !setId || !wordId) return [];

  const { error: deleteError } = await supabase
    .from(WORD_EXAMPLES_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('set_id', setId)
    .eq('word_id', wordId);

  if (deleteError) throw deleteError;
  if (!rows?.length) return [];

  const { data, error } = await supabase
    .from(WORD_EXAMPLES_TABLE)
    .insert(rows)
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function upsertUserSet(userSet) {
  if (!supabase || !userSet?.id) return null;

  const { data, error } = await supabase
    .from(USER_SETS_TABLE)
    .upsert(userSet, { onConflict: 'id', ignoreDuplicates: false })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserSet(setId, userId) {
  if (!supabase || !setId || !userId) return;

  const { error } = await supabase
    .from(USER_SETS_TABLE)
    .delete()
    .eq('id', setId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function fetchSharedSetBySlug(slug) {
  if (!supabase || !slug) return null;

  const { data, error } = await supabase
    .from(USER_SETS_TABLE)
    .select('*')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function subscribeToUserChannel(userId, handlers = {}) {
  if (!supabase || !userId) return () => {};

  const channel = supabase.channel(`study-sync-${userId}-${Date.now()}`);

  if (handlers.onProgressChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: PROGRESS_TABLE, filter: `user_id=eq.${userId}` },
      handlers.onProgressChange,
    );
  }

  if (handlers.onProfileChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: PROFILE_TABLE, filter: `id=eq.${userId}` },
      handlers.onProfileChange,
    );
  }

  if (handlers.onStudyEvent) {
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: EVENTS_TABLE, filter: `user_id=eq.${userId}` },
      handlers.onStudyEvent,
    );
  }

  if (handlers.onUserSetChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: USER_SETS_TABLE, filter: `user_id=eq.${userId}` },
      handlers.onUserSetChange,
    );
  }

  if (handlers.onWordExamplesChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: WORD_EXAMPLES_TABLE, filter: `user_id=eq.${userId}` },
      handlers.onWordExamplesChange,
    );
  }

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
