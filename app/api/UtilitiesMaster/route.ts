import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET all utility rates
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.from('Utilities').select('*');

    if (error) {
      console.error('Error fetching utilities:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API error in GET /api/Utilities:', err);
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
    const { Name, RatePerUnit } = await req.json();

    if (!Name || RatePerUnit === undefined) {
      return NextResponse.json(
        { error: 'Missing Name or RatePerUnit' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('Utilities')
      .insert([{ Name, RatePerUnit: Number(RatePerUnit) }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating utility:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('API error in POST /api/UtilitiesMaster:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown server error' },
      { status: 500 }
    );
  }
}

// PATCH to update a utility rate
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { utilitiesRateID, RatePerUnit } = await req.json();

    if (!utilitiesRateID || RatePerUnit === undefined) {
      return NextResponse.json(
        { error: 'Missing utilitiesRateID or RatePerUnit' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('Utilities')
      .update({ RatePerUnit })
      .eq('utilitiesRateID', utilitiesRateID)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating utility:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API error in PATCH /api/Utilities:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown server error' },
      { status: 500 }
    );
  }
}