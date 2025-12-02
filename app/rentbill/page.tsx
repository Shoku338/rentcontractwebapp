export default function page() {
    return (
    <div>
       <div className="bg-white rounded shadow p-6 flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-4 md:mb-0">เลือกรอบบิลค่าเช่า</h1>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value="ตุลาคม/2025"
            className="border border-blue-300 rounded px-3 py-2 text-blue-900"
            readOnly
          />
          <button className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition">
            คู่มือการใช้งาน
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition">
            ดาวน์โหลด Excel
          </button>
        </div>
      </div>
      <div>
        
      </div>
    </div>
    );
}