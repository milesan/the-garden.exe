import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useState } from 'react';
import { Sprout } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [authError, setAuthError] = useState<string | null>(null);

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_UP') {
      setAuthError('Please check your email for the confirmation link.');
    } else if (event === 'SIGNED_IN') {
      setAuthError(null);
    } else if (event === 'SIGNED_OUT') {
      setAuthError(null);
    }
  });

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sprout className="w-10 h-10 text-emerald-900" />
          <div>
            <h1 className="text-3xl font-display font-light text-stone-900">The Garden</h1>
          </div>
        </div>
        <p className="text-stone-600 font-body">Welcome to reality</p>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
        {authError && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-sm">
            {authError}
          </div>
        )}
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#064E3B',
                  brandAccent: '#065F46',
                  defaultButtonBackground: '#FFFFFF',
                  defaultButtonBackgroundHover: '#F5F7F6',
                  inputBackground: '#FFFFFF',
                  inputBorder: '#E5E7EB',
                  inputText: '#1F2937',
                },
              },
            },
            className: {
              container: 'font-body',
              button: 'font-body text-sm',
              input: 'font-body text-sm',
              label: 'font-body text-sm text-stone-600',
            },
          }}
          providers={[]}
          onError={(error) => {
            setAuthError(error.message);
            console.error('Auth error:', error);
          }}
        />
      </div>
    </div>
  );
}