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
            return NextResponse.json({error: `Error fetching billing details: ${error.message}`}, {status: 500});
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

    // Basic validation
    if (!payload.BillingId || !payload.ItemType || !payload.Amount) {
      return NextResponse.json(
        { error: 'Missing required fields: BillingId, ItemType, Amount' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('BillingDetails')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating billing detail:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 400 });
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