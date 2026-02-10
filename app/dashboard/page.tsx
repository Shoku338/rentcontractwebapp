"use client";

import { useState, useEffect } from "react";
import { Room, Contract } from "@/lib/types";
import { getContractsByRoomId, createContract } from "@/app/services/contractService";
import { updateRoomStatus as updateRoomStatusService } from "@/app/services/roomService";
import { createTenant, deleteTenant } from "@/app/services/tenantService";
import { useDashboardData } from "@/app/hooks/useDashboardData";
import { DashboardStats } from "@/components/DashboardStats";
import { RoomFilters } from "@/components/RoomFilters";

export default function Dashboard() {
  const { rooms, setRooms, allActiveContracts, loading, error, triggerRefresh } = useDashboardData();

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [showContractModal, setShowContractModal] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [roomContracts, setRoomContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
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

  // State for extra billing
  const [extraCharge, setExtraCharge] = useState({
    description: "",
    amount: ""
  });

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
      await updateRoomStatusService(roomId, newStatus);
      // optionally read response and reconcile if backend returns canonical record
      triggerRefresh();
    } catch (err) {
      // rollback optimistic update on error
      // Note: This rollback logic might not be perfect if the original status was different
      // from what's in selectedRoom. A more robust solution might store the pre-update state.
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

      const createdTenant = await createTenant(tenantPayload);

      // 2) create contract using returned TenantID and selected room's RoomID
      try {
        await createContract({
            RoomID: selectedRoom!.RoomID,
            TenantID: createdTenant.TenantID,
            StartDate: contractForm.StartDate,
            EndDate: contractForm.EndDate,
            MonthlyRent: Number(contractForm.MonthlyRent || 0),
        });
      } catch (contractErr) {
        await deleteTenant(createdTenant.TenantID);
        // re-throw the original contract creation error
        throw contractErr;
      }

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

  async function handleAddExtraCharge() {
    if (!selectedRoom || !extraCharge.description || !extraCharge.amount) {
      alert("Please provide a description and amount.");
      return;
    }

    const activeContract = roomContracts.find(c => c.ContractStatus === 'Active');
    if (!activeContract) {
      alert("No active contract found for this room to add a charge to.");
      return;
    }

    try {
      // Find the bill for the current month for this contract
      // This is a simplified approach; a real app might need a more robust date filter
      const res = await fetch(`/api/Billing?ContractId=${activeContract.ContractId}`);
      const bills = await res.json();
      const thisMonthBill = bills[0]; // Assuming the first one is the one we want

      if (!thisMonthBill) {
        alert("No bill found for the current month to add charges to. Please generate the main bill first.");
        return;
      }

      // Add the new charge as a BillingDetail
      await fetch('/api/BillingDetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BillingId: thisMonthBill.id,
          ItemType: 'Extra',
          Description: extraCharge.description,
          Amount: Number(extraCharge.amount)
        })
      });

      alert("Extra charge added successfully!");
      setExtraCharge({ description: "", amount: "" });
    } catch (err) {
      alert(`Failed to add charge: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async function fetchContractsForRoom() { } // Placeholder for the actual function

  useEffect(() => {
    async function fetchContractsForRoomLocal() {
      if (!["tenant", "contract", "billing"].includes(activeTab) || !selectedRoom) {
        return;
      }

      setLoadingContracts(true);
      setRoomContracts([]);
      try {
        const data = await getContractsByRoomId(selectedRoom.RoomID);
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
      <DashboardStats rooms={rooms} allActiveContracts={allActiveContracts} />

      <RoomFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilters={statusFilters}
        onStatusToggle={toggleStatusFilter}
      />

      {/* Building List - Group by Floor */}
      <div className="space-y-8">
        <div className="bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold mb-6 text-blue-900">Saguan Sap Mansion</h1>
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
                      <button // Reverted to original button style
                        key={room.RoomID}
                        onClick={() => setSelectedRoom(room)}
                        className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
                      >
                        <div
                          className={`rounded-lg w-24 h-24 flex items-center justify-center mb-2 ${
                            room.RoomStatus === "Available" ? "bg-red-300"
                            : room.RoomStatus === "Unavailable" ? "bg-green-300"
                            : "bg-yellow-300"

                            }`}
                        >
                          <img 
                                src="Condo.png" // The correct path for files in /public folder
                                alt="Contract Icon" 
                                className="w-12 h-12" // Adjust the w-12 h-12 classes for desired size
                            />
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
              {["details", "tenant", "billing", "contract"].map((tab) => (
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
                  {tab === "billing" && "บิลค่าใช้จ่าย"}
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
                          if (!window.confirm(`เปลี่ยนสถานะเป็น "${newStatus}" สำหรับห้อง ${selectedRoom.RoomName}?`)) return;
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

              {activeTab === "billing" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">เพิ่มค่าใช้จ่ายอื่นๆ</h3>
                  <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">รายละเอียด</label>
                      <input
                        type="text"
                        placeholder="เช่น ค่าซ่อม, ค่าทำความสะอาด"
                        value={extraCharge.description}
                        onChange={(e) => setExtraCharge({ ...extraCharge, description: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">จำนวนเงิน (฿)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={extraCharge.amount}
                        onChange={(e) => setExtraCharge({ ...extraCharge, amount: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <button
                      onClick={handleAddExtraCharge}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    >
                      + เพิ่มรายการ
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">หมายเหตุ: จะถูกเพิ่มเข้าไปในบิลของเดือนปัจจุบัน (ถ้ามี)</p>
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