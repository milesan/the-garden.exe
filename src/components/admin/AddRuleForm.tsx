import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import type { SchedulingRule } from '../../types/scheduling';

interface Props {
  onClose: () => void;
  onSave: () => void;
  editingRule?: SchedulingRule | null;
}

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;

export function AddRuleForm({ onClose, onSave, editingRule }: Props) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    editingRule ? new Date(editingRule.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    editingRule ? new Date(editingRule.end_date) : undefined
  );
  const [isBlocked, setIsBlocked] = useState(editingRule?.is_blocked || false);
  const [arrivalDay, setArrivalDay] = useState<string | undefined>(editingRule?.arrival_day || undefined);
  const [departureDay, setDepartureDay] = useState<string | undefined>(editingRule?.departure_day || undefined);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      if (!startDate || !endDate) {
        setError('Please select both start and end dates');
        return;
      }

      setSaving(true);
      setError(null);

      const ruleData = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_blocked: isBlocked,
        arrival_day: arrivalDay || null,
        departure_day: departureDay || null
      };

      if (editingRule) {
        const { error: updateError } = await supabase
          .from('scheduling_rules')
          .update(ruleData)
          .eq('id', editingRule.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('scheduling_rules')
          .insert([ruleData]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg w-full max-w-xl">
        <div className="p-4 border-b border-stone-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">
            {editingRule ? 'Edit Rule' : 'Add New Rule'}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Start Date
                </label>
                <DayPicker
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className="border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  End Date
                </label>
                <DayPicker
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={date => date < (startDate || new Date())}
                  className="border rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-rose-50 p-3 rounded-lg">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isBlocked}
                    onChange={(e) => {
                      setIsBlocked(e.target.checked);
                      if (e.target.checked) {
                        setArrivalDay(undefined);
                        setDepartureDay(undefined);
                      }
                    }}
                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-600"
                  />
                  <span className="text-sm font-medium text-rose-900">Block all dates in this range</span>
                </label>
              </div>

              {!isBlocked && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Custom Arrival Day
                    </label>
                    <select
                      value={arrivalDay || ''}
                      onChange={(e) => setArrivalDay(e.target.value || undefined)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Default</option>
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Custom Departure Day
                    </label>
                    <select
                      value={departureDay || ''}
                      onChange={(e) => setDepartureDay(e.target.value || undefined)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Default</option>
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !startDate || !endDate}
                className="bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 disabled:bg-stone-300"
              >
                {saving ? 'Saving...' : editingRule ? 'Update' : 'Add Rule'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}