import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

interface WhitelistEntry {
  id: string;
  email: string;
  notes: string;
  created_at: string;
  has_application: boolean;
  application_status?: string;
}

export function Whitelist() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadWhitelist();
  }, []);

  const loadWhitelist = async () => {
    try {
      const { data, error } = await supabase
        .from('whitelist_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error loading whitelist:', err);
      setError(err instanceof Error ? err.message : 'Failed to load whitelist');
    } finally {
      setLoading(false);
    }
  };

  const addToWhitelist = async () => {
    if (!newEmail) return;

    try {
      const { error } = await supabase
        .from('whitelist')
        .insert({ email: newEmail, notes: newNotes });

      if (error) throw error;
      
      setNewEmail('');
      setNewNotes('');
      await loadWhitelist();
    } catch (err) {
      console.error('Error adding to whitelist:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to whitelist');
    }
  };

  const removeFromWhitelist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadWhitelist();
    } catch (err) {
      console.error('Error removing from whitelist:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove from whitelist');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-stone-200 mb-6">
        <h3 className="text-lg font-medium mb-4">Add to Whitelist</h3>
        <div className="flex gap-4">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
          />
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="flex-1 p-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
          />
          <button
            onClick={addToWhitelist}
            className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white p-4 rounded-lg border border-stone-200 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{entry.email}</div>
              {entry.notes && (
                <div className="text-sm text-stone-600 mt-1">{entry.notes}</div>
              )}
              {entry.has_application && (
                <div className="mt-1">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    entry.application_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : entry.application_status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    Application {entry.application_status}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => removeFromWhitelist(entry.id)}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}