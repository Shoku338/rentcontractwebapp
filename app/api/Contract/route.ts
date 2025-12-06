import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

type ContractPayload = {
  RoomID: number;
  TenantID: number;
  StartDate: string;
  EndDate: string;
  MonthlyRent?: number;
  ContractStatus?: string;
};

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("Contract")
    .select("*")
    .order("ContractId", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: ContractPayload = body;

  if (!payload || typeof payload.RoomID !== "number" || typeof payload.TenantID !== "number" || !payload.StartDate || !payload.EndDate) {
    return NextResponse.json({ error: "Missing contract fields (RoomID, TenantID, StartDate, EndDate)" }, { status: 400 });
  }

  // Insert contract
  const contractInsert = {
    RoomID: payload.RoomID,
    TenantID: payload.TenantID,
    StartDate: payload.StartDate,
    EndDate: payload.EndDate,
    MonthlyRent: payload.MonthlyRent ?? 0,
    ContractStatus: "Active",
  };

  const { data: createdContract, error: contractError } = await supabase.from("Contract").insert([contractInsert]).select().single();
  if (contractError || !createdContract) {
    console.error("Contract insert error:", contractError);
    return NextResponse.json({ error: contractError?.message ?? "Failed to create contract" }, { status: 500 });
  }

  // Determine new RoomStatus: Occupied if start <= today else Booked
  let newRoomStatus = "Booked";
  try {
    const sd = new Date(contractInsert.StartDate);
    const today = new Date();
    const s = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    newRoomStatus = s <= t ? "Occupied" : "Booked";
  } catch {
    newRoomStatus = "Booked";
  }

  const { data: updatedRoom, error: roomError } = await supabase
    .from("Room")
    .update({ RoomStatus: newRoomStatus })
    .eq("RoomID", contractInsert.RoomID)
    .select()
    .single();

  if (roomError || !updatedRoom) {
    console.error("Room update error:", roomError);
    // Attempt cleanup: delete created contract so no orphan contract remains
    try {
      await supabase.from("Contract").delete().eq("ContractId", (createdContract as any).ContractId);
    } catch (cleanupErr) {
      console.error("Cleanup contract delete failed:", cleanupErr);
    }
    return NextResponse.json({ error: roomError?.message ?? "Failed to update room" }, { status: 500 });
  }

  return NextResponse.json({ contract: createdContract, room: updatedRoom }, { status: 201 });
}