"use client";

import { useState, useEffect } from "react";
import { Room } from "@/lib/types";
import { getAllRooms } from "@/app/services/roomService";
import { getActiveAndReservedContracts } from "@/app/services/contractService";

export function useDashboardData() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allActiveContracts, setAllActiveContracts] = useState<{ RoomID: number; ContractStatus: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        // First, trigger the backend to synchronize all statuses
        await fetch("/dashboard", { method: "POST" });

        // Fetch both rooms and active/reserved contracts in parallel
        const [roomsRes, contractsRes] = await Promise.all([
          getAllRooms(),
          getActiveAndReservedContracts(),
        ]);

        setAllActiveContracts(contractsRes);

        const roomContractStatusMap = new Map<number, string>();
        for (const contract of contractsRes) {
          if (contract.ContractStatus === 'Reserved') {
            roomContractStatusMap.set(contract.RoomID, "Reserved");
          }
        }
        for (const contract of contractsRes) {
          if (contract.ContractStatus === 'Active') {
            roomContractStatusMap.set(contract.RoomID, "Unavailable");
          }
        }

        const synchronizedRooms = roomsRes.map(room => {
          if (room.RoomStatus === "Renovate") return room;
          const newStatus = roomContractStatusMap.get(room.RoomID) || "Available";
          return { ...room, RoomStatus: newStatus };
        });

        setRooms(synchronizedRooms);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [refreshTrigger]);

  return { rooms, setRooms, allActiveContracts, loading, error, triggerRefresh };
}