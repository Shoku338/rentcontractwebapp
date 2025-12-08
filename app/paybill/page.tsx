"use client";

import { useState, useEffect, useMemo } from "react";

// Define a type for the processed bill group
type UnpaidBillGroup = {
  roomName: string;
  totalAmount: number;
  billCount: number;
};

export default function PayBill() {
  const [unpaidBills, setUnpaidBills] = useState<UnpaidBillGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/Billing");
        if (!res.ok) throw new Error("Failed to fetch billing data");

        const allBills = await res.json();
        const unpaid = allBills.filter((bill: any) => bill.Status === 'Unpaid');

        const billsByRoom = unpaid.reduce((acc: Record<string, UnpaidBillGroup>, bill: any) => {
          const roomName = bill.Contract?.Room?.RoomName;
          if (!roomName) return acc; // Skip if no room name

          if (!acc[roomName]) {
            acc[roomName] = { roomName, totalAmount: 0, billCount: 0 };
          }
          acc[roomName].totalAmount += Number(bill.GrandTotal);
          acc[roomName].billCount += 1;
          return acc;
        }, {});

        setUnpaidBills(Object.values(billsByRoom));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const filteredBills = useMemo(() => {
    if (!searchQuery) return unpaidBills;
    return unpaidBills.filter(bill =>
      bill.roomName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, unpaidBills]);

  return (
    <div className="bg-white min-h-screen p-6">

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">
          กรุณาพิมพ์ชื่อห้องที่ต้องการชำระเงิน
        </h1>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-6">
        <div className="flex items-center border border-gray-300 rounded px-3 py-2 bg-white">
          <span className="text-gray-500 mr-2">🔍</span>
          <input
            type="text"
            placeholder="ค้นหาตามหมายเลขห้อง"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full outline-none"
          />
        </div>
      </div>

      {/* Subtitle */}
      {!loading && !error && (
        <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-semibold text-gray-700 mb-4">
          รายการห้องค้างชำระ: {filteredBills.length} ห้อง
        </div>
      )}

      {/* Room List */}
      <div className="space-y-4">
        {loading && <p className="text-center text-gray-600">Loading...</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {!loading && !error && filteredBills.map((item) => (
          <div
            key={item.roomName}
            className="border border-gray-300 rounded overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <span className="text-lg font-bold text-blue-900">{item.roomName}</span>

              <button className="bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 transition">
                รายละเอียด
              </button>
            </div>

            <div className="px-4 py-2 bg-white text-gray-700">
              ค้างชำระทั้งหมด{" "}
              <span className="font-bold text-blue-800">
                {item.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
              </span>{" "}
              ({item.billCount} บิล)
            </div>
          </div>
        ))}

      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-2 mt-6">
        <button className="border px-4 py-1 rounded bg-white hover:bg-gray-100">
          หน้าก่อนหน้า
        </button>

        <button className="border px-4 py-1 rounded bg-blue-600 text-white">
          1
        </button>

        <button className="border px-4 py-1 rounded bg-white hover:bg-gray-100">
          หน้าถัดไป
        </button>
      </div>

    </div>
  );
}
