"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/services/api";
import { Plus, Tags } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    categoryName: "",
    description: "",
    defaultFineAmount: 100,
    cureDays: 7,
    status: "active",
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/categories", {
        categoryName: form.categoryName,
        description: form.description,
        defaultFineAmount: Number(form.defaultFineAmount),
        cureDays: Number(form.cureDays),
        status: form.status,
      });
      setShowForm(false);
      setForm({
        categoryName: "",
        description: "",
        defaultFineAmount: 100,
        cureDays: 7,
        status: "active",
      });
      await loadCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create category");
    }
  };

  return (
    <ProtectedLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bylaw Categories</h1>
          <p className="text-sm text-slate-500">Rules, default fine amounts, and cure periods</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input
            required
            placeholder="Category Name (e.g. Overgrown Lawn)"
            value={form.categoryName}
            onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            required
            placeholder="Default Fine ($)"
            value={form.defaultFineAmount}
            onChange={(e) => setForm({ ...form, defaultFineAmount: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="1"
            required
            placeholder="Cure Period (Days)"
            value={form.cureDays}
            onChange={(e) => setForm({ ...form, cureDays: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <textarea
            required
            rows={2}
            placeholder="Bylaw description and visual guidelines..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="sm:col-span-2 border rounded-lg px-3 py-2 text-sm"
          />
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Save Category
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-slate-500">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold uppercase rounded-full bg-emerald-50 text-emerald-700">
                  {cat.status || "active"}
                </span>
                <Tags className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{cat.categoryName}</h3>
              <p className="text-sm text-slate-600 mt-1">{cat.description}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Fine: <strong>${cat.defaultFineAmount ?? 0}</strong></span>
                <span>Cure: <strong>{cat.cureDays ?? 7} days</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProtectedLayout>
  );
}