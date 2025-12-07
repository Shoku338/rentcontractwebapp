"use client";

import { useState, useEffect } from "react";

type Tenant = {
  TenantID: number;
  Firstname: string;
  Lastname: string;
  Phone: string;
  Email: string;
};

type Contract = {
  ContractId: string;
  ContractStatus: "Active" | "Expired" | "Reserved";
  StartDate: string;
  EndDate: string;
  MonthlyRent: number;
  // This matches the 'tenants(*)' join from your API
  tenants: Tenant;
};

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
  const [roomContracts, setRoomContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [allActiveContracts, setAllActiveContracts] = useState<{ RoomID: number; ContractStatus: string }[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [contractForm, setContractForm] = useState({
    TenantName: "",
    TenantSurname: "",
    Phone: "",
    Email: "",
    StartDate: "",
    EndDate: "",
    MonthlyRent: "",
    ContractStatus: "",
  });

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      }
      return [...prev, status];
    });
  };

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
      triggerRefresh();
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

  function handleEditContract(contract: Contract) {
    setEditingContract(contract);
    setContractForm({
      TenantName: contract.tenants.Firstname,
      TenantSurname: contract.tenants.Lastname,
      Phone: contract.tenants.Phone,
      Email: contract.tenants.Email,
      StartDate: contract.StartDate,
      EndDate: contract.EndDate,
      MonthlyRent: String(contract.MonthlyRent),
      ContractStatus: contract.ContractStatus,
    });
    setShowContractModal(true);
  }

  function handleCloseContractModal() {
    setShowContractModal(false);
    setEditingContract(null);
    setFormErrors({});
    // Reset form to blank
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

    if (editingContract) {
      // Logic for UPDATING an existing contract
      try {
        const tenantPayload = {
          TenantID: editingContract.tenants.TenantID,
          Firstname: contractForm.TenantName,
          Lastname: contractForm.TenantSurname,
          Email: contractForm.Email,
          Phone: contractForm.Phone,
        };

        const contractPayload = {
          StartDate: contractForm.StartDate,
          EndDate: contractForm.EndDate,
          MonthlyRent: Number(contractForm.MonthlyRent || 0),
          ContractStatus: contractForm.ContractStatus,
        };

        const res = await fetch(`/api/Contract?id=${editingContract.ContractId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantData: tenantPayload, contractData: contractPayload }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error ?? "Failed to update contract");
        }

        // Refresh contracts for the room to show updated data
        triggerRefresh();
        handleCloseContractModal();
        alert("Contract updated successfully!");

      } catch (err) {
        const message = err instanceof Error ? err.message : "Update failed";
        alert(message);
      } finally {
        setSavingContract(false);
      }
      return; // End execution for edit mode
    }

    // --- Logic for CREATING a new contract (existing code) ---
    try {
      // 1) create tenant
      const tenantPayload = {
        Firstname: contractForm.TenantName,
        Lastname: contractForm.TenantSurname,
        Email: contractForm.Email,
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
      handleCloseContractModal();
      setContractForm({
        TenantName: "",
        TenantSurname: "",
        Phone: "",
        Email: "",
        StartDate: "",
        EndDate: "",
        MonthlyRent: "",
        ContractStatus: "",
      });

      // success feedback
      alert("สร้างสัญญาเรียบร้อยแล้ว");
      triggerRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      alert(message);
    } finally {
      setSavingContract(false);
    }
  }

  async function fetchContractsForRoom() { } // Placeholder for the actual function

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        // First, trigger the backend to synchronize all statuses
        // The file is at /dashboard/route.ts, so the endpoint is /dashboard
        await fetch("/dashboard", { method: "POST" });

        // Fetch both rooms and active/reserved contracts in parallel
        const [roomsRes, contractsRes] = await Promise.all([
          fetch("/api/Room"),
          fetch("/api/ActiveContract"), // Use the new dedicated endpoint
        ]);

        if (!roomsRes.ok) throw new Error("Failed to fetch rooms");
        if (!contractsRes.ok) throw new Error("Failed to fetch active contracts");

        const roomsData: Room[] = await roomsRes.json();
        const activeContracts: { RoomID: number; ContractStatus: string }[] = await contractsRes.json();
        setAllActiveContracts(activeContracts);

        // Create a map for quick lookup of room contract status
        const roomContractStatusMap = new Map<number, string>();
        for (const contract of activeContracts) {
          // If a room has any active or reserved contract, it is considered Unavailable.
          roomContractStatusMap.set(contract.RoomID, "Unavailable");
        }

        // Synchronize room statuses based on contract data
        const synchronizedRooms = roomsData.map(room => {
          // Do not update rooms under renovation
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

    fetchRooms();
  }, [refreshTrigger]);

  useEffect(() => {
    async function fetchContractsForRoomLocal() {
      if (!["tenant", "contract"].includes(activeTab) || !selectedRoom) {
        return;
      }

      setLoadingContracts(true);
      setRoomContracts([]);
      try {
        const res = await fetch(`/api/Contract?roomId=${selectedRoom.RoomID}`);
        if (!res.ok) {
          throw new Error("Failed to fetch contracts for the room");
        }
        const data: Contract[] = await res.json();
        // Sort contracts to show Active ones first
        data.sort((a, b) => {
          if (a.ContractStatus === "Active" && b.ContractStatus !== "Active") return -1;
          if (a.ContractStatus !== "Active" && b.ContractStatus === "Active") return 1;
          return 0;
        });
        setRoomContracts(data);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not load contract details.");
      } finally {
        setLoadingContracts(false);
      }
    };

    // Assign to outer scope function so handleSaveContract can call it
    (fetchContractsForRoom as any) = fetchContractsForRoomLocal;
    fetchContractsForRoomLocal();
  }, [activeTab, selectedRoom]);

  const reservedRoomIds = new Set(allActiveContracts.filter(c => c.ContractStatus === "Reserved").map(c => c.RoomID));

  const filteredRooms = rooms.filter(room => {
    // Filter by search query
    const nameMatch = room.RoomName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!nameMatch) return false;

    // If no status filters are active, show all that match the name
    if (statusFilters.length === 0) return true;

    // Check against status filters
    let hasMatchingStatus = false;
    if (statusFilters.includes("Reserved") && reservedRoomIds.has(room.RoomID)) {
      hasMatchingStatus = true;
    }
    // Check for other statuses. Use `else if` to avoid showing a "Reserved" room twice if "Unavailable" is also selected.
    else if (statusFilters.includes(room.RoomStatus)) {
      hasMatchingStatus = true;
    }

    return hasMatchingStatus;
  });

  const groupedRooms = filteredRooms.reduce((acc, room) => {
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
          <span className="text-2xl font-bold text-green-600" title={`${rooms.filter(r => r.RoomStatus === "Unavailable").length} / ${rooms.length} rooms`}>
            {rooms.length > 0 ? Math.round((rooms.filter(r => r.RoomStatus === "Unavailable").length / rooms.length) * 100) : 0}%
          </span>
          <span className="text-gray-600 mt-2">อัตราการเข้าพัก</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-yellow-600">
            {new Set(allActiveContracts.filter(c => c.ContractStatus === "Reserved").map(c => c.RoomID)).size} ห้อง
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

      {/* Search Bar */}
      <div className="bg-white rounded shadow p-4 mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="ค้นหาห้องด้วยชื่อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {["Available", "Reserved", "Unavailable", "Renovate"].map(status => (
            <button
              key={status}
              onClick={() => toggleStatusFilter(status)}
              className={`px-3 py-1 text-sm font-semibold rounded-full border transition whitespace-nowrap ${statusFilters.includes(status)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
            >
              {status}
            </button>
          ))}
        </div>

      </div>

      {/* Building List - Group by Floor */}
      <div className="space-y-8">
        <div className="bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold mb-6 text-blue-900">อาคาร 1</h1>
            {/* <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
              จัดการตึก
            </button> */}

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
                  {/* <div>
                    <label className="block text-sm font-semibold text-gray-700">สัญญา</label>
                    <p className="text-gray-600">{selectedRoom.ContractId || "ไม่มี"}</p>
                  </div>*/}

                </div>
              )}

              {activeTab === "tenant" && (
                <div className="space-y-4">
                  {loadingContracts ? (
                    <p>Loading tenant information...</p>
                  ) : roomContracts.length > 0 ? (
                    roomContracts.map((contract) => (
                      <div key={contract.ContractId} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-blue-800">
                              {contract.tenants.Firstname} {contract.tenants.Lastname}
                            </h4>
                            <p className="text-sm text-gray-600">Phone: {contract.tenants.Phone}</p>
                            <p className="text-sm text-gray-600">Email: {contract.tenants.Email}</p>
                          </div>
                          <span
                            className={`px-3 py-1 text-sm font-semibold rounded-full ${contract.ContractStatus === "Active" ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"}`}
                          >
                            {contract.ContractStatus}
                          </span>
                        </div>
                        <button onClick={() => handleEditContract(contract)} className="text-sm text-blue-600 hover:underline mt-2">
                          Edit Details
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Contract ID: {contract.ContractId}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">No tenant contracts found for this room.</p>
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
                  {loadingContracts ? (
                    <p>Loading contract information...</p>
                  ) : roomContracts.length > 0 ? (
                    roomContracts.map((contract) => (
                      <div key={contract.ContractId} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-blue-800">
                            {contract.tenants.Firstname} {contract.tenants.Lastname}
                          </h4>
                          <span
                            className={`px-3 py-1 text-sm font-semibold rounded-full ${contract.ContractStatus === "Active" ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"}`}
                          >
                            {contract.ContractStatus}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600"><strong>Duration:</strong> {contract.StartDate} to {contract.EndDate}</p>
                        <p className="text-sm text-gray-600"><strong>Rent:</strong> ฿{contract.MonthlyRent.toLocaleString()}/month</p>
                        <button onClick={() => handleEditContract(contract)} className="text-sm text-blue-600 hover:underline mt-2">
                          Edit Contract
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Contract ID: {contract.ContractId}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">No contracts found for this room.</p>
                  )}
                  <button onClick={() => { setEditingContract(null); setShowContractModal(true); }} className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 mt-4">
                    + สร้างสัญญาใหม่
                  </button>
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
            <h3 className="text-xl font-bold mb-4">{editingContract ? "Edit Contract" : "Create Contract"} for Room {selectedRoom?.RoomName}</h3>
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
                  value={contractForm.Email}
                  onChange={(e) => setContractForm({ ...contractForm, Email: e.target.value })}
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
                onClick={handleCloseContractModal}
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