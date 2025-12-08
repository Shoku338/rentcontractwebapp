import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req:NextRequest)
{
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('Status');

        let query = supabase
            .from('Billing')
            .select(`
                *,
                Contract (
                    *,
                    tenants ( Firstname, Lastname ),
                    Room ( RoomName, RoomID )
                )
            `);
        
        // If a status is provided in the URL, filter by it
        if (status) {
            query = query.eq('Status', status);
        }
        
        // Join Billing with Contract, and then Contract with tenants and Room
        // This gives you all the related info in one query.
        const {data: billings, error} = await query;

        if(error) {
            console.log('Error fetching billings:', error);
            return NextResponse.json({
              error: `Error fetching billings: ${error.message}`,
              details: error.details,
              hint: error.hint }, {status: 500});
        }
        return NextResponse.json(billings);
    } catch (err) {
        console.error('API error in GET /api/Billing:', err);
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

    // Basic validation for required fields from the client
    if (!payload.ContractId || !payload.BillingMonth || !payload.DueDate || payload.GrandTotal === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: ContractId, BillingMonth, DueDate, GrandTotal' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('Billing')
      .upsert(payload, { 
        onConflict: 'ContractId, BillingMonth' // Use the unique constraint
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating bill:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('API error in POST /api/Billing:', err);
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
    // Make it more flexible to accept any update data
    const { id, ...updateData } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing bill id to update' },
        { status: 400 }
      );
    }

    // If status is being updated to 'Paid', ensure PaymentDate is also set
    if (updateData.Status === 'Paid' && !updateData.PaymentDate) {
      updateData.PaymentDate = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('Billing')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API error in PATCH /api/Billing:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}