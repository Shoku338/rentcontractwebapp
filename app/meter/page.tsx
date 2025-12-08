"use client";

import { useState, useEffect } from "react";

export default function MeterPage() {
  const [year] = useState(2025);
  const [month] = useState(10);

  const [rooms, setRooms] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
    loadReadings();
  }, []);

  async function loadRooms() {
    try {
      const res = await fetch("/api/Room");
      const data = await res.json();

      const filtered = Array.isArray(data)
        ? data.filter((r: any) => r.RoomStatus === "Unavailable")
        : [];

      setRooms(filtered);
    } catch (err) {
      console.error("Load rooms failed:", err);
      setRooms([]);
    }
  }

  async function loadReadings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/meter?year=${year}&month=${month}`);
      const data = await res.json();

      const list = Array.isArray(data) ? data : [];
      setReadings(list);
    } catch (err) {
      console.error("Load readings failed:", err);
      setReadings([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateCurrent(roomID: number, value: number) {
    const existing = readings.find((r: any) => r.roomid === roomID);
    const curr = Number(value) || 0;

    try {
      if (existing) {
        await fetch("/api/meter", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: existing.readingid,
            CurrentValue: curr,
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
            PreviousValue: 0,
            CurrentValue: curr,
          }),
        });
      }
    } catch (err) {
      console.error("Update failed:", err);
    }

    loadReadings();
  }

  function getReading(roomID: number) {
    return readings.find((r) => r.roomid === roomID);
  }

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="bg-white rounded shadow p-6 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-900">เลือกรอบจดมิเตอร์</h1>

        <input
          type="text"
          value={`${month}/${year}`}
          readOnly
          className="border border-blue-300 rounded px-3 py-2 text-blue-900"
        />
      </div>

      <div className="flex gap-4 mb-6 rounded-full overflow-hidden">
        <h2 className="flex-1 bg-blue-600 text-white font-bold py-3 text-center rounded-r-full">
          🛠️ จดมิเตอร์ไฟฟ้า
        </h2>
      </div>

      <div className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-blue-900 mb-4">ชั้นที่ 1</h2>

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
            {rooms.map((room) => {
              const meter = getReading(room.RoomID);

              const prev = meter?.previousvalue ?? 0;
              const curr = meter?.currentvalue ?? "";
              const used = (Number(curr) || 0) - (Number(prev) || 0);

              return (
                <tr key={room.RoomID} className="text-center">
                  <td className="border p-2">{room.RoomID}</td>
                  <td className="border p-2">👤</td>

                  <td className="border p-2">{prev}</td>

                  <td className="border p-2 bg-blue-100">
                    <input
                      type="number"
                      defaultValue={curr}
                      className="bg-blue-50 border border-blue-300 rounded px-2 py-1 w-24 text-blue-900"
                      onBlur={(e) =>
                        updateCurrent(room.RoomID, Number(e.target.value || 0))
                      }
                    />
                  </td>

                  <td className="border p-2">
                    <span className="bg-red-500 text-white px-3 py-1 rounded">
                      {used}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
