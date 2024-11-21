import { useState, useEffect } from 'react';
import { isWithinInterval, parseISO, isSameDay } from 'date-fns';
import { supabase } from '../lib/supabase';
import type { SchedulingRule } from '../types/scheduling';

export function useSchedulingRules() {
  const [rules, setRules] = useState<SchedulingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadRules();

    const subscription = supabase
      .channel('scheduling_rules_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'scheduling_rules' 
        }, 
        () => {
          loadRules();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('scheduling_rules')
        .select('*')
        .order('start_date', { ascending: true });

      if (queryError) throw queryError;
      setRules(data || []);
    } catch (err) {
      console.error('Error loading scheduling rules:', err);
      setError(err instanceof Error ? err : new Error('Failed to load scheduling rules'));
    } finally {
      setLoading(false);
    }
  };

  const getEffectiveRule = (date: Date): SchedulingRule | null => {
    // First check for exact date matches in blocked_dates
    const ruleWithBlockedDate = rules.find(rule => {
      const startDate = parseISO(rule.start_date);
      const endDate = parseISO(rule.end_date);
      if (!isWithinInterval(date, { start: startDate, end: endDate })) return false;

      return rule.blocked_dates?.some(blockedDate => 
        isSameDay(parseISO(blockedDate), date)
      );
    });

    if (ruleWithBlockedDate) return ruleWithBlockedDate;

    // Then check for rules in order of specificity
    const applicableRules = rules
      .filter(rule => {
        const startDate = parseISO(rule.start_date);
        const endDate = parseISO(rule.end_date);
        return isWithinInterval(date, { start: startDate, end: endDate });
      })
      .sort((a, b) => {
        // Prioritize blocked rules
        if (a.is_blocked && !b.is_blocked) return -1;
        if (!a.is_blocked && b.is_blocked) return 1;
        
        // Then prioritize rules with custom arrival/departure days
        const aHasCustomDays = Boolean(a.arrival_day || a.departure_day);
        const bHasCustomDays = Boolean(b.arrival_day || b.departure_day);
        if (aHasCustomDays && !bHasCustomDays) return -1;
        if (!aHasCustomDays && bHasCustomDays) return 1;
        
        // Finally, prioritize more recent rules
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    return applicableRules[0] || null;
  };

  const isDateBlocked = (date: Date): boolean => {
    const rule = getEffectiveRule(date);
    if (!rule) return false;

    // If the entire range is blocked
    if (rule.is_blocked) return true;

    // Check if this specific date is blocked
    const dateStr = date.toISOString().split('T')[0];
    return rule.blocked_dates?.includes(dateStr) || false;
  };

  const getArrivalDepartureForDate = (date: Date): { arrival: string | null; departure: string | null } => {
    const rule = getEffectiveRule(date);
    if (!rule || rule.is_blocked) return { arrival: null, departure: null };

    return {
      arrival: rule.arrival_day,
      departure: rule.departure_day
    };
  };

  return {
    rules,
    loading,
    error,
    isDateBlocked,
    getArrivalDepartureForDate,
    refresh: loadRules
  };
}