import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }

    const { 
      accommodationId, 
      checkIn, 
      checkOut, 
      amount, 
      bookingId, 
      returnUrl,
      numberOfDays,
      numberOfWeeks
    } = await req.json();

    // Validate required fields
    if (!accommodationId || !checkIn || !checkOut || !amount || !returnUrl) {
      throw new Error('Missing required fields');
    }

    // Get accommodation details
    const { data: accommodation, error: accommodationError } = await supabase
      .from('accommodations')
      .select('title, price')
      .eq('id', accommodationId)
      .single();

    if (accommodationError || !accommodation) {
      throw new Error('Accommodation not found');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: user.id,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: accommodation.title,
              description: [
                `${numberOfDays} days (${numberOfWeeks} weeks)`,
                `Check-in: ${new Date(checkIn).toLocaleDateString()}`,
                `Check-out: ${new Date(checkOut).toLocaleDateString()}`,
                `Weekly rate: €${accommodation.price}`
              ].join('\n'),
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/cancel`,
      metadata: {
        accommodationId,
        checkIn,
        checkOut,
        bookingId,
        numberOfDays,
        numberOfWeeks,
        weeklyRate: accommodation.price,
        userId: user.id
      },
    });

    return new Response(
      JSON.stringify({ session_url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to create checkout session'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});