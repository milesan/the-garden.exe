import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { convertToUTC1, getUTC1Date } from '../utils/timezone';
import { ManualBookingModal } from './ManualBookingModal';

interface Accommodation {
  id: string;
  title: string;
  type: string;
  inventory_count: number;
}

type AvailabilityStatus = 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'CHECK_IN' | 'CHECK_OUT';

export function InventoryCalendar() {
  const [currentDate, setCurrentDate] = useState(() => getUTC1Date(new Date()));
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, AvailabilityStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showManualBooking, setShowManualBooking] = useState(false);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  }).map(date => getUTC1Date(date));

  useEffect(() => {
    loadData();

    const subscription = supabase
      .channel('availability_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'availability' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentDate]);

  async function loadData() {
    try {
      setError(null);
      const { data: accommodationsData, error: accommodationsError } = await supabase
        .from('accommodations')
        .select('*')
        .order('title');
      
      if (accommodationsError) throw accommodationsError;

      const startDate = getUTC1Date(startOfMonth(currentDate));
      const endDate = getUTC1Date(endOfMonth(currentDate));

      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (availabilityError) throw availabilityError;

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .or(`check_in.gte.${startDate.toISOString()},check_out.lte.${endDate.toISOString()}`);

      if (bookingsError) throw bookingsError;

      setAccommodations(accommodationsData || []);
      
      const newAvailabilityMap: Record<string, AvailabilityStatus> = {};
      
      availabilityData?.forEach((av: any) => {
        const key = `${av.accommodation_id}-${getUTC1Date(new Date(av.date)).toISOString().split('T')[0]}`;
        newAvailabilityMap[key] = av.status;
      });

      bookingsData?.forEach((booking: any) => {
        const checkInKey = `${booking.accommodation_id}-${getUTC1Date(new Date(booking.check_in)).toISOString().split('T')[0]}`;
        const checkOutKey = `${booking.accommodation_id}-${getUTC1Date(new Date(booking.check_out)).toISOString().split('T')[0]}`;
        
        newAvailabilityMap[checkInKey] = 'CHECK_IN';
        newAvailabilityMap[checkOutKey] = 'CHECK_OUT';
      });

      setAvailabilityMap(newAvailabilityMap);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const handleCellClick = async (date: Date, accommodation: Accommodation) => {
    try {
      const utc1Date = getUTC1Date(date);
      const key = `${accommodation.id}-${utc1Date.toISOString().split('T')[0]}`;
      const currentStatus = availabilityMap[key] || 'AVAILABLE';
      
      if (['BOOKED', 'CHECK_IN', 'CHECK_OUT'].includes(currentStatus)) return;

      const newStatus: AvailabilityStatus = currentStatus === 'AVAILABLE' ? 'HOLD' : 'AVAILABLE';

      setAvailabilityMap(prev => ({
        ...prev,
        [key]: newStatus
      }));

      const { error: upsertError } = await supabase
        .from('availability')
        .upsert({
          accommodation_id: accommodation.id,
          date: utc1Date.toISOString().split('T')[0],
          status: newStatus
        }, {
          onConflict: 'accommodation_id,date'
        });

      if (upsertError) throw upsertError;
    } catch (err) {
      console.error('Error updating availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to update availability');
      await loadData();
    }
  };

  const getCellStyle = (status: AvailabilityStatus) => {
    const baseStyle = 'h-8 px-2 text-center text-xs border-r cursor-pointer transition-colors';
    
    switch (status) {
      case 'CHECK_IN':
        return `${baseStyle} bg-gradient-to-r from-emerald-500 to-black text-white`;
      case 'CHECK_OUT':
        return `${baseStyle} bg-gradient-to-l from-emerald-500 to-black text-white`;
      case 'BOOKED':
        return `${baseStyle} bg-black text-white cursor-not-allowed`;
      case 'HOLD':
        return `${baseStyle} bg-yellow-400`;
      default:
        return `${baseStyle} bg-emerald-500 text-white`;
    }
  };

  const getCellContent = (status: AvailabilityStatus) => {
    switch (status) {
      case 'CHECK_IN':
        return '→';
      case 'CHECK_OUT':
        return '←';
      case 'BOOKED':
        return '×';
      case 'HOLD':
        return '⌛';
      default:
        return '✓';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowManualBooking(true)}
            className="bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
          >
            Add Manual Booking
          </button>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span>Hold</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-black"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-black"></div>
              <span>Check-in/out</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Accommodation
                </th>
                {daysInMonth.map(day => (
                  <th key={day.toISOString()} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[32px]">
                    <div>{format(day, 'd')}</div>
                    <div>{format(day, 'EEE')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accommodations.map((accommodation) => (
                <tr key={accommodation.id}>
                  <td className="sticky left-0 bg-white px-4 py-2 whitespace-nowrap border-r">
                    <div className="text-sm font-medium text-gray-900">
                      {accommodation.title} ({accommodation.inventory_count})
                    </div>
                  </td>
                  {daysInMonth.map(day => {
                    const key = `${accommodation.id}-${day.toISOString().split('T')[0]}`;
                    const status = availabilityMap[key] || 'AVAILABLE';
                    return (
                      <td
                        key={day.toISOString()}
                        className={getCellStyle(status)}
                        onClick={() => handleCellClick(day, accommodation)}
                      >
                        {getCellContent(status)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showManualBooking && (
        <ManualBookingModal
          onClose={() => setShowManualBooking(false)}
          onSuccess={() => {
            setShowManualBooking(false);
            loadData();
          }}
          accommodations={accommodations}
        />
      )}
    </div>
  );
}