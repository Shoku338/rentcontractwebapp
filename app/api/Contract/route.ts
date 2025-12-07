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
    CreatedAt?: string;
};

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { searchParams } = req.nextUrl;
    const roomId = searchParams.get("roomId");

    // If a roomId is provided, fetch contracts for that specific room
    if (roomId) {
        // The select('*, Tenant(*)') tells Supabase to also fetch the related tenant data.
        // This requires a foreign key relationship between Contract (TenantID) and Tenant (TenantID).
        const { data, error } = await supabase
            .from("Contract")
            .select("*, tenants(*)")
            .eq("RoomID", roomId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        // If no contracts are found, Supabase returns an empty array, which is the correct response.
        return NextResponse.json(data ?? []);
    }

    // Fallback for when no roomId is provided (optional, but good to keep for now)
    const { data, error } = await supabase
        .from("Contract")
        .select("*")
        .order("ContractId", { ascending: false })
        .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
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
        CreatedAt: payload.CreatedAt ?? null,
        ContractStatus: payload.ContractStatus ?? "Active",
    };

    const { data: createdContract, error: contractError } = await supabase.from("Contract").insert([contractInsert]).select().single();
    if (contractError || !createdContract) {
        console.error("Contract insert error:", contractError);
        return NextResponse.json({ error: contractError?.message ?? "Failed to create contract" }, { status: 500 });
    }

    // Determine new RoomStatus: Occupied if start <= today else Booked
    let newRoomStatus = "Unavailable";
    try {
        const sd = new Date(contractInsert.StartDate);
        const today = new Date();
        const s = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
        const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        newRoomStatus = s <= t ? "Unavailable" : "Available";
    } catch {
        newRoomStatus = "Unavailable";
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

export async function PATCH(req: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { searchParams } = req.nextUrl;
    const contractId = searchParams.get("id");

    if (!contractId) {
        return NextResponse.json({ error: "Contract ID is required for update" }, { status: 400 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { tenantData, contractData } = body;

    if (!tenantData || !contractData) {
        return NextResponse.json({ error: "Missing tenant or contract data" }, { status: 400 });
    }

    // 1. Update Tenant
    const { data: updatedTenant, error: tenantError } = await supabase
        .from("tenants")
        .update(tenantData)
        .eq("TenantID", tenantData.TenantID)
        .select(); // Remove .single()

    if (tenantError) {
        return NextResponse.json({ error: `Failed to update tenant: ${tenantError.message}` }, { status: 500 });
    }
    // Check if the update was successful
    if (!updatedTenant || updatedTenant.length === 0) {
        return NextResponse.json({ error: "Tenant not found for update." }, { status: 404 });
    }

    // 2. Update Contract
    const { data: updatedContract, error: contractError } = await supabase
        .from("Contract")
        .update(contractData)
        .eq("ContractId", contractId)
        .select()
        .single(); // .single() is okay here if ContractId is a unique primary key

    if (contractError) {
        // The error might be because the contract was not found
        if (contractError.code === 'PGRST116') { // "Cannot coerce to single" error code
            return NextResponse.json({ error: "Contract not found for update." }, { status: 404 });
        }
        return NextResponse.json({ error: `Failed to update contract: ${contractError.message}` }, { status: 500 });
    }

    return NextResponse.json({ tenant: updatedTenant[0], contract: updatedContract }, { status: 200 });
}