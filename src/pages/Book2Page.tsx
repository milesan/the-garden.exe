import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '../components/DateRangePicker';
import { AccommodationCard } from '../components/AccommodationCard';
import { useAccommodations } from '../hooks/useAccommodations';
import { useSession } from '../hooks/useSession';
import { AdminArrivalRules } from '../components/AdminArrivalRules';
import { SchedulingRules } from '../components/admin/SchedulingRules';
import { DayRulesModal } from '../components/admin/DayRulesModal';
import { AddRuleForm } from '../components/admin/AddRuleForm';
import { BlockDatesModal } from '../components/admin/BlockDatesModal';
import { useArrivalRules } from '../hooks/useArrivalRules';
import { Calendar, CalendarDays, Plus, Ban } from 'lucide-react';

export function Book2Page() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showAccommodations, setShowAccommodations] = useState(false);
  const [showArrivalRules, setShowArrivalRules] = useState(false);
  const [showSchedulingRules, setShowSchedulingRules] = useState(false);
  const [showDayRules, setShowDayRules] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showBlockDates, setShowBlockDates] = useState(false);
  const { accommodations, loading, error } = useAccommodations();
  const { rules } = useArrivalRules();
  const session = useSession();

  const isAdmin = session?.user?.email === 'andre@thegarden.pt';

  const handleSearch = () => {
    if (dateRange?.from && dateRange?.to) {
      setShowAccommodations(true);
    }
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto mb-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-display font-light text-stone-900 mb-3">Book Your Stay</h1>
            <p className="text-stone-600">Choose a {capitalizeFirstLetter(rules.arrival_day)} to begin your journey</p>
          </div>
          {isAdmin && (
            <div className="flex gap-4">
              <button
                onClick={() => setShowDayRules(true)}
                className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
              >
                <CalendarDays className="w-4 h-4" />
                Day Rules
              </button>
              <button
                onClick={() => setShowAddRule(true)}
                className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
              >
                <Plus className="w-4 h-4" />
                Add Rule
              </button>
              <button
                onClick={() => setShowBlockDates(true)}
                className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
              >
                <Ban className="w-4 h-4" />
                Block Dates
              </button>
              <button
                onClick={() => setShowSchedulingRules(true)}
                className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
              >
                <Calendar className="w-4 h-4" />
                Scheduling Rules
              </button>
              <button
                onClick={() => setShowArrivalRules(true)}
                className="bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
              >
                Set Arrival Rules
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
          <div className="space-y-6">
            <DateRangePicker selected={dateRange} onSelect={setDateRange} />
            <button
              onClick={handleSearch}
              disabled={!dateRange?.from || !dateRange?.to}
              className="w-full bg-emerald-900 text-white py-3 px-6 rounded-lg hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors text-sm font-body"
            >
              Search Available Rooms
            </button>
          </div>
        </div>
      </div>

      {showAccommodations && (
        <div>
          <h2 className="text-3xl font-display font-light text-stone-900 mb-8">Available Rooms</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-900 mx-auto"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-rose-600">
              {error.message}
            </div>
          ) : accommodations.length === 0 ? (
            <div className="text-center py-12 text-stone-600">
              No rooms available for these dates. Please try different dates.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {accommodations.map((accommodation) => (
                <AccommodationCard 
                  key={accommodation.id} 
                  accommodation={accommodation}
                  checkIn={dateRange?.from}
                  checkOut={dateRange?.to}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showArrivalRules && (
        <AdminArrivalRules onClose={() => setShowArrivalRules(false)} />
      )}

      {showSchedulingRules && (
        <SchedulingRules onClose={() => setShowSchedulingRules(false)} />
      )}

      {showDayRules && (
        <DayRulesModal onClose={() => setShowDayRules(false)} />
      )}

      {showAddRule && (
        <AddRuleForm 
          onClose={() => setShowAddRule(false)} 
          onSave={() => {
            setShowAddRule(false);
          }} 
        />
      )}

      {showBlockDates && (
        <BlockDatesModal
          onClose={() => setShowBlockDates(false)}
          onSave={() => {
            setShowBlockDates(false);
          }}
        />
      )}
    </div>
  );
}