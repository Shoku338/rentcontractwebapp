"use client";

import { useState } from "react";

type Room = {
  RoomID: number;
  RoomName: string;
  ContractId: string | null;
  RoomStatus: string;
};

export default function Dashboard() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Mock data — replace with actual data fetch
  const rooms: Room[] = [
    { RoomID: 101, RoomName: "101", ContractId: null, RoomStatus: "Available" },
    { RoomID: 102, RoomName: "102", ContractId: null, RoomStatus: "Available" },
    { RoomID: 103, RoomName: "103", ContractId: null, RoomStatus: "Available" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-green-600">100%</span>
          <span className="text-gray-600 mt-2">อัตราการเข้าพัก</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-yellow-600">0 ห้อง</span>
          <span className="text-gray-600 mt-2">ห้องจอง</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-red-600">15 ห้อง</span>
          <span className="text-gray-600 mt-2">ค้างชำระ</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-purple-600">0 ห้อง</span>
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

      {/* Building List */}
      <div className="space-y-8">
        <div className="bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold mb-6 text-blue-900">อาคาร 1</h1>
            <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
              จัดการตึก
            </button>
          </div>

          {/* Floor 1 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">ชั้นที่ 1</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {rooms.map((room) => (
                <button
                  key={room.RoomID}
                  onClick={() => setSelectedRoom(room)}
                  className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
                >
                  <div className="bg-orange-300 rounded-lg w-24 h-24 flex items-center justify-center mb-2">
                    <span className="text-white text-3xl font-bold">💰</span>
                  </div>
                  <span className="font-bold">{room.RoomID}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

       {/* Modal Popup */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">ห้อง {selectedRoom.RoomID}</h2>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6 gap-4">
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-2 px-4 font-semibold transition ${
                  activeTab === "details"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                ข้อมูล
              </button>
              <button
                onClick={() => setActiveTab("tenant")}
                className={`pb-2 px-4 font-semibold transition ${
                  activeTab === "tenant"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                ผู้เช่า
              </button>
              <button
                onClick={() => setActiveTab("payment")}
                className={`pb-2 px-4 font-semibold transition ${
                  activeTab === "payment"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                ชำระเงิน
              </button>
              <button
                onClick={() => setActiveTab("contract")}
                className={`pb-2 px-4 font-semibold transition ${
                  activeTab === "contract"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                สัญญา
              </button>
            </div>

            {/* Tab Content */}
            <div className="mb-6">
              {activeTab === "details" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">หมายเลขห้อง</label>
                    <p className="text-gray-600">{selectedRoom.RoomID}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">ชื่อห้อง</label>
                    <p className="text-gray-600">{selectedRoom.RoomName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">สถานะ</label>
                    <p className="text-gray-600">{selectedRoom.RoomStatus}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">สัญญา</label>
                    <p className="text-gray-600">{selectedRoom.ContractId || "ไม่มี"}</p>
                  </div>
                </div>
              )}

              {activeTab === "tenant" && (
                <div className="space-y-4">
                  <p className="text-gray-600">ยังไม่มีผู้เช่าในห้องนี้</p>
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    + เพิ่มผู้เช่า
                  </button>
                </div>
              )}

              {activeTab === "payment" && (
                <div className="space-y-4">
                  <p className="text-gray-600">ยังไม่มีการชำระเงินในห้องนี้</p>
                  <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    + บันทึกการชำระเงิน
                  </button>
                </div>
              )}

              {activeTab === "contract" && (
                <div className="space-y-4">
                  <p className="text-gray-600">ยังไม่มีสัญญาในห้องนี้</p>
                  <button className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                    + สร้างสัญญา
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                ดูรายละเอียด
              </button>
              <button className="flex-1 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                แก้ไข
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedRoom(null);
                setActiveTab("details");
              }}
              className="w-full mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );

}