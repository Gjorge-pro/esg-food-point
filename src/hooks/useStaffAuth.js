import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export function useStaffAuth() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  return {
    pending,
    error,
    isConfigured: isSupabaseConfigured,
    async signIn(email, password) {
      if (!supabase) {
        return { error: 'Supabase is not configured.' };
      }

      try {
        setPending(true);
        setError('');
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        return { ok: true };
      } catch (actionError) {
        const message = mapAuthError(actionError.message || 'Failed to sign in.');
        setError(message);
        return { error: message };
      } finally {
        setPending(false);
      }
    },
    async signOut() {
      if (!supabase) return;
      await supabase.auth.signOut();
    },
  };
}

function mapAuthError(message) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Email or password is incorrect. Please check your credentials and try again.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'This account email has not been confirmed yet.';
  }

  if (normalizedMessage.includes('too many requests')) {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }

  return message;
}
