"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  // Load current user
  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setEmail(user?.email ?? null);
  }

  useEffect(() => {
    loadUser();

    // Listen for login event
    const handleUserLoggedIn = () => {
      loadUser();
    };

    window.addEventListener("userLoggedIn", handleUserLoggedIn);

    return () => {
      window.removeEventListener("userLoggedIn", handleUserLoggedIn);
    };
  }, []);

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail(null);
    router.push("/"); // Go to the login page
  };

  return (
    <nav className="bg-blue-800 text-white px-6 py-3 flex items-center">
      <span className="font-bold text-xl mr-8">Sanguansap</span>
      <div className="ml-auto flex items-center space-x-4">
        {email ? (
          <>
            <span className="text-sm">{email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
            >
              Log Out
            </button>
          </>
        ) : (
          <span className="text-sm">Not logged in</span>
        )}
      </div>
    </nav>
  );
}
