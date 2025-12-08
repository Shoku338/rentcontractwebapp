import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req:NextRequest)
{
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const { searchParams } = new URL(req.url);
        const billingId = searchParams.get('BillingId');

        if (!billingId) {
            return NextResponse.json({ error: 'BillingId is required' }, { status: 400 });
        }

        const { data: billingDetails, error } = await supabase
            .from('BillingDetails')
            .select('*')
            .eq('BillingId', billingId);

        if(error) {
            console.log('Error fetching billing details:', error);
            return NextResponse.json({
              error: `Error fetching billing details: ${error.message}`,
              details: error.details,
              hint: error.hint }, {status: 500});
        }
        return NextResponse.json(billingDetails);
    } catch (err) {
        console.error('API error in GET /api/BillingDetails:', err);
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Unknown server error' },
          { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const payload = await req.json();

    // The payload can be a single object or an array of objects.
    // Supabase's .insert() method handles both cases seamlessly.
    const recordsToInsert = Array.isArray(payload) ? payload : [payload];

    const { data, error } = await supabase
      .from('BillingDetails')
      .insert(recordsToInsert)
      .select();

    if (error) {
      console.error('Supabase error creating billing detail:', error);
      return NextResponse.json({
        error: 'Failed to create billing details.', 
        message: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('API error in POST /api/BillingDetails:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { id, ...updateData } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id for the billing detail to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('BillingDetails')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating billing detail:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API error in PATCH /api/BillingDetails:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}