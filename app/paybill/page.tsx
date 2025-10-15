"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e0f2fe] font-sans">
      <div className="bg-white rounded-lg shadow-md flex w-full max-w-5xl overflow-hidden">
        {/* Left: Login Form */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Saguan Sap Mansion</h2>
          <h3 className="text-lg font-semibold mb-6 text-blue-800 text-center">เข้าสู่ระบบ</h3>
          <div className="flex flex-col gap-4" >
            <input
              type="text"
              placeholder="เบอร์โทรศัพท์"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="รหัสผ่าน"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Link href="/dashboard"
              className="w-2/3 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-full mt-2 mx-auto transition text-center"
            >
              LOG IN
            </Link>
          </div>
        </div>
        {/* Right: Logo */}
        <div className="flex-1  bg-blue-300 flex flex-col items-center justify-center">
          <img src="/HomePage.jpg" alt="Logo" className="h-full aspect-square rounded my-5" />
          {/* Optional: Add a tagline or image below the logo */}
        </div>
      </div>
    </div>
  );
}