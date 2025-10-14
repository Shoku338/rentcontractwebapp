export default function MeterPage() {
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      {/* Header */}
      <div className="bg-white rounded shadow p-6 flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-4 md:mb-0">เลือกรอบจดมิเตอร์</h1>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value="ตุลาคม/2025"
            className="border border-blue-300 rounded px-3 py-2 text-blue-900"
            readOnly
          />
          <button className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition">
            ดาวน์โหลด Excel
          </button>
        </div>
      </div>

      {/* Titles */}
      <div className="flex gap-4 mb-6 rounded-full overflow-hidden ">
        
        <h2 className="flex-1 bg-blue-600 text-white font-bold py-3 text-center rounded-r-full">
          🛠️ จดมิเตอร์ไฟฟ้า
        </h2>
      </div>

      {/* Floor 1 */}
      <div className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-blue-900 mb-4">ชั้นที่ 1</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100 text-blue-900">
              <th className="p-2 border">ห้อง</th>
              <th className="p-2 border">สถานะห้อง</th>
              <th className="p-2 border">อื่นๆ</th>
              <th className="p-2 border">เลขมิเตอร์เดือน<br/>(กันยายน/2025)</th>
              <th className="p-2 border">🛠️ เลขมิเตอร์เดือน<br/>(ตุลาคม/2025)</th>
              <th className="p-2 border">หน่วยที่ใช้</th>
            </tr>
          </thead>
          <tbody>
            {[101, 102, 103].map((room, i) => (
              <tr key={room} className="text-center">
                <td className="border p-2">{room}</td>
                <td className="border p-2">👤</td>
                <td className="border p-2">≡</td>
                <td className="border p-2">{i === 2 ? 6851 : 3765 + i}</td>
                <td className="border p-2 bg-blue-100">
                  <span className="mr-2">🛠️</span>
                  <input
                    type="number"
                    value={0}
                    className="bg-blue-50 border border-blue-300 rounded px-2 py-1 w-16 text-blue-900"
                    readOnly
                  />
                </td>
                <td className="border p-2">
                  <span className="bg-red-500 text-white px-3 py-1 rounded">
                    -{i === 2 ? 6851 : 3765 + i}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floor 2 (example) */}
      <div className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-blue-900 mb-4">ชั้นที่ 2</h2>
        {/* Repeat table structure for other floors */}
      </div>
    </div>
  );
}