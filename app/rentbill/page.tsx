"use client";

import { useState, useEffect, useMemo } from "react";

// Define types to match the expected API response structure
type Bill = {
  id: number;
  GrandTotal: number;
  Status: 'Paid' | 'Unpaid' | 'Overdue';
  PaymentProofURL?: string; // Add optional payment proof URL
  BillingMonth: string; // e.g., "2025-12-01"
  Contract: {
    Room: {
      RoomName: string;
      RoomID: number;
    };
  };
};

type BillDetail = {
  id: number;
  Description: string;
  Amount: number;
};

export default function Page() {
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billDetails, setBillDetails] = useState<BillDetail[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  // State for filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "Paid", "Unpaid", "Overdue"
  const [roomSearch, setRoomSearch] = useState("");
  const [amountSearch, setAmountSearch] = useState("");

  useEffect(() => {

    fetchBills();
  }, []);

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

  const handleShowDetails = async (bill: Bill) => {
    setSelectedBill(bill);
    setIsDetailLoading(true);
    setBillDetails([]);
    try {
      const res = await fetch(`/api/BillingDetails?BillingId=${bill.id}`);
      if (!res.ok) throw new Error('Failed to fetch bill details');
      const details = await res.json();
      setBillDetails(Array.isArray(details) ? details : []);
    } catch (err) {
      console.error(err);
      // Optionally set a modal-specific error state here
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedBill) return;

    if (!window.confirm(`Are you sure you want to reject this payment for room ${selectedBill.Contract.Room.RoomName}? This will change the status to Unpaid and remove the payment proof.`)) {
      return;
    }

    setIsReverting(true);
    try {
      const res = await fetch('/api/Billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBill.id,
          Status: 'Unpaid',
          PaymentProofURL: null,
          PaymentDate: null,
        }),
      });

      if (!res.ok) throw new Error('Failed to reject payment.');

      alert('Payment has been rejected. The bill is now marked as Unpaid.');
      setSelectedBill(null); // Close the modal
      fetchBills(); // Re-fetch all bills to update the UI
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsReverting(false);
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
                  <button
                    key={bill.id}
                    onClick={() => handleShowDetails(bill)}
                    className={`flex flex-col items-center text-left w-full rounded shadow p-4 transition hover:shadow-lg hover:scale-105 ${getStatusColor(bill.Status)}`}
                  >
                    <div className="text-lg font-bold text-blue-900 mb-2">
                      {bill.Contract.Room.RoomName}
                    </div>
                    <div className="bg-white rounded p-6 mb-3 shadow-inner self-center">
                      💌
                    </div>
                    <div className="text-gray-800 font-bold text-lg">
                      {bill.GrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                    </div>
                    <div className="text-sm text-gray-600 mt-1 capitalize">
                      สถานะ: {bill.Status}
                    </div>
                  </button>
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

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">รายละเอียดบิล - ห้อง {selectedBill.Contract.Room.RoomName}</h3>
              <button onClick={() => setSelectedBill(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <div className="border-t pt-4">
              {isDetailLoading ? (
                <p className="text-center text-gray-500">Loading details...</p>
              ) : (
                <>
                  <ul className="space-y-2 mb-4">
                    {billDetails.map((detail) => (
                      <li key={detail.id} className="flex justify-between items-center text-gray-700">
                        <span>{detail.Description}</span>
                        <span className="font-mono">{detail.Amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                    <span>ยอดรวม</span>
                    <span>{selectedBill.GrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
                  </div>
                </>
              )}
            </div>
            {selectedBill.Status === 'Paid' && selectedBill.PaymentProofURL && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-gray-800 mb-2">หลักฐานการชำระเงิน</h4>
                <a href={selectedBill.PaymentProofURL} target="_blank" rel="noopener noreferrer">
                  <img
                    src={selectedBill.PaymentProofURL}
                    alt="Payment Proof"
                    className="rounded-lg w-full h-auto object-contain max-h-60 border"
                  />
                </a>
              </div>
            )}
            <button onClick={() => setSelectedBill(null)} className="w-full mt-6 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
              ปิด
            </button>
            <div className="flex gap-2 mt-6">
              {selectedBill.Status === 'Paid' && (
                <button
                  onClick={handleRejectPayment}
                  disabled={isReverting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isReverting ? 'Rejecting...' : 'Reject Payment'}
                </button>
              )}
              <button onClick={() => setSelectedBill(null)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
