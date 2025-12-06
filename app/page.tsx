"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    // Clear old errors
    setError("");

    // Frontend validation
    if (!email.trim() || !password.trim()) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      router.push("/dashboard");

    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e0f2fe] font-sans">
      <div className="bg-white rounded-lg shadow-md flex w-full max-w-5xl overflow-hidden">

        {/* Left: Login Form */}
        <div className="flex-1 p-8 flex flex-col justify-center">

          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
            Saguan Sap Mansion
          </h2>

          <h3 className="text-lg font-semibold mb-6 text-blue-800 text-center">
            เข้าสู่ระบบ
          </h3>

          <div className="flex flex-col gap-4">

            {/* Email */}
            <input
              type="email"
              placeholder="อีเมล"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Password */}
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Error Box */}
            {error && (
              <div className="text-red-600 bg-red-100 border border-red-300 px-3 py-2 rounded text-sm text-center">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-2/3 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-full mt-2 mx-auto transition text-center"
            >
              LOG IN
            </button>

          </div>
        </div>

        {/* Right: Image */}
        <div className="flex-1 bg-blue-300 flex flex-col items-center justify-center">
          <img
            src="/HomePage.jpg"
            alt="Logo"
            className="h-full aspect-square rounded my-5 object-cover"
          />
        </div>

      </div>
    </div>
  );
}
