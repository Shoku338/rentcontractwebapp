"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { Room } from "@/lib/types"; // Using a proper type

// Define a type for our meter readings for better type safety
type MeterReading = {
  readingid: number;
  roomid: number;
  previousvalue: number;
  currentvalue: number;
};

type ActiveContract = {
  ContractId: string; // This needs to be a string to match the DB
  RoomID: number;
  MonthlyRent: number;
};

type UtilityRate = {
  utilitiesRateID: number;
  Name: string;
  RatePerUnit: number;
};

export default function MeterPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // e.g., "2025-12"
  const [rooms, setRooms] = useState<Room[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [prevMonthReadings, setPrevMonthReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [draftReadings, setDraftReadings] = useState<Record<number, number>>({});
  const [activeContracts, setActiveContracts] = useState<ActiveContract[]>([]);
  const [utilityRates, setUtilityRates] = useState<UtilityRate[]>([]);
  const [draftRates, setDraftRates] = useState<Record<number, number>>({});
  const [initialElecRate, setInitialElecRate] = useState('');

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
    // Also fetch active contracts to be ready for billing
    const fetchActiveContracts = async () => {
      try {
        const res = await fetch('/api/ActiveContract');
        const data = await res.json();
        setActiveContracts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch active contracts", e);
      }
    };
    fetchActiveContracts();

    const fetchUtilityRates = async () => {
      try {
        const res = await fetch('/api/UtilitiesMaster');
        const data = await res.json();
        setUtilityRates(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch utility rates", e);
      }
    };
    fetchUtilityRates();
  }, []);

  const loadAllReadings = useCallback(async () => {
    const [year, month] = selectedDate.split('-').map(Number);
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
  }, [selectedDate]);

  useEffect(() => {
    loadAllReadings();
  }, [loadAllReadings]);

  async function saveReading(roomID: number, value: number): Promise<MeterReading | null> {
    const existing = readings.find((r) => r.roomid === roomID);
    const prevReadingForRoom = prevMonthReadings.find(pr => pr.roomid === roomID);
    const previousValueForDb = prevReadingForRoom ? prevReadingForRoom.currentvalue : 0;
    
    try {
      if (existing) {
        const res = await fetch("/api/meter", {
          method: "PATCH", // This should return the updated record
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: existing.readingid,
            CurrentValue: value,
          }),
        });
        if (res.ok) {
          return await res.json();
        }
      } else {
        const res = await fetch("/api/meter", {
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
        if (res.ok) {
          return await res.json(); // Return the newly created meter reading
        }
      }
    } catch (err) {
      console.error("Update failed for room " + roomID, err);
      // Re-throw to be caught by Promise.all
      throw err;
    }
    return null;
  }

  async function generateBillForRoom(roomID: number, meterReading: MeterReading) {
    const contract = activeContracts.find(c => c.RoomID === roomID);
    if (!contract) {
      console.log(`No active contract for Room ${roomID}, skipping bill generation.`);
      return;
    }

    // Define billing details
    const rentDetail = { ItemType: 'Rent', Description: `ค่าเช่าเดือน ${month}/${year}`, Amount: contract.MonthlyRent };
    const unitsUsed = meterReading.currentvalue - meterReading.previousvalue;
    
    // Use the dynamic rate for electricity
    const electricityRateInfo = utilityRates.find(r => r.Name === 'Electricity');
    const electricityRate = electricityRateInfo?.RatePerUnit ?? 0;
    const electricityCost = unitsUsed * electricityRate; // Use dynamic rate
    const electricityDetail = { ItemType: 'Electricity', Description: `ค่าไฟ (${unitsUsed} หน่วย * ${electricityRate} บาท)`, Amount: electricityCost, MeterReadingId: meterReading.readingid };

    const total = rentDetail.Amount + electricityDetail.Amount;

    // 1. Create the main Billing record
    const billingMonthDate = new Date(year, month - 1, 2); 
    const dueDate = new Date(year, month, 5); 
    
    const billRes = await fetch('/api/Billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ContractId: contract.ContractId,
        BillingMonth: billingMonthDate.toISOString().split('T')[0],
        DueDate: dueDate.toISOString().split('T')[0],
        // Fix: Add the required non-null fields. Assuming no tax for now.
        TotalPreTax: total,
        TaxAmount: 0,
        GrandTotal: total,
        Status: 'Unpaid' // Explicitly set the status
      })
    });

    if (!billRes.ok) {
      const errorBody = await billRes.json();
      throw new Error(`Failed to create bill for Room ${roomID}: ${errorBody.error}`);
    }
    const newBill = await billRes.json();

    // --- FIX: Prevent duplicate BillingDetails ---
    // After upserting the bill, check if it already has details.
    const checkDetailsRes = await fetch(`/api/BillingDetails?BillingId=${newBill.id}`);
    if (!checkDetailsRes.ok) throw new Error(`Failed to check details for bill ${newBill.id}`);
    
    const existingDetails = await checkDetailsRes.json();
    if (Array.isArray(existingDetails) && existingDetails.length > 0) {
      console.log(`Bill ${newBill.id} already has details. Skipping detail creation.`);
      // --- FIX: Instead of returning, UPDATE the existing details ---
      const elecDetailToUpdate = existingDetails.find(d => d.ItemType === 'Electricity');
      if (elecDetailToUpdate) {
        // Update the electricity detail
        await fetch('/api/BillingDetails', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: elecDetailToUpdate.id,
            Amount: electricityCost,
            Description: electricityDetail.Description,
          }),
        });
        // Update the main bill's total
        await fetch('/api/Billing', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newBill.id,
            GrandTotal: total,
            TotalPreTax: total,
          }),
        });
      }
      return; // Exit after updating
    }

    // 2. Create BillingDetails records
    const detailsPayload = [
      { ...rentDetail, BillingId: newBill.id },
      { ...electricityDetail, BillingId: newBill.id }
    ];

    const detailsRes = await fetch('/api/BillingDetails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detailsPayload) // Assuming your API can handle an array
    });

    if (!detailsRes.ok) throw new Error(`Failed to create bill details for Room ${roomID}`);
  }

  const handleReadingChange = (roomId: number, value: string) => {
    setDraftReadings(prev => ({
      ...prev,
      [roomId]: Number(value)
    }));
  };

  const handleRateChange = (rateId: number, value: string) => {
    setDraftRates(prev => ({
      ...prev,
      [rateId]: Number(value)
    }));
  };

  const handleSaveRates = async () => {
    const promises = Object.entries(draftRates).map(([id, rate]) =>
      fetch('/api/UtilitiesMaster', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilitiesRateID: Number(id), RatePerUnit: rate }),
      })
    );

    try {
      await Promise.all(promises);
      alert("อัปเดตเรทค่าบริการสำเร็จ!");
      // Refresh rates from DB
      const res = await fetch('/api/UtilitiesMaster');
      setUtilityRates(await res.json());
      setDraftRates({});
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการอัปเดตเรท");
    }
  };

  const handleCreateInitialRate = async () => {
    if (!initialElecRate || Number(initialElecRate) <= 0) {
      alert("กรุณาใส่เรทค่าไฟที่ถูกต้อง");
      return;
    }
    try {
      const res = await fetch('/api/UtilitiesMaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Name: 'Electricity', RatePerUnit: Number(initialElecRate) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create initial rate');
      }
      const newRate = await res.json();
      setUtilityRates(prev => [...prev, newRate]);
      setInitialElecRate('');
      alert("สร้างเรทค่าไฟสำเร็จ!");
    } catch (e) {
      alert(`เกิดข้อผิดพลาด: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    // FIX: Only process rooms that have draft readings.
    const draftEntries = Object.entries(draftReadings);

    try {
      for (const [roomIdStr, currentValue] of draftEntries) {
        const roomId = Number(roomIdStr);

        // Ensure the room has an active contract before proceeding
        if (!activeContracts.some(c => c.RoomID === roomId)) continue;

        // Step 1: Save the meter reading (create if not exists) and get the record.
        const meterReadingRecord = await saveReading(roomId, currentValue);

        // Step 2: If we have a valid meter reading record, generate the bill.
        if (meterReadingRecord) {
          await generateBillForRoom(roomId, meterReadingRecord);
        }
      }

      alert(`บันทึกข้อมูลและสร้างบิลสำหรับ ${draftEntries.length} ห้องสำเร็จ!`);
      setDraftReadings({}); // Clear drafts on success
      loadAllReadings(); // Reload all data to be sure
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Billing generation failed:", error);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูลบางส่วน: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  const unitsUsed = useMemo(() => {
    const result: Record<number, number> = {};
    rooms.forEach(room => {
      const displayValue = draftReadings[room.RoomID] ?? readings.find(r => r.roomid === room.RoomID)?.currentvalue ?? 0;
      const prevValue = prevMonthReadings.find(pr => pr.roomid === room.RoomID)?.currentvalue ?? 0;
      result[room.RoomID] = Number(displayValue) > 0 ? Number(displayValue) - prevValue : 0;
    });
    return result;
  }, [draftReadings, readings, prevMonthReadings, rooms]);

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
    const displayValue = draftReadings[room.RoomID] ?? currentReading?.currentvalue ?? '';
    const used = unitsUsed[room.RoomID] ?? 0;

    return (
      <tr key={room.RoomID} className="text-center">
        <td className="border p-2 font-semibold">{room.RoomName}</td>
        <td className="border p-2">{prevValue}</td>
        <td className={`border p-2 ${draftReadings[room.RoomID] !== undefined ? 'bg-yellow-100' : 'bg-blue-100'}`}> {/* Highlight if draft exists */}
          <input
            type="number"
            value={displayValue}
            className="bg-blue-50 border border-blue-300 rounded px-2 py-1 w-24 text-blue-900"
            onChange={(e) => handleReadingChange(room.RoomID, e.target.value)}
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
      <div className="bg-white rounded shadow p-6 flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">เลือกรอบจดมิเตอร์</h1>
          <input
            type="month"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-blue-300 rounded px-3 py-2 text-blue-900 mt-2"
          />
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={activeContracts.length === 0 || loading}
          className="bg-green-600 text-white font-bold py-2 px-6 rounded shadow hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
          {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลทั้งหมด'}
        </button>
      </div>
      
      {/* Utility Rates Section */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">เรทค่าไฟ</h2>
        
        {utilityRates.some(rate => rate.Name === 'Electricity') ? (
          <div className="grid md:grid-cols-3 gap-4 items-end">
            {utilityRates.filter(rate => rate.Name === 'Electricity').map(rate => (
              <div key={rate.utilitiesRateID}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {rate.Name} (บาท/หน่วย)
                </label>
                <input
                  type="number"
                  value={draftRates[rate.utilitiesRateID] ?? rate.RatePerUnit}
                  onChange={(e) => handleRateChange(rate.utilitiesRateID, e.target.value)}
                  className={`w-full border rounded px-3 py-2 ${draftRates[rate.utilitiesRateID] !== undefined ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
                />
              </div>
            ))}
            <div className="md:col-start-3">
               <button 
                onClick={handleSaveRates}
                disabled={Object.keys(draftRates).length === 0}
                className="w-full bg-blue-600 text-white font-bold py-2 px-6 rounded shadow hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                บันทึกเรท
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                สร้างเรทค่าไฟเริ่มต้น (บาท/หน่วย)
              </label>
              <input
                  type="number"
                  placeholder="เช่น 8"
                  value={initialElecRate}
                  onChange={(e) => setInitialElecRate(e.target.value)}
                  className="w-full border rounded px-3 py-2 border-gray-300"
                />
            </div>
            <button onClick={handleCreateInitialRate} className="bg-green-600 text-white font-bold py-2 px-6 rounded shadow hover:bg-green-700 transition">
              สร้างเรท
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 mb-8">
        {loading && <div className="text-center p-4">Loading...</div>}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100 text-blue-900">
              <th className="p-2 border">ห้อง</th>
              <th className="p-2 border">เลขเดือนก่อน</th>
              <th className="p-2 border">เลขเดือนนี้</th>
              <th className="p-2 border">หน่วยใช้</th>
            </tr>
          </thead>

          <tbody>
            {!loading && orderedGroupKeys.map(floor => (
              <Fragment key={floor}>
                <tr className="bg-blue-200">
                  <td colSpan={4} className="p-2 font-bold text-blue-900">
                    ชั้นที่ {floor}
                  </td>
                </tr>
                {groupedRooms[floor]
                  .sort((a, b) => a.RoomID - b.RoomID)
                  .map(renderRoomRow)}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
