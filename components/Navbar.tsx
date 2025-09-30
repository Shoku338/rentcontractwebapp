import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-blue-800 text-white px-6 py-3 flex items-center">
      <span className="font-bold text-xl mr-8">Sanguansap</span>
      <Link href="/dashboard" className="mr-4 hover:underline">Dashboard</Link>
      {/* Add more links as needed */}
      <div className="ml-auto">Username ***</div>
    </nav>
  );
}