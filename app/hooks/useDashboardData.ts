import { useState, useEffect } from 'react';
import { Room } from '../types';
import * as api from '../services/apiService';

export function useDashboardData() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allActiveContracts, setAllActiveContracts] = useState<{ RoomID: number; ContractStatus: string }[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => {
        const fetchAndSyncData = async () => {
            try {
                setLoading(true);
                setError(null);

                await api.syncStatusesAPI();

                const { rooms: roomsData, activeContracts } = await api.fetchDashboardDataAPI();

                setAllActiveContracts(activeContracts);

                const roomContractStatusMap = new Map<number, string>();
                for (const contract of activeContracts) {
                    roomContractStatusMap.set(contract.RoomID, "Unavailable");
                }

                const synchronizedRooms = roomsData.map(room => {
                    if (room.RoomStatus === "Renovate") {
                        return room;
                    }
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

        fetchAndSyncData();
    }, [refreshTrigger]);

    return { rooms, loading, error, allActiveContracts, triggerRefresh };
}