"use client";

import { useEffect, useState } from "react";
import { Room } from "@/lib/types";

interface DashboardStatsProps {
  rooms: Room[];
  allActiveContracts: { RoomID: number; ContractStatus: string }[];
}

export function DashboardStats({ rooms, allActiveContracts }: DashboardStatsProps) {
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    const fetchUnpaid = async () => {
      try {
        const res = await fetch('/api/Billing?Status=Unpaid');
        const data = await res.json();
        const unpaidRooms = new Set(data.map((bill: any) => bill.Contract.Room.RoomName));
        setOverdueCount(unpaidRooms.size);
      } catch (e) {
        setOverdueCount(0);
      }
    };
    fetchUnpaid();
  }, [rooms]); // Re-fetch if rooms change

  const occupiedRooms = rooms.filter(r => r.RoomStatus === "Unavailable").length;
  const totalRooms = rooms.length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const reservedRoomsCount = new Set(allActiveContracts.filter(c => c.ContractStatus === "Reserved").map(c => c.RoomID)).size;
  const availableRooms = rooms.filter(r => r.RoomStatus === "Available").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded shadow p-6 flex flex-col items-center">
        <span className="text-2xl font-bold text-green-600" title={`${occupiedRooms} / ${totalRooms} rooms`}>
          {occupancyRate}%
        </span>
        <span className="text-gray-600 mt-2">อัตราการเข้าพัก</span>
      </div>
      <div className="bg-white rounded shadow p-6 flex flex-col items-center">
        <span className="text-2xl font-bold text-yellow-600">{reservedRoomsCount} ห้อง</span>
        <span className="text-gray-600 mt-2">ห้องจอง</span>
      </div>
      <div className="bg-white rounded shadow p-6 flex flex-col items-center">
        <span className="text-2xl font-bold text-red-600">{overdueCount} ห้อง</span>
        <span className="text-gray-600 mt-2">ค้างชำระ</span>
      </div>
      <div className="bg-white rounded shadow p-6 flex flex-col items-center">
        <span className="text-2xl font-bold text-purple-600">{availableRooms} ห้อง</span>
        <span className="text-gray-600 mt-2">ห้องว่าง</span>
      </div>
    </div>
  );
}
