"use client";

import { useState, useEffect } from "react";
import { Room } from "@/lib/types"; // Using a proper type

// Define a type for our meter readings for better type safety
type MeterReading = {
  readingid: number;
  roomid: number;
  previousvalue: number;
  currentvalue: number;
};

export default function MeterPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // e.g., "2025-12"
  const [rooms, setRooms] = useState<Room[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [prevMonthReadings, setPrevMonthReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(false);

  const [year, month] = selectedDate.split('-').map(Number);

  async function loadRooms() {
    try {
      const res = await fetch("/api/Room");
      const data = await res.json();

      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load rooms failed:", err);
      setRooms([]);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    async function loadAllReadings() {
      if (!year || !month) return;

      setLoading(true);
      try {
        const currentDate = new Date(year, month - 1);
        const prevDate = new Date(currentDate);
        prevDate.setMonth(prevDate.getMonth() - 1);

        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;

        const [readingsRes, prevReadingsRes] = await Promise.all([
          fetch(`/api/meter?year=${year}&month=${month}`),
          fetch(`/api/meter?year=${prevYear}&month=${prevMonth}`)
        ]);

        const readingsData = await readingsRes.json();
        const prevReadingsData = await prevReadingsRes.json();

        setReadings(Array.isArray(readingsData) ? readingsData : []);
        setPrevMonthReadings(Array.isArray(prevReadingsData) ? prevReadingsData : []);

      } catch (err) {
        console.error("Load readings failed:", err);
        setReadings([]);
        setPrevMonthReadings([]);
      } finally {
        setLoading(false);
      }
    }

    loadAllReadings();
  }, [selectedDate]);

  async function updateCurrent(roomID: number, value: number) {
    const existing = readings.find((r) => r.roomid === roomID);
    const prevReadingForRoom = prevMonthReadings.find(pr => pr.roomid === roomID);
    const previousValueForDb = prevReadingForRoom ? prevReadingForRoom.currentvalue : 0;
    setLoading(true);

    try {
      if (existing) {
        await fetch("/api/meter", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: existing.readingid,
            CurrentValue: value,
          }),
        });
      } else {
        await fetch("/api/meter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            RoomID: roomID,
            Year: year,
            Month: month,
            PreviousValue: previousValueForDb,
            CurrentValue: value,
          }),
        });
      }
      // Optimistically update local state before re-fetching
      const newReadings = [...readings];
      const readingIndex = newReadings.findIndex(r => r.roomid === roomID);
      if (readingIndex > -1) {
        newReadings[readingIndex] = { ...newReadings[readingIndex], currentvalue: value };
      } else {
        // This part is tricky as we don't have the new readingid from the DB.
        // A full re-fetch is safer if we don't get the created record back.
        // For now, the re-fetch below handles it.
      }
      setReadings(newReadings);

    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      // Re-fetch to ensure data consistency
      const res = await fetch(`/api/meter?year=${year}&month=${month}`);
      const data = await res.json();
      setReadings(Array.isArray(data) ? data : []);
      setLoading(false);
    }
  }

  const groupedRooms = rooms.reduce((acc, room) => {
    // special TA group (111-115)
    if (room.RoomID >= 111 && room.RoomID <= 115) {
      acc["TA"] = acc["TA"] ?? [];
      acc["TA"].push(room);
      return acc;
    }
    // special TB group (121-125)
    if (room.RoomID >= 121 && room.RoomID <= 125) {
      acc["TB"] = acc["TB"] ?? [];
      acc["TB"].push(room);
      return acc;
    }
    // fallback: group by numeric floor derived from RoomID (e.g., 401 -> 4)
    const floor = String(Math.floor(room.RoomID / 100));
    acc[floor] = acc[floor] ?? [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  // Custom ordering: show TA then TB, then numeric floors ascending
  const orderedGroupKeys = Object.keys(groupedRooms).sort((a, b) => {
    const priority: Record<string, number> = { TA: 0, TB: 1 };
    const aIsPriority = a in priority;
    const bIsPriority = b in priority;
    if (aIsPriority && bIsPriority) return priority[a] - priority[b];
    if (aIsPriority) return -1;
    if (bIsPriority) return 1;
    // numeric compare for floor keys
    return Number(a) - Number(b);
  });

  const renderRoomRow = (room: Room) => {
    const currentReading = readings.find(r => r.roomid === room.RoomID);
    const prevMonthReading = prevMonthReadings.find(pr => pr.roomid === room.RoomID);
    const prevValue = prevMonthReading ? prevMonthReading.currentvalue : 0;
    const currValue = currentReading ? currentReading.currentvalue : 0;
    const used = currValue > 0 ? currValue - prevValue : 0;


    return (
      <tr key={room.RoomID} className="text-center">
        <td className="border p-2 font-semibold">{room.RoomName}</td>
        <td className="border p-2">👤</td>
        <td className="border p-2">{prevValue}</td>
        <td className="border p-2 bg-blue-100">
          <input
            type="number"
            defaultValue={currentReading?.currentvalue}
            className="bg-blue-50 border border-blue-300 rounded px-2 py-1 w-24 text-blue-900"
            onBlur={(e) =>
              updateCurrent(room.RoomID, Number(e.target.value || 0))
            }
          />
        </td>
        <td className="border p-2">
          <span className={`px-3 py-1 rounded ${used > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {used}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="bg-white rounded shadow p-6 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-900">เลือกรอบจดมิเตอร์</h1>
        <input
          type="month"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-blue-300 rounded px-3 py-2 text-blue-900"
        />
      </div>

      <div className="bg-white rounded shadow p-6 mb-8">
        {loading && <div className="text-center p-4">Loading...</div>}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100 text-blue-900">
              <th className="p-2 border">ห้อง</th>
              <th className="p-2 border">สถานะห้อง</th>
              <th className="p-2 border">เลขเดือนก่อน</th>
              <th className="p-2 border">เลขเดือนนี้</th>
              <th className="p-2 border">หน่วยใช้</th>
            </tr>
          </thead>

          <tbody>
            {!loading && orderedGroupKeys.map(floor => (
              <>
                <tr key={`floor-${floor}`} className="bg-blue-200">
                  <td colSpan={5} className="p-2 font-bold text-blue-900">
                    ชั้นที่ {floor}
                  </td>
                </tr>
                {groupedRooms[floor]
                  .sort((a, b) => a.RoomID - b.RoomID)
                  .map(renderRoomRow)}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
