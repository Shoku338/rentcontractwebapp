import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// This route should be at /api/sync-statuses, but I am editing the provided file path.
export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    try {
        let allAffectedRoomIds = new Set<number>();

        // Step 1: Expire old contracts
        const { data: expiredContracts, error: expireError } = await supabase
            .from("Contract")
            .update({ ContractStatus: "Expired" })
            .lt("EndDate", today)
            .eq("ContractStatus", "Active")
            .select("RoomID"); 
        if (expireError) throw new Error(`Failed to expire contracts: ${expireError.message}`);
        expiredContracts?.forEach(c => allAffectedRoomIds.add(c.RoomID));

        // Step 2: Activate reserved contracts
        const { data: activatedContracts, error: activateError } = await supabase
            .from("Contract")
            .update({ ContractStatus: "Active" })
            .lte("StartDate", today)
            .eq("ContractStatus", "Reserved")
            .select("RoomID");
        if (activateError) throw new Error(`Failed to activate contracts: ${activateError.message}`);
        activatedContracts?.forEach(c => allAffectedRoomIds.add(c.RoomID));

        // Step 3: Re-evaluate and update statuses for all affected rooms
        if (allAffectedRoomIds.size > 0) {
            const roomIds = Array.from(allAffectedRoomIds);

            // Find which rooms now have active/reserved contracts
            const { data: unavailableRooms, error: recheckError } = await supabase
                .from("Contract")
                .select("RoomID")
                .in("RoomID", roomIds)
                .in("ContractStatus", ["Active", "Reserved"]);
            if (recheckError) throw new Error(`Failed to re-check room statuses: ${recheckError.message}`);

            const unavailableRoomIds = new Set(unavailableRooms.map(c => c.RoomID));
            const roomsToMakeAvailable = roomIds.filter(id => !unavailableRoomIds.has(id));
            const roomsToMakeUnavailable = roomIds.filter(id => unavailableRoomIds.has(id));

            if (roomsToMakeAvailable.length > 0) {
                await supabase
                    .from("Room")
                    .update({ RoomStatus: "Available" })
                    .in("RoomID", roomsToMakeAvailable);
            }
            if (roomsToMakeUnavailable.length > 0) {
                await supabase
                    .from("Room")
                    .update({ RoomStatus: "Unavailable" })
                    .in("RoomID", roomsToMakeUnavailable);
            }
        }

        return NextResponse.json({ message: "Statuses synchronized successfully" }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred during synchronization.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
