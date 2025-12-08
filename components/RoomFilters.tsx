"use client";

interface RoomFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilters: string[];
  onStatusToggle: (status: string) => void;
}

const STATUS_OPTIONS = ["Available", "Reserved", "Unavailable", "Renovate"];

export function RoomFilters({ searchQuery, onSearchChange, statusFilters, onStatusToggle }: RoomFiltersProps) {
  return (
    <div className="bg-white rounded shadow p-4 mb-6 flex flex-col md:flex-row items-center gap-4">
      <div className="flex-grow">
        <input
          type="text"
          placeholder="ค้นหาห้องด้วยชื่อ..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {STATUS_OPTIONS.map(status => (
          <button
            key={status}
            onClick={() => onStatusToggle(status)}
            className={`px-3 py-1 text-sm font-semibold rounded-full border transition whitespace-nowrap ${statusFilters.includes(status)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}