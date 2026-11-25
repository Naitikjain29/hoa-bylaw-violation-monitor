"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/services/api";

export default function NewViolationPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    property: "",
    category: "",
    description: "",
    location: "",
    severity: "medium",
  });
  const [files, setFiles] = useState([]);
  const [runAiImmediately, setRunAiImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/properties"), api.get("/categories?status=active")]).then(
      ([propRes, catRes]) => {
        setProperties(propRes.data.properties || []);
        setCategories(catRes.data.data || []);
      }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("property", form.property);
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("location", form.location);
      fd.append("severity", form.severity);
      for (let i = 0; i < files.length; i++) {
        fd.append("evidenceImages", files[i]);
      }

      const res = await api.post("/violations", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const createdViolation = res.data.data;

      if (runAiImmediately && files.length > 0) {
        const aiFd = new FormData();
        aiFd.append("evidenceImage", files[0]);
        await api.post(`/ai/analyze/${createdViolation._id}`, aiFd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      router.push(`/violations/${createdViolation._id}`);
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          "Failed to report violation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Report & Scan Property Violation</h1>
        <p className="text-sm text-slate-500 mb-6">
          Upload street-level evidence for Gemini Vision AI evaluation
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Property</label>
            <select
              required
              value={form.property}
              onChange={(e) => setForm({ ...form, property: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="">-- Select Property --</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.propertyNumber} - {p.propertyName} ({p.address?.street})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bylaw Category</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="">-- Select Category --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specific Location</label>
              <input
                type="text"
                placeholder="e.g. Front lawn / Driveway"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (min 10 chars)
            </label>
            <textarea
              required
              minLength={10}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the observed bylaw violation..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Evidence Photos (up to 5)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={runAiImmediately}
              onChange={(e) => setRunAiImmediately(e.target.checked)}
              className="rounded text-emerald-600"
            />
            Run Gemini Vision AI Analysis automatically on primary image
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {submitting ? "Submitting & Analyzing..." : "Submit Violation Report"}
          </button>
        </form>
      </div>
    </ProtectedLayout>
  );
}