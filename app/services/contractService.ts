import { Contract } from "@/lib/types";

const API_BASE_URL = "/api";

/**
 * Fetches all contracts for a specific room.
 * @param roomId The ID of the room.
 * @returns A promise that resolves to an array of contracts.
 */
export const getContractsByRoomId = async (roomId: number): Promise<Contract[]> => {
  const res = await fetch(`${API_BASE_URL}/Contract?roomId=${roomId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch contracts for the room");
  }
  return res.json();
};

/**
 * Fetches all active and reserved contracts.
 * @returns A promise that resolves to an array of contract statuses.
 */
export const getActiveAndReservedContracts = async (): Promise<{ RoomID: number; ContractStatus: string }[]> => {
  const res = await fetch(`${API_BASE_URL}/ActiveContract`);
  if (!res.ok) {
    throw new Error("Failed to fetch active contracts");
  }
  return res.json();
};

/**
 * Creates a new contract.
 * @param payload The data for the new contract.
 * @returns The server response.
 */
export const createContract = async (payload: any) => {
  const res = await fetch(`${API_BASE_URL}/Contract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? "Failed to create contract");
  }
  return res.json();
};
