"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Download, Send } from "lucide-react";

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notices");
      setNotices(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/notices/${id}/status`, { status });
      await loadNotices();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update notice");
    }
  };

  const handleDownloadPdf = async (noticeId, noticeNumber) => {
    try {
      const res = await api.get(`/notices/${noticeId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${noticeNumber || "notice"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("PDF download failed");
    }
  };

  return (
    <ProtectedLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Citation Notices & Fine Letters</h1>
        <p className="text-sm text-slate-500">Official HOA notices, cure deadlines, and downloadable PDFs</p>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-500">
          No notices found.
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div
              key={n._id}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">{n.noticeNumber}</span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold uppercase rounded-full bg-amber-100 text-amber-800">
                    {n.status}
                  </span>
                  <span className="text-sm font-semibold text-emerald-700">Fine: ${n.fineAmount || 0}</span>
                </div>
                <p className="text-sm text-slate-700 font-medium mt-1">{n.subject}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Property: {n.property?.propertyNumber} | Due: {n.dueDate ? new Date(n.dueDate).toLocaleDateString() : "N/A"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(n._id, n.noticeNumber)}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg text-sm font-medium"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>

                {["admin", "board_member"].includes(user?.role) && n.status === "draft" && (
                  <button
                    onClick={() => handleStatusChange(n._id, "issued")}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    <Send className="w-4 h-4" /> Issue Notice
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ProtectedLayout>
  );
}