export interface SchedulingRule {
  id: string;
  start_date: string;
  end_date: string;
  arrival_day: string | null;
  departure_day: string | null;
  is_blocked: boolean;
  blocked_dates: string[];
  created_at: string;
  updated_at: string;
}

export interface DayRule {
  id: string;
  date: string;
  is_arrival: boolean;
  is_departure: boolean;
  not_arrival: boolean;
  not_departure: boolean;
  created_at: string;
  updated_at: string;
}

export type DayRuleType = 'arrival' | 'departure' | 'not_arrival' | 'not_departure' | null;