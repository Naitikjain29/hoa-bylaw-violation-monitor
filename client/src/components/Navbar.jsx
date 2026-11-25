"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Tags,
  LogOut,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "board_member", "inspector", "homeowner"] },
    { href: "/violations", label: "Violations & AI", icon: AlertTriangle, roles: ["admin", "board_member", "inspector", "homeowner"] },
    { href: "/properties", label: "Properties", icon: Building2, roles: ["admin", "board_member", "inspector", "homeowner"] },
    { href: "/inspections", label: "Inspections", icon: ClipboardCheck, roles: ["admin", "board_member", "inspector"] },
    { href: "/notices", label: "Citations & Notices", icon: FileText, roles: ["admin", "board_member", "homeowner"] },
    { href: "/categories", label: "Bylaw Categories", icon: Tags, roles: ["admin"] },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-emerald-400">
              <ShieldAlert className="w-6 h-6" />
              <span>HOA Visual Monitor</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              {allowedItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user.fullName}</p>
              <p className="text-xs text-emerald-400 uppercase tracking-wider">{user.role.replace("_", " ")}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 bg-slate-800 hover:bg-red-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}