export default function Page() {
  return (
    <div className="bg-white min-h-screen p-6">

      {/* Top Section */}
      <div className="bg-white rounded shadow p-6 flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-900 mb-4 md:mb-0">
          เลือกรอบบิล
        </h1>

        <div className="flex items-center gap-3">

          <div className="flex items-center border border-blue-300 rounded px-3 py-2 text-blue-900 bg-white">
            <span className="mr-2">📅</span>
            <input
              type="text"
              value="ธันวาคม/2025"
              readOnly
              className="outline-none text-blue-900 bg-transparent"
            />
          </div>

          <button className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition">
            คู่มือการใช้งาน
          </button>

          <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
            คำอธิบายสถานะบิล
          </button>
        </div>
      </div>

      {/* Secondary Filters Section */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">ธันวาคม/2025</h2>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <select className="border border-gray-300 rounded px-3 py-2 text-gray-700 w-full">
            <option>บิลทั้งหมด</option>
          </select>

          <input
            type="text"
            placeholder="ค้นหาตามหมายเลขห้อง"
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />

          <input
            type="text"
            placeholder="ค้นหาตามยอดเงินรวม"
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
            พิมพ์หลายห้อง
          </button>

          <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
            พิมพ์ในสรุปบิล
          </button>

          <button className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
            ดาวน์โหลด Excel
          </button>

          <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 ml-auto">
            ส่งบิล
          </button>
        </div>
      </div>

      {/* Floor Header */}
      <div className="bg-gray-100 border border-gray-300 rounded-t px-6 py-4 text-xl font-bold text-blue-900">
        ชั้นที่ 1
      </div>

      {/* Floor Content */}
      <div className="bg-white border border-gray-300 border-t-0 rounded-b p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {[{ id: 101, price: "4,696" }, { id: 102, price: "4,504" }, { id: 103, price: "6,014" }].map(
            (room) => (
              <div
                key={room.id}
                className="flex flex-col items-center bg-green-100 rounded shadow p-4"
              >
                <div className="text-lg font-bold text-blue-900 mb-2">
                  {room.id}
                </div>
                <div className="bg-green-200 rounded p-6 mb-3 shadow-inner">
                  💌
                </div>
                <div className="text-green-700 font-bold text-lg">
                  {room.price} บาท
                </div>
              </div>
            )
          )}

        </div>
      </div>

    </div>
  );
}
