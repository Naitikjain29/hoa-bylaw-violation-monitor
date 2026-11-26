"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, CheckCircle, XCircle, FileText, ShieldCheck } from "lucide-react";

export default function ViolationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [violation, setViolation] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [aiFile, setAiFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const loadViolation = async () => {
    try {
      const res = await api.get(`/violations/${id}`);
      setViolation(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViolation();
  }, [id]);

  const handleRunAi = async (e) => {
    e.preventDefault();
    if (!aiFile) return alert("Please select an image to analyze.");
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.append("evidenceImage", aiFile);
      await api.post(`/ai/analyze/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadViolation();
    } catch (err) {
      alert(err.response?.data?.message || "AI analysis failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    setActionLoading(true);
    try {
      await api.patch(`/violations/${id}/review`, { decision, reviewNotes });
      await loadViolation();
    } catch (err) {
      alert(err.response?.data?.message || "Review failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/violations/${id}/resolve`);
      await loadViolation();
    } catch (err) {
      alert(err.response?.data?.message || "Resolve failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueNotice = async () => {
    setActionLoading(true);
    try {
      await api.post(`/notices/violation/${id}`, {});
      alert("Official Violation Notice created!");
      router.push("/notices");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate notice");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <ProtectedLayout>Loading violation details...</ProtectedLayout>;
  if (!violation) return <ProtectedLayout>Violation not found.</ProtectedLayout>;

  const canReview = ["admin", "inspector"].includes(user?.role);
  const canNotice = ["admin", "board_member"].includes(user?.role);

  return (
    <ProtectedLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-800">
                Status: {violation.status.replace("_", " ")}
              </span>
              <span className="text-xs text-slate-500">
                Reported: {new Date(violation.createdAt).toLocaleString()}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {violation.category?.categoryName}
            </h1>
            <p className="text-sm text-slate-600 mb-4">
              Property: <strong>{violation.property?.propertyNumber}</strong> ({violation.property?.propertyName}) —{" "}
              {violation.location || "General Area"}
            </p>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-800">
              {violation.description}
            </div>

            {violation.evidenceImages?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Uploaded Street Evidence</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {violation.evidenceImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={`${backendUrl}${img}`}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-40 object-cover rounded-lg border border-slate-200"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg mb-4">
              <Sparkles className="w-5 h-5" />
              <span>Gemini Vision AI Inspection Report</span>
            </div>

            {violation.aiAnalysis?.analyzedAt ? (
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-4">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-md font-semibold">
                    Violation Detected: {violation.aiAnalysis.isViolationDetected ? "YES" : "NO"}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-md font-semibold">
                    Confidence: {violation.aiAnalysis.confidence}%
                  </span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-md font-semibold uppercase">
                    AI Severity: {violation.aiAnalysis.severity}
                  </span>
                </div>
                <p><strong>Suggestion:</strong> {violation.aiAnalysis.suggestion}</p>
                <p><strong>Observations:</strong> {violation.aiAnalysis.observations}</p>
                <p><strong>Reason:</strong> {violation.aiAnalysis.reason}</p>
                <p><strong>Inspector Recommendation:</strong> {violation.aiAnalysis.recommendation}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-4">No AI vision analysis run yet for this record.</p>
            )}

            <form
              onSubmit={handleRunAi}
              className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3"
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setAiFile(e.target.files[0])}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 flex-1"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {actionLoading ? "Analyzing..." : "Run Gemini AI Scan"}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {canReview && ["pending", "under_review"].includes(violation.status) && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Human-in-the-Loop Review</h2>
              <p className="text-xs text-slate-500 mb-4">
                Verify AI findings before confirming a bylaw violation.
              </p>
              <textarea
                rows={3}
                placeholder="Inspector review notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleDecision("confirmed")}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm
                </button>
                <button
                  onClick={() => handleDecision("dismissed")}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 py-2 rounded-lg text-sm font-semibold"
                >
                  <XCircle className="w-4 h-4" /> Dismiss
                </button>
              </div>
            </div>
          )}

          {violation.status === "confirmed" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Enforcement Actions</h2>
              {canNotice && (
                <button
                  onClick={handleIssueNotice}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold"
                >
                  <FileText className="w-4 h-4" /> Issue Citation Notice
                </button>
              )}
              {canReview && (
                <button
                  onClick={handleResolve}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold"
                >
                  <ShieldCheck className="w-4 h-4" /> Mark Violation Resolved
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}