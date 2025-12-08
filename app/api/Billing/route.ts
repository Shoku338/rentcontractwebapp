import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req:NextRequest)
{
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Join Billing with Contract, and then Contract with tenants and Room
        // This gives you all the related info in one query.
        const {data: billings, error} = await supabase
            .from('Billing')
            .select(`
                *,
                Contract (
                    *,
                    tenants ( Firstname, Lastname ),
                    Room ( RoomName )
                )
            `);

        if(error) {
            console.log('Error fetching billings:', error);
            return NextResponse.json({error: `Error fetching billings: ${error.message}`}, {status: 500});
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
      .insert([payload]) // Supabase expects an array for insert
      .select()
      .single(); // Assuming we are inserting one record and want it back

    if (error) {
      console.error('Supabase error creating bill:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
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
    // Updated to match your new schema: `id` and `Status`
    const { id, Status } = await req.json();

    if (!id || !Status) {
      return NextResponse.json(
        { error: 'Missing id or Status' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('Billing')
      .update({ 
        Status: Status,
        // If the status is 'Paid', also set the payment date
        ...(Status === 'Paid' && { PaymentDate: new Date().toISOString() })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
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