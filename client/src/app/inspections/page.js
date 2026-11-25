"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { ClipboardCheck, Plus } from "lucide-react";

export default function InspectionsPage() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    property: "",
    scheduledDate: "",
    inspectionType: "routine",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [inspRes, propRes] = await Promise.all([
        api.get("/inspections"),
        api.get("/properties"),
      ]);
      setInspections(inspRes.data.data || inspRes.data.inspections || []);
      setProperties(propRes.data.properties || propRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/inspections", form);
      setShowForm(false);
      setForm({
        property: "",
        scheduledDate: "",
        inspectionType: "routine",
        notes: "",
      });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to schedule inspection");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/inspections/${id}`, { status });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update inspection");
    }
  };

  return (
    <ProtectedLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Property Inspections</h1>
          <p className="text-sm text-slate-500">Scheduled & completed community bylaw checks</p>
        </div>
        {["admin", "inspector", "board_member"].includes(user?.role) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Schedule Inspection
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Property</label>
            <select
              required
              value={form.property}
              onChange={(e) => setForm({ ...form, property: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Select Property --</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.propertyNumber} - {p.propertyName || p.address?.street}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
            <input
              type="date"
              required
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Inspection Type</label>
            <select
              value={form.inspectionType}
              onChange={(e) => setForm({ ...form, inspectionType: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="routine">Routine</option>
              <option value="follow_up">Follow-up</option>
              <option value="complaint">Complaint Based</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder="Optional inspection notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Save Inspection
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-slate-500">Loading inspections...</div>
      ) : inspections.length === 0 ? (
        <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-500">
          No inspections scheduled yet.
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((item) => (
            <div
              key={item._id}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-900">
                    {item.property?.propertyNumber} — {item.property?.propertyName || "Property"}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold uppercase rounded-full bg-slate-100 text-slate-800">
                    {item.status || "scheduled"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Type: <strong className="capitalize">{item.inspectionType?.replace("_", " ") || "routine"}</strong> | Date:{" "}
                  <strong>{item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : "N/A"}</strong>
                </p>
                {item.notes && <p className="text-xs text-slate-500 mt-1">{item.notes}</p>}
              </div>

              {["admin", "inspector"].includes(user?.role) && item.status !== "completed" && (
                <button
                  onClick={() => handleStatusUpdate(item._id, "completed")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium self-start md:self-auto"
                >
                  Mark Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </ProtectedLayout>
  );
}