import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// GET readings for a specific month
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const year = req.nextUrl.searchParams.get("year");
  const month = req.nextUrl.searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json(
      { error: "Missing year or month" },
      { status: 400 }
    );
  }

  const monthyear = `${year}-${String(month).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("MeterReadings") // MUST match exact casing
    .select("*")
    .eq("monthyear", monthyear);

  if (error) {
    console.error("GET meter error:", error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json(data);
}

// UPDATE an existing reading
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const body = await req.json();
  const { id, CurrentValue } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing reading id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("MeterReadings")
    .update({ currentvalue: CurrentValue })
    .eq("readingid", id)
    .select()
    .single();

  if (error) {
    console.error("PATCH meter error:", error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json(data);
}

// CREATE a new reading
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const body = await req.json();
  const { RoomID, Year, Month, PreviousValue, CurrentValue } = body;

  if (!RoomID || !Year || !Month) {
    return NextResponse.json(
      { error: "Missing RoomID, Year, or Month" },
      { status: 400 }
    );
  }

  const monthyear = `${Year}-${String(Month).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("MeterReadings")
    .insert({
      roomid: RoomID,
      monthyear,
      previousvalue: PreviousValue ?? 0,
      currentvalue: CurrentValue ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error("POST meter error:", error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json(data);
}
