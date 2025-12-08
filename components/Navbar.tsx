"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  // Fetch user on first load & when session changes
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  return (
    <nav className="bg-blue-800 text-white px-6 py-3 flex items-center">
      <span className="font-bold text-xl mr-8">Sanguansap</span>
      <div className="ml-auto">
        {email ? email : ""}
      </div>
    </nav>
  );
}
