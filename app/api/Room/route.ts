import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req:NextRequest)
{
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {data: newestTenant, error} = await supabase. from('Room').select('*');
    if(error)
    {
        console.log('Error fetching newest tenant:', error);
        return NextResponse.json({error: `Error fetching newest tenant: ${error.message}`}, {status: 500});
    }
    return NextResponse.json(newestTenant);
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { RoomID, RoomStatus } = await req.json();

    if (!RoomID || !RoomStatus) {
      return NextResponse.json(
        { error: 'Missing RoomID or RoomStatus' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('Room')
      .update({ RoomStatus })
      .eq('RoomID', RoomID)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}