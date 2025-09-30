import Navbar from "@/components/Navbar";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="bg-white rounded shadow p-8">
          <p>Welcome! This is your dashboard page.</p>
        </div>
      </main>
    </div>
  );
}