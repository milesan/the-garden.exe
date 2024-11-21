import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Accommodation = Database['public']['Tables']['accommodations']['Row'];

export async function createBooking(
  accommodationId: string,
  checkIn: Date,
  checkOut: Date,
  totalPrice: number
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Check if dates are available
    const { data: unavailableDates, error: availabilityError } = await supabase
      .from('availability')
      .select('*')
      .eq('accommodation_id', accommodationId)
      .in('status', ['BOOKED', 'HOLD'])
      .gte('date', checkIn.toISOString().split('T')[0])
      .lt('date', checkOut.toISOString().split('T')[0]);

    if (availabilityError) throw availabilityError;
    if (unavailableDates && unavailableDates.length > 0) {
      throw new Error('Selected dates are not available');
    }

    // Check if user has enough credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile || profile.credits < totalPrice) {
      throw new Error('Insufficient credits');
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        accommodation_id: accommodationId,
        user_id: user.id,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        total_price: totalPrice,
        status: 'confirmed'
      })
      .select('*')
      .single();

    if (bookingError) throw bookingError;

    // Update user's credits
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - totalPrice })
      .eq('id', user.id);

    if (creditError) throw creditError;

    // Record the credit transaction
    const { error: transactionError } = await supabase
      .from('credits')
      .insert({
        user_id: user.id,
        amount: -totalPrice,
        description: `Booking for accommodation ${accommodationId}`,
        booking_id: booking.id
      });

    if (transactionError) throw transactionError;

    // Mark dates as booked
    const dates = [];
    const currentDate = new Date(checkIn);
    while (currentDate < checkOut) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const { error: availabilityUpdateError } = await supabase
      .from('availability')
      .insert(
        dates.map(date => ({
          accommodation_id: accommodationId,
          date,
          status: 'BOOKED'
        }))
      );

    if (availabilityUpdateError) throw availabilityUpdateError;

    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

export async function getUserBookings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        *,
        accommodations (
          title,
          location,
          image_url,
          price
        )
      `)
      .eq('user_id', user.id)
      .order('check_in', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
}