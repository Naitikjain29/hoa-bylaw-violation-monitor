
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiHome,
  FiUsers,
  FiGrid,
  FiAlertTriangle,
  FiClipboard,
  FiFileText,
  FiLogOut,
  FiMenu,
  FiX
} from "react-icons/fi";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: FiHome,
    roles: ["admin", "inspector", "board_member", "homeowner"]
  },
  {
    label: "Properties",
    href: "/admin/properties",
    icon: FiGrid,
    roles: ["admin", "inspector", "board_member", "homeowner"]
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FiClipboard,
    roles: ["admin", "board_member", "inspector", "homeowner"]
  },
  {
    label: "Violations",
    href: "/violations",
    icon: FiAlertTriangle,
    roles: ["admin", "inspector", "board_member", "homeowner"]
  },
  {
    label: "Inspections",
    href: "/inspections",
    icon: FiClipboard,
    roles: ["admin", "inspector", "board_member"]
  },
  {
    label: "Notices",
    href: "/notices",
    icon: FiFileText,
    roles: ["admin", "board_member", "homeowner"]
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: FiUsers,
    roles: ["admin"]
  }
];

export default function AppShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = user?.role;

  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(role)
  );

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-5 py-4 lg:hidden">
        <h1 className="text-lg font-bold text-blue-800">
          HOA Monitor
        </h1>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="border-b border-slate-200 px-6 py-6">
            <h1 className="text-xl font-extrabold text-blue-800">
              HOA Monitor
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Bylaw Violation Management
            </p>
          </div>

          <div className="border-b border-slate-200 px-5 py-4">
            <p className="font-semibold text-slate-800">
              {user?.fullName || user?.name || "User"}
            </p>
            <p className="mt-1 text-xs capitalize text-slate-500">
              {role?.replace("_", " ") || "Member"}
            </p>
          </div>

          <nav className="space-y-1 p-4">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 w-full border-t border-slate-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <FiLogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {menuOpen && (
          <button
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="hidden items-center justify-between border-b border-slate-200 bg-white px-8 py-5 lg:flex">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
