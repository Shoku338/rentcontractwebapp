import { Contract, Room } from "../types";

export async function syncStatusesAPI(): Promise<void> {
    await fetch("/dashboard", { method: "POST" });
}

export async function fetchDashboardDataAPI(): Promise<{ rooms: Room[], activeContracts: { RoomID: number; ContractStatus: string }[] }> {
    const [roomsRes, contractsRes] = await Promise.all([
        fetch("/api/Room"),
        fetch("/api/ActiveContract"),
    ]);

    if (!roomsRes.ok) throw new Error("Failed to fetch rooms");
    if (!contractsRes.ok) throw new Error("Failed to fetch active contracts");

    const rooms = await roomsRes.json();
    const activeContracts = await contractsRes.json();

    return { rooms, activeContracts };
}

export async function fetchContractsForRoomAPI(roomId: number): Promise<Contract[]> {
    const res = await fetch(`/api/Contract?roomId=${roomId}`);
    if (!res.ok) {
        throw new Error("Failed to fetch contracts for the room");
    }
    return res.json();
}

export async function updateRoomStatusAPI(roomId: number, newStatus: string): Promise<void> {
    const res = await fetch("/api/Room", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RoomID: roomId, RoomStatus: newStatus }),
    });

    if (!res.ok) {
        throw new Error("Failed to update room status");
    }
}

export async function saveContractAPI(
    payload: any,
    editingContract: Contract | null,
    selectedRoom: Room
): Promise<void> {
    if (editingContract) {
        // Update logic
        const res = await fetch(`/api/Contract?id=${editingContract.ContractId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.error ?? "Failed to update contract");
        }
    } else {
        // Create logic
        const tenantRes = await fetch("/api/Tenant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload.tenantData) });
        if (!tenantRes.ok) throw new Error("Failed to create tenant");
        const createdTenant = await tenantRes.json();

        const contractPayload = { ...payload.contractData, TenantID: createdTenant.TenantID, RoomID: selectedRoom.RoomID };
        const contractRes = await fetch("/api/Contract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contractPayload) });
        if (!contractRes.ok) {
            await fetch(`/api/Tenant?id=${createdTenant.TenantID}`, { method: "DELETE" }); // Rollback
            throw new Error("Failed to create contract");
        }
    }
}