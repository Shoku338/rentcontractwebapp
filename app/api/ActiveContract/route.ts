import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch contracts that are either 'Active' or 'Reserved'
    const { data, error } = await supabase
        .from("Contract")
        .select("RoomID, ContractStatus")
        .in("ContractStatus", ["Active", "Reserved"]);

    if (error) {
        console.error("Error fetching active/reserved contracts:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
}