"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/services/api";
import { PlusCircle, Sparkles, Eye } from "lucide-react";

export default function ViolationsListPage() {
  const [violations, setViolations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const res = await api.get(`/violations${query}`);
      setViolations(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [statusFilter]);

  const badgeColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-red-100 text-red-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "under_review":
        return "bg-blue-100 text-blue-700";
      case "resolved":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <ProtectedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bylaw Violations</h1>
          <p className="text-sm text-slate-500">AI-detected & human-verified community infractions</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="dismissed">Dismissed</option>
            <option value="resolved">Resolved</option>
          </select>
          <Link
            href="/violations/new"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            New Violation
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading violations...</div>
      ) : violations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-500">
          No violations found for the selected filter.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">AI Scan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {violations.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {v.property?.propertyNumber} - {v.property?.propertyName || "Lot"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{v.category?.categoryName}</td>
                  <td className="px-6 py-4 text-sm uppercase font-semibold text-slate-700">{v.severity}</td>
                  <td className="px-6 py-4 text-sm">
                    {v.aiAnalysis?.analyzedAt ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        <Sparkles className="w-3 h-3" /> {v.aiAnalysis.confidence}% Conf.
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Not Scanned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${badgeColor(v.status)}`}>
                      {v.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link
                      href={`/violations/${v._id}`}
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium"
                    >
                      <Eye className="w-4 h-4" /> Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ProtectedLayout>
  );
}