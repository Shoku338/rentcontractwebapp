"use client";

import { useState, useEffect } from "react";

type Room = {
  RoomID: number;
  RoomName: string;
  ContractId: string | null;
  RoomStatus: string;
};

export default function Dashboard() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [contractForm, setContractForm] = useState({
    TenantName: "",
    TenantSurname: "",
    Phone: "",
    Mail: "",
    StartDate: "",
    EndDate: "",
    MonthlyRent: "",
    ContractStatus: "Active",
  });

  async function updateRoomStatus(roomId: number, newStatus: string) {
    // optimistic UI update
    setRooms(prev => prev.map(r => r.RoomID === roomId ? { ...r, RoomStatus: newStatus } : r));
    if (selectedRoom && selectedRoom.RoomID === roomId) {
      setSelectedRoom({ ...selectedRoom, RoomStatus: newStatus });
    }

    try {
      const res = await fetch("/api/Room", {
        method: "PATCH", // or "PUT" depending on your API
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RoomID: roomId, RoomStatus: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update room status");
      }

      // optionally read response and reconcile if backend returns canonical record
      const updated = await res.json();
      setRooms(prev => prev.map(r => r.RoomID === roomId ? updated : r));
      if (selectedRoom && selectedRoom.RoomID === roomId) setSelectedRoom(updated);
    } catch (err) {
      // rollback optimistic update on error
      setRooms(prev => prev.map(r => r.RoomID === roomId ? { ...r, RoomStatus: selectedRoom?.RoomStatus ?? r.RoomStatus } : r));
      if (selectedRoom && selectedRoom.RoomID === roomId) {
        // keep the previous status in the selectedRoom UI
        setSelectedRoom(prev => prev ? { ...prev, RoomStatus: prev.RoomStatus } : prev);
      }
      alert(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function validateContractForm() {
    const errors: Record<string, string> = {};
    if (!contractForm.TenantName?.trim()) errors.TenantName = "กรุณาใส่ชื่อผู้เช่า";
    if (!contractForm.TenantSurname?.trim()) errors.TenantSurname = "กรุณาใส่นามสกุล";
    if (!contractForm.StartDate) errors.StartDate = "กรุณาเลือกวันเริ่มสัญญา";
    if (!contractForm.EndDate) errors.EndDate = "กรุณาเลือกวันสิ้นสุดสัญญา";
    if (contractForm.StartDate && contractForm.EndDate) {
      const sd = new Date(contractForm.StartDate);
      const ed = new Date(contractForm.EndDate);
      if (sd > ed) errors.DateOrder = "วันเริ่มต้องไม่มากว่าวันสิ้นสุด";
    }
    if (contractForm.MonthlyRent && Number(contractForm.MonthlyRent) < 0) errors.MonthlyRent = "ค่าเช่าต้องเป็นค่าบวกหรือ 0";
    return errors;
  }

  async function handleSaveContract() {
    if (savingContract) return;
    if (!selectedRoom) {
      alert("กรุณาเลือกห้องก่อนสร้างสัญญา");
      return;
    }

    setFormErrors({});
    const errors = await validateContractForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // you can also focus the first invalid field here
      return;
    }

    setSavingContract(true);
    try {
      // 1) create tenant
      const tenantPayload = {
        Firstname: contractForm.TenantName,
        Lastname: contractForm.TenantSurname,
        Email: "",
        Phone: contractForm.Phone,
      };

      const tenantRes = await fetch("/api/Tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenantPayload),
      });

      if (!tenantRes.ok) {
        const errBody = await tenantRes.json().catch(() => null);
        throw new Error(errBody?.error ?? "Failed to create tenant");
      }
      const createdTenant = await tenantRes.json();

      // Compute CreatedAt (today's date as ISO string)
      const today = new Date();
      const createdAt = today.toISOString().split("T")[0]; // YYYY-MM-DD format

      // Determine ContractStatus based on StartDate and EndDate
      const startDate = new Date(contractForm.StartDate);
      const endDate = new Date(contractForm.EndDate);
      const now = new Date();
      const todayNoTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startNoTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endNoTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      let derivedStatus = "Active";
      if (todayNoTime < startNoTime) {
        // Today is before start date → Reserved
        derivedStatus = "Reserved";
      } else if (todayNoTime > endNoTime) {
        // Today is after end date → Expired
        derivedStatus = "Expired";
      } else {
        // Today is between start and end → Active
        derivedStatus = "Active";
      }

      // 2) create contract using returned TenantID and selected room's RoomID
      const contractRes = await fetch("/api/Contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          RoomID: selectedRoom!.RoomID,
          TenantID: createdTenant.TenantID,
          StartDate: contractForm.StartDate,
          EndDate: contractForm.EndDate,
          MonthlyRent: Number(contractForm.MonthlyRent || 0),
          ContractStatus: derivedStatus, // always Active; room status derives from dates
          CreatedAt: createdAt,
        }),
      });

      if (!contractRes.ok) {
        // rollback tenant (optional)
        await fetch(`/api/Tenant?id=${createdTenant.TenantID}`, { method: "DELETE" }).catch(() => { });
        const err = await contractRes.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to create contract");
      }

      const { contract, room } = await contractRes.json();

      // update local UI: close modal, reset form
      setShowContractModal(false);
      setContractForm({
        TenantName: "",
        TenantSurname: "",
        Phone: "",
        Mail: "",
        StartDate: "",
        EndDate: "",
        MonthlyRent: "",
        ContractStatus: "Active",
      });

      // Replace or refresh the updated room in your rooms state
      setRooms(prev => prev.map(r => (r.RoomID === room.RoomID ? room : r)));
      if (selectedRoom && selectedRoom.RoomID === room.RoomID) setSelectedRoom(room);

      // success feedback
      alert("สร้างสัญญาเรียบร้อยแล้ว");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      alert(message);
    } finally {
      setSavingContract(false);
    }
  }

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch("/api/Room");
        if (!response.ok) throw new Error("Failed to fetch rooms");
        const data = await response.json();
        setRooms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

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

  if (loading) return <div className="p-8">กำลังโหลด...</div>;
  if (error) return <div className="p-8 text-red-600">เกิดข้อผิดพลาด: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-green-600">
            {Math.round((rooms.filter(r => r.RoomStatus === "Occupied").length / rooms.length) * 100)}%
          </span>
          <span className="text-gray-600 mt-2">อัตราการเข้าพัก</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-yellow-600">
            {rooms.filter(r => r.RoomStatus === "Booked").length} ห้อง
          </span>
          <span className="text-gray-600 mt-2">ห้องจอง</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-red-600">0 ห้อง</span>
          <span className="text-gray-600 mt-2">ค้างชำระ</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-purple-600">
            {rooms.filter(r => r.RoomStatus === "Available").length} ห้อง
          </span>
          <span className="text-gray-600 mt-2">ห้องว่าง</span>
        </div>
      </div>

      {/* Filter & Actions */}
      <div className="bg-white rounded shadow p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">สนใจห้อง</button>
        </div>
        <button className="bg-orange-100 text-orange-700 px-4 py-2 rounded border border-orange-300">
          เพิ่ม/ลบ อาคาร
        </button>
      </div>

      {/* Building List - Group by Floor */}
      <div className="space-y-8">
        <div className="bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold mb-6 text-blue-900">อาคาร 1</h1>
            <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
              จัดการตึก
            </button>
          </div>

          {/* Floors */}
          {Object.entries(groupedRooms)
            .sort(([floorA], [floorB]) => Number(floorA) - Number(floorB))
            .map(([floor, floorRooms]) => (
              <div key={floor} className="mb-8">
                <h2 className="text-xl font-bold mb-4">ชั้นที่ {floor}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
                  {floorRooms
                    .sort((a, b) => a.RoomID - b.RoomID)  // Add this line to sort rooms
                    .map((room) => (
                      <button
                        key={room.RoomID}
                        onClick={() => setSelectedRoom(room)}
                        className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
                      >
                        <div
                          className={`rounded-lg w-24 h-24 flex items-center justify-center mb-2 ${room.RoomStatus === "Available"
                            ? "bg-green-300"
                            : room.RoomStatus === "Unavailable"
                              ? "bg-red-300"
                              : "bg-yellow-300"
                            }`}
                        >
                          <span className="text-white text-3xl font-bold">💰</span>
                        </div>
                        <span className="font-bold">{room.RoomName}</span>
                        <span className="text-xs text-gray-500">{room.RoomStatus}</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Modal Popup */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl max-h-150 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">ห้อง {selectedRoom.RoomName}</h2>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6 gap-4 overflow-x-auto">
              {["details", "tenant", "payment", "contract"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-4 font-semibold transition whitespace-nowrap ${activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  {tab === "details" && "ข้อมูล"}
                  {tab === "tenant" && "ผู้เช่า"}
                  {tab === "payment" && "ชำระเงิน"}
                  {tab === "contract" && "สัญญา"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mb-6">
              {activeTab === "details" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">ชื่อห้อง</label>
                    <p className="text-gray-600">{selectedRoom.RoomName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">สถานะ</label>
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedRoom.RoomStatus}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          // confirm change if you want
                          if (!confirm(`เปลี่ยนสถานะเป็น "${newStatus}" สำหรับห้อง ${selectedRoom.RoomName}?`)) return;
                          updateRoomStatus(selectedRoom.RoomID, newStatus);
                        }}
                        className="border rounded px-3 py-2"
                      >
                        <option value="Available">Available</option>
                        <option value="Unavailable">Unavailable</option>
                        <option value="Renovate">Renovate</option>
                      </select>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Current: {selectedRoom.RoomStatus}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">สัญญา</label>
                    <p className="text-gray-600">{selectedRoom.ContractId || "ไม่มี"}</p>
                  </div>
                </div>
              )}

              {activeTab === "tenant" && (
                <div className="space-y-4">
                  {selectedRoom.ContractId ? (
                    <div>
                      <p className="text-gray-600"><strong>Tenant ID:</strong> {selectedRoom.ContractId}</p>
                      <p className="text-gray-600"><strong>Contract Status:</strong> Active</p>
                      <button className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mt-2">
                        ยกเลิกสัญญา
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-600">ไม่มีผู้เช่าในห้องนี้</p>
                  )}
                </div>
              )}

              {activeTab === "payment" && (
                <div className="space-y-4">
                  {selectedRoom.ContractId ? (
                    <>
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm text-gray-600"><strong>สัญญาปัจจุบัน:</strong> {selectedRoom.ContractId}</p>
                        <p className="text-sm text-gray-600"><strong>ค่าเช่า:</strong> ฿ -</p>
                        <p className="text-sm text-gray-600"><strong>วันครบกำหนด:</strong> -</p>
                        <p className="text-sm text-gray-600"><strong>สถานะ:</strong> รอชำระ</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">ประวัติการชำระเงิน</h3>
                        <p className="text-sm text-gray-600">ยังไม่มีประวัติการชำระเงิน</p>
                      </div>
                      <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        + เพิ่มค่าใช้เพิ่มเติม
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-600">ไม่มีสัญญาในห้องนี้</p>
                  )}
                </div>
              )}

              {activeTab === "contract" && (
                <div className="space-y-4">
                  {selectedRoom.ContractId ? (
                    <div>
                      <p className="text-gray-600"><strong>สัญญาปัจจุบัน:</strong> {selectedRoom.ContractId}</p>
                      <button className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 mt-2">
                        + สร้างสัญญาจองห้อง
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600">ยังไม่มีสัญญาในห้องนี้</p>
                      <button
                        onClick={() => setShowContractModal(true)}
                        className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                      >
                        + สร้างสัญญา
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md pointer-events-auto">
            <h3 className="text-xl font-bold mb-4">สร้างสัญญาเช่า ห้อง {selectedRoom?.RoomName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อผู้เช่า</label>
                <input
                  type="text"
                  placeholder="Enter Tenant Name"
                  value={contractForm.TenantName}
                  onChange={(e) => setContractForm({ ...contractForm, TenantName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.TenantName && <p className="text-xs text-red-600 mt-1">{formErrors.TenantName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">นามสกุลผู้เช่า</label>
                <input
                  type="text"
                  placeholder="Enter Tenant Surname"
                  value={contractForm.TenantSurname}
                  onChange={(e) => setContractForm({ ...contractForm, TenantSurname: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.TenantSurname && <p className="text-xs text-red-600 mt-1">{formErrors.TenantSurname}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">เบอร์โทรผู้เช่า</label>
                <input
                  type="number"
                  placeholder="Enter Phone"
                  value={contractForm.Phone}
                  onChange={(e) => setContractForm({ ...contractForm, Phone: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
                <input
                  type="text"
                  placeholder="Enter Email"
                  value={contractForm.Mail}
                  onChange={(e) => setContractForm({ ...contractForm, Mail: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">วันเริ่มสัญญา</label>
                <input
                  type="date"
                  value={contractForm.StartDate}
                  onChange={(e) => setContractForm({ ...contractForm, StartDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.StartDate && <p className="text-xs text-red-600 mt-1">{formErrors.StartDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">วันสิ้นสุดสัญญา</label>
                <input
                  type="date"
                  value={contractForm.EndDate}
                  onChange={(e) => setContractForm({ ...contractForm, EndDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.EndDate && <p className="text-xs text-red-600 mt-1">{formErrors.EndDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ค่าเช่ารายเดือน (฿)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={contractForm.MonthlyRent}
                  onChange={(e) => setContractForm({ ...contractForm, MonthlyRent: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.MonthlyRent && <p className="text-xs text-red-600 mt-1">{formErrors.MonthlyRent}</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveContract}
                disabled={savingContract}
                className={`flex-1 px-4 py-2 rounded ${savingContract ? "bg-blue-300 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                {savingContract ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                onClick={() => setShowContractModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}     