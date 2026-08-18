"use client";

import { useState } from "react";

const tabs = ["ข้อมูลหอพัก", "บิล", "สัญญาเช่า", "ผังห้อง", "ค่าน้ำ-ค่าไฟ", "ค่าเช่าห้อง"];
const utilitiesTab = "ค่าน้ำ-ค่าไฟ";

export default function SettingPage() {
  const [selectedTab, setSelectedTab] = useState(utilitiesTab);
  const isUtilities = selectedTab === utilitiesTab;

  return (
    <div className="p-6 bg-[#121212] min-h-screen text-white">
      {/* 1. Header Navigation */}
      <h1 className="text-xl font-bold mb-4">ตั้งค่าหอพัก</h1>
      <div className="flex gap-2 mb-2 border-b border-gray-700 pb-2 overflow-x-auto justify-center">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-t-lg transition ${
              selectedTab === tab
                ? "bg-[#2f6fdb] text-white"
                : "bg-[#1e1e1e] text-gray-300 hover:bg-[#333]"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="mb-6 text-sm text-gray-400">เลือกแท็บเพื่อเปลี่ยนมุมมอง</div>

      {isUtilities ? (
        <div className="space-y-6">
          {/* 2. Filter Bar */}
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="ค้นหาตามหมายเลขห้อง" className="bg-[#2a2a2a] p-2 rounded w-full" />
              <select className="bg-[#2a2a2a] p-2 rounded text-gray-400 w-full">
                <option>ห้องทั้งหมด</option>
              </select>
              <select className="bg-[#2a2a2a] p-2 rounded text-gray-400 w-full">
                <option>ชั้นทั้งหมด</option>
              </select>
            </div>
          </div>

          {/* 3. Room Grid by Floor */}
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <h2 className="text-lg mb-4">ชั้น 1</h2>
            <div className="flex flex-wrap gap-4">
              <div className="w-32 bg-blue-900 p-2 rounded">
                <p className="text-center font-bold">101</p>
                <div className="bg-blue-700 text-xs p-1 mt-2">น้ำ: 14 บาท</div>
                <div className="bg-pink-700 text-xs p-1 mt-1">ไฟ: 4 บาท</div>
              </div>
              <div className="w-32 bg-blue-900 p-2 rounded">
                <p className="text-center font-bold">102</p>
                <div className="bg-blue-700 text-xs p-1 mt-2">น้ำ: 10 บาท</div>
                <div className="bg-pink-700 text-xs p-1 mt-1">ไฟ: 5 บาท</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1e1e1e] p-8 rounded-lg text-center text-gray-300">
          <p className="text-lg font-semibold mb-2">แท็บ "{selectedTab}" ยังไม่มีเนื้อหา</p>
          <p>ขณะนี้แสดงเฉพาะแท็บ "{utilitiesTab}" เท่านั้น</p>
        </div>
      )}
    </div>
  );
}
