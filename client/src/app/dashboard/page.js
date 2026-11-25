"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, Building2, ClipboardCheck, FileText, PlusCircle } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.fullName}</h1>
          <p className="text-slate-500 text-sm">Overview of HOA Bylaw Monitoring & Enforcement</p>
        </div>
        {["admin", "inspector", "homeowner"].includes(user?.role) && (
          <Link
            href="/violations/new"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition"
          >
            <PlusCircle className="w-5 h-5" />
            Report / Scan Violation
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-slate-500">Loading statistics...</div>
      ) : !stats ? (
        <div className="text-red-500">Failed to load dashboard data.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.properties && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Properties</span>
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.properties.total}</p>
            </div>
          )}

          {stats.violations && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  {stats.violations.reported !== undefined ? "Reported Violations" : "Total Violations"}
                </span>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-3xl font-bold mt-2">
                {stats.violations.total ?? stats.violations.reported}
              </p>
              {stats.violations.pending !== undefined && (
                <p className="text-xs text-slate-500 mt-2">
                  Pending: {stats.violations.pending} | Confirmed: {stats.violations.confirmed} | Resolved: {stats.violations.resolved}
                </p>
              )}
            </div>
          )}

          {stats.inspections && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Inspections</span>
                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold mt-2">
                {stats.inspections.total ?? stats.inspections.assigned}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Completed: {stats.inspections.completed}
              </p>
            </div>
          )}

          {stats.notices && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Official Notices</span>
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.notices.total}</p>
              <p className="text-xs text-slate-500 mt-2">Issued: {stats.notices.issued}</p>
            </div>
          )}
        </div>
      )}
    </ProtectedLayout>
  );
}