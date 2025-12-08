"use client";

import { useState, useEffect, useMemo } from "react";

// Define types to match the expected API response structure
type Bill = {
  id: number;
  GrandTotal: number;
  Status: 'Paid' | 'Unpaid' | 'Overdue';
  BillingMonth: string; // e.g., "2025-12-01"
  Contract: {
    Room: {
      RoomName: string;
      RoomID: number;
    };
  };
};

export default function Page() {
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "Paid", "Unpaid", "Overdue"
  const [roomSearch, setRoomSearch] = useState("");
  const [amountSearch, setAmountSearch] = useState("");

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/Billing");
        if (!res.ok) throw new Error("Failed to fetch bills");
        const data = await res.json();
        setAllBills(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const filteredAndGroupedBills = useMemo(() => {
    const filtered = allBills.filter(bill => {
      const billingMonth = bill.BillingMonth.slice(0, 7);
      const roomName = bill.Contract?.Room?.RoomName ?? '';

      return (
        billingMonth === selectedDate &&
        (statusFilter === "all" || bill.Status === statusFilter) &&
        (roomName.toLowerCase().includes(roomSearch.toLowerCase())) &&
        (amountSearch === "" || String(bill.GrandTotal).includes(amountSearch))
      );
    });

    return filtered.reduce((acc, bill) => {
      const floor = String(Math.floor(bill.Contract.Room.RoomID / 100));
      if (!acc[floor]) {
        acc[floor] = [];
      }
      acc[floor].push(bill);
      return acc;
    }, {} as Record<string, Bill[]>);
  }, [allBills, selectedDate, statusFilter, roomSearch, amountSearch]);

  const getStatusColor = (status: Bill['Status']) => {
    switch (status) {
      case 'Paid': return 'bg-green-100';
      case 'Unpaid': return 'bg-yellow-100';
      case 'Overdue': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white min-h-screen p-6">

      {/* Top Section */}
      <div className="bg-white rounded shadow p-6 flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-900 mb-4 md:mb-0">เลือกรอบบิล</h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-blue-300 rounded px-3 py-2 text-blue-900 bg-white">
            <span className="mr-2">📅</span>
            <input
              type="month"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="outline-none text-blue-900 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Secondary Filters Section */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">
          {new Date(selectedDate).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-gray-700 w-full"
          >
            <option value="all">บิลทั้งหมด</option>
            <option value="Unpaid">ยังไม่จ่าย</option>
            <option value="Paid">จ่ายแล้ว</option>
            <option value="Overdue">เกินกำหนด</option>
          </select>

          <input
            type="text"
            placeholder="ค้นหาตามหมายเลขห้อง"
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />

          <input
            type="number"
            placeholder="ค้นหาตามยอดเงินรวม"
            value={amountSearch}
            onChange={(e) => setAmountSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Action buttons can be implemented later */}
        </div>
      </div>

      {loading && <p className="text-center">Loading bills...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && Object.keys(filteredAndGroupedBills).sort((a, b) => Number(a) - Number(b)).map(floor => (
        <div key={floor} className="mb-8">
          {/* Floor Header */}
          <div className="bg-gray-100 border border-gray-300 rounded-t px-6 py-4 text-xl font-bold text-blue-900">
            ชั้นที่ {floor}
          </div>

          {/* Floor Content */}
          <div className="bg-white border border-gray-300 border-t-0 rounded-b p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAndGroupedBills[floor]
                .sort((a, b) => a.Contract.Room.RoomID - b.Contract.Room.RoomID)
                .map((bill) => (
                  <div
                    key={bill.id}
                    className={`flex flex-col items-center rounded shadow p-4 ${getStatusColor(bill.Status)}`}
                  >
                    <div className="text-lg font-bold text-blue-900 mb-2">
                      {bill.Contract.Room.RoomName}
                    </div>
                    <div className="bg-white rounded p-6 mb-3 shadow-inner">
                      💌
                    </div>
                    <div className="text-gray-800 font-bold text-lg">
                      {bill.GrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      สถานะ: {bill.Status}
                    </div>
                  </div>
                )
                )}
            </div>
          </div>
        </div>
      ))}

      {!loading && Object.keys(filteredAndGroupedBills).length === 0 && (
        <div className="text-center text-gray-500 py-10">
          <p>ไม่พบข้อมูลบิลสำหรับเดือนที่เลือก</p>
        </div>
      )}
    </div>
  );
}

