"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const baseTools = [
  { label: "ผังห้อง", href: "/dashboard", icon: "🏢" },
  { label: "จดมิเตอร์", href: "/meter", icon: "⏱️" },
  { label: "บิลค่าเช่า", href: "/rentbill", icon: "📄" },
  { label: "จ่ายบิล", href: "/paybill", icon: "💸" },
];
const adminTool = { label: "จัดการผู้ใช้", href: "/admin/users", icon: "👥" };

interface ToolbarProps {
  userRole?: string;
}

export default function Toolbar({ userRole }: ToolbarProps) {
  const pathname = usePathname();

  const tools = userRole === "admin" 
    ? [...baseTools, adminTool] 
    : baseTools;

  return (
    <nav className="bg-gray-800 px-2 py-2 flex gap-2 overflow-x-auto justify-center">
      {tools.map((tool) => {
        const selected = pathname === tool.href;
        return (
          <Link
            key={tool.href}
            href={tool.href}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded transition
              ${selected ? "bg-blue-200 text-blue-900 font-bold" : "bg-gray-700 text-blue-200 hover:bg-gray-600"}
            `}
          >
            <span className="text-2xl mb-1">{tool.icon}</span>
            <span className="text-xs">{tool.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}