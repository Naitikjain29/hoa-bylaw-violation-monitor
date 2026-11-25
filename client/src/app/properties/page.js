"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Building2, Plus } from "lucide-react";

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    propertyNumber: "",
    propertyName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "single_family",
  });

  const loadProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get("/properties");
      setProperties(res.data.properties || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/properties", {
        propertyNumber: form.propertyNumber,
        propertyName: form.propertyName,
        propertyType: form.propertyType,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
        },
      });
      setShowForm(false);
      setForm({
        propertyNumber: "",
        propertyName: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        propertyType: "single_family",
      });
      await loadProperties();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create property");
    }
  };

  return (
    <ProtectedLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HOA Properties</h1>
          <p className="text-sm text-slate-500">Registered lots, homes, and owner assignments</p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <input
            required
            placeholder="Property Number (e.g. LOT-101)"
            value={form.propertyNumber}
            onChange={(e) => setForm({ ...form, propertyNumber: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Property Name"
            value={form.propertyName}
            onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.propertyType}
            onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="single_family">Single Family</option>
            <option value="townhouse">Townhouse</option>
            <option value="condo">Condo</option>
            <option value="commercial">Commercial</option>
          </select>
          <input
            required
            placeholder="Street Address"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="State / Zip"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Save Property
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-slate-500">Loading properties...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <div key={p._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-emerald-700">{p.propertyNumber}</span>
                <Building2 className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{p.propertyName}</h3>
              <p className="text-sm text-slate-600 mt-1">
                {p.address?.street}, {p.address?.city} {p.address?.state}
              </p>
              <p className="text-xs text-slate-500 mt-3">
                Owner: <strong>{p.owner?.fullName || "Unassigned"}</strong>
              </p>
            </div>
          ))}
        </div>
      )}
    </ProtectedLayout>
  );
}