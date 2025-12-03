export default function PayBill() {
  return (
    <div className="bg-white min-h-screen p-6">

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">
          กรุณาพิมพ์ชื่อห้องที่ต้องการชำระเงิน
        </h1>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-6">
        <div className="flex items-center border border-gray-300 rounded px-3 py-2 bg-white">
          <span className="text-gray-500 mr-2">🔍</span>
          <input
            type="text"
            placeholder="ค้นหาตามหมายเลขห้อง"
            className="w-full outline-none"
          />
        </div>
      </div>

      {/* Subtitle */}
      <div className="bg-gray-100 border border-gray-300 px-4 py-3 font-semibold text-gray-700 mb-4">
        รายการห้องค้างชำระ: 7 ห้อง
      </div>

      {/* Room List */}
      <div className="space-y-4">

        {[
          { room: "202", amount: "6,112" },
          { room: "203", amount: "6,732" },
          { room: "301", amount: "5,370" },
          { room: "303", amount: "4,936" },
          { room: "402", amount: "5,396" },
          { room: "403", amount: "5,420" },
          { room: "502", amount: "6,010" },
        ].map((item, index) => (
          <div
            key={item.room}
            className="border border-gray-300 rounded overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <span className="text-lg font-bold text-blue-900">{item.room}</span>

              <button className="bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 transition">
                รายละเอียด
              </button>
            </div>

            <div className="px-4 py-2 bg-white text-gray-700">
              ค้างชำระทั้งหมด{" "}
              <span className="font-bold text-blue-800">{item.amount} บาท</span>{" "}
              (1 บิล)
            </div>
          </div>
        ))}

      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-2 mt-6">
        <button className="border px-4 py-1 rounded bg-white hover:bg-gray-100">
          หน้าก่อนหน้า
        </button>

        <button className="border px-4 py-1 rounded bg-blue-600 text-white">
          1
        </button>

        <button className="border px-4 py-1 rounded bg-white hover:bg-gray-100">
          หน้าถัดไป
        </button>
      </div>

    </div>
  );
}
