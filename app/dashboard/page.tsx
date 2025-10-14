export default function Dashboard() {
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
          {/*<button className="bg-gray-200 px-4 py-2 rounded">ตั้งค่าการแสดงผล</button>*/}
          <button className="bg-blue-600 text-white px-4 py-2 rounded">สนใจห้อง</button>
        </div>
        <div className="flex gap-2">
          {/*<input
            type="text"
            placeholder="ฟิลเตอร์ห้อง"
            className="border rounded px-4 py-2"
          />
          <input
            type="text"
            placeholder="ค้นหาตามหมายเลขห้อง"
            className="border rounded px-4 py-2"
          />*/}
        </div>
        <button className="bg-orange-100 text-orange-700 px-4 py-2 rounded border border-orange-300">
          เพิ่ม/ลบ อาคาร
        </button>
      </div>

      {/* Building List */}
      <div className="space-y-8">
        {/* Building 1 */}
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
              {[101, 102, 103].map((room) => (
                <div key={room} className="flex flex-col items-center">
                  <div className="bg-orange-300 rounded-lg w-24 h-24 flex items-center justify-center mb-2">
                    <span className="text-white text-3xl font-bold">💰</span>
                  </div>
                  <span className="font-bold">{room}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Add more floors here if needed */}
        </div>

        {/* Building 2 (example) */}
        <div className="bg-white rounded shadow p-6">
         <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold mb-6 text-blue-900">อาคาร 2</h1>
            <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
            จัดการตึก
            </button>
          </div>
          {/* Floor 1 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">ชั้นที่ 1</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {[201, 202, 203].map((room) => (
                <div key={room} className="flex flex-col items-center">
                  <div className="bg-orange-300 rounded-lg w-24 h-24 flex items-center justify-center mb-2">
                    <span className="text-white text-3xl font-bold">💰</span>
                  </div>
                  <span className="font-bold">{room}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}