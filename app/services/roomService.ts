import { Room } from "@/lib/types";

const API_BASE_URL = "/api";

/**
 * Fetches all rooms from the API.
 * @returns A promise that resolves to an array of rooms.
 */
export const getAllRooms = async (): Promise<Room[]> => {
  const res = await fetch(`${API_BASE_URL}/Room`);
  if (!res.ok) {
    throw new Error("Failed to fetch rooms");
  }
  return res.json();
};

/**
 * Updates the status of a specific room.
 * @param roomId The ID of the room to update.
 * @param newStatus The new status for the room.
 * @returns The server response.
 */
export const updateRoomStatus = async (roomId: number, newStatus: string) => {
  const res = await fetch(`${API_BASE_URL}/Room`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ RoomID: roomId, RoomStatus: newStatus }),
  });
  if (!res.ok) {
    throw new Error("Failed to update room status");
  }
  return res.json();
};