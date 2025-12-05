import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req:NextRequest)
{
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {data: newestTenant, error} = await supabase. from('Contract').select('*');
    if(error)
    {
        console.log('Error fetching newest tenant:', error);
        return NextResponse.json({error: `Error fetching newest tenant: ${error.message}`}, {status: 500});
    }
    return NextResponse.json(newestTenant);
}