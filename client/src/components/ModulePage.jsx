
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import AppShell from "@/components/AppShell";
import ProtectedPage from "@/components/ProtectedPage";
import api, { getErrorMessage } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const roleRules = {
  properties: ["admin", "board_member", "inspector", "homeowner"],
  categories: ["admin", "board_member", "inspector", "homeowner"],
  violations: ["admin", "board_member", "inspector", "homeowner"],
  inspections: ["admin", "board_member", "inspector"],
  notices: ["admin", "board_member", "homeowner"],
};

const titles = {
  properties: "Property Management",
  categories: "Violation Categories",
  violations: "Bylaw Violations",
  inspections: "Inspections",
  notices: "Official Notices",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500";

const buttonClass =
  "rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50";

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function addressText(address) {
  if (!address) return "Address unavailable";
  if (typeof address === "string") return address;

  return [
    address.street,
    address.city,
    address.state,
    address.zipCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function titleCase(value = "") {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Status({ value }) {
  const colors = {
    active: "bg-green-100 text-green-700",
    confirmed: "bg-green-100 text-green-700",
    resolved: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    compliant: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    scheduled: "bg-blue-100 text-blue-700",
    under_review: "bg-blue-100 text-blue-700",
    in_progress: "bg-blue-100 text-blue-700",
    issued: "bg-amber-100 text-amber-700",
    dismissed: "bg-red-100 text-red-700",
    inactive: "bg-slate-100 text-slate-600",
    cancelled: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        colors[value] || "bg-slate-100 text-slate-600"
      }`}
    >
      {titleCase(value || "unknown")}
    </span>
  );
}

function ModuleContent({ type }) {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin = role === "admin";
  const isBoard = role === "board_member";
  const isInspector = role === "inspector";
  const isHomeowner = role === "homeowner";

  const [items, setItems] = useState([]);
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  const [evidence, setEvidence] = useState([]);
  const [aiFiles, setAiFiles] = useState({});
  const [aiResults, setAiResults] = useState({});
  const [completeTarget, setCompleteTarget] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    findings: "",
    result: "compliant",
  });

  const [noticeTarget, setNoticeTarget] = useState(null);
  const [noticeForm, setNoticeForm] = useState({
    subject: "Official HOA Bylaw Violation Notice",
    message: "",
    dueDate: "",
  });

  const load = useCallback(async () => {
    setBusy(true);

    try {
      let endpoint = `/${type}`;

      if (type === "inspections" && isInspector) {
        endpoint = "/inspections/my";
      }

      if (type === "notices" && isHomeowner) {
        endpoint = "/notices/my";
      }

      const response = await api.get(endpoint);
      const payload = response.data;

      let list = [];

      if (type === "properties") {
        list = payload.properties || [];
      } else {
        list = payload.data || [];
      }

      setItems(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setItems([]);
    } finally {
      setBusy(false);
    }
  }, [type, isInspector, isHomeowner]);

  const loadOptions = useCallback(async () => {
    try {
      if (["violations", "inspections"].includes(type)) {
        const propertyResponse = await api.get("/properties");
        setProperties(propertyResponse.data.properties || []);
      }

      if (type === "violations") {
        const categoryResponse = await api.get("/categories?status=active");
        setCategories(categoryResponse.data.data || []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [type]);

  useEffect(() => {
    load();
    loadOptions();
  }, [load, loadOptions]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const query = search.toLowerCase();

      const text = [
        item.propertyName,
        item.propertyNumber,
        addressText(item.address),
        item.description,
        item.location,
        item.status,
        item.noticeNumber,
        item.subject,
        item.inspectionType,
        item.property?.propertyName,
        item.property?.propertyNumber,
        item.category?.categoryName,
        item.categoryName,
        item.owner?.fullName,
        item.homeownerName,
        item.reportedBy?.fullName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        text.includes(query) &&
        (statusFilter === "all" || item.status === statusFilter)
      );
    });
  }, [items, search, statusFilter]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setEvidence([]);

    const defaults = {
      properties: {
        propertyName: "",
        propertyNumber: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        owner: "",
        assignedInspector: "",
        propertyType: "single_family",
        description: "",
      },
      categories: {
        categoryName: "",
        description: "",
      },
      violations: {
        property: "",
        category: "",
        description: "",
        location: "",
        severity: "medium",
      },
      inspections: {
        propertyId: "",
        inspectorId: "",
        scheduledDate: "",
        inspectionType: "routine",
        notes: "",
      },
    };

    setForm(defaults[type] || {});
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      categoryName: item.categoryName || "",
      description: item.description || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({});
    setEvidence([]);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (type === "properties") {
        const payload = {
          propertyName: form.propertyName,
          propertyNumber: form.propertyNumber,
          address: {
            street: form.street,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
          },
          owner: form.owner,
          assignedInspector: form.assignedInspector || null,
          propertyType: form.propertyType,
          description: form.description,
        };

        if (editingId) {
          await api.put(`/properties/${editingId}`, payload);
        } else {
          await api.post("/properties", payload);
        }
      }

      if (type === "categories") {
        if (editingId) {
          await api.put(`/categories/${editingId}`, form);
        } else {
          await api.post("/categories", form);
        }
      }

      if (type === "violations") {
        const payload = new FormData();

        payload.append("property", form.property);
        payload.append("category", form.category);
        payload.append("description", form.description);
        payload.append("location", form.location || "");
        payload.append("severity", form.severity);

        evidence.forEach((file) => {
          payload.append("evidenceImages", file);
        });

        await api.post("/violations", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (type === "inspections") {
        await api.post("/inspections", {
          propertyId: form.propertyId,
          inspectorId: form.inspectorId,
          scheduledDate: new Date(form.scheduledDate).toISOString(),
          inspectionType: form.inspectionType,
          notes: form.notes,
        });
      }

      toast.success(editingId ? "Updated successfully" : "Created successfully");
      closeForm();
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deactivateProperty = async (id) => {
    if (!window.confirm("Deactivate this property?")) return;

    try {
      await api.delete(`/properties/${id}`);
      toast.success("Property deactivated");
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deactivateCategory = async (id) => {
    if (!window.confirm("Deactivate this category?")) return;

    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deactivated");
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const assignProperty = async (property) => {
    const owner = window.prompt(
      "Enter homeowner MongoDB ID. Leave blank to keep current owner.",
      property.owner?._id || ""
    );

    if (owner === null) return;

    const inspector = window.prompt(
      "Enter inspector MongoDB ID. Leave blank to remove inspector assignment.",
      property.assignedInspector?._id || ""
    );

    if (inspector === null) return;

    const payload = {};

    if (owner.trim()) payload.owner = owner.trim();
    if (!inspector.trim()) payload.assignedInspector = null;
    else payload.assignedInspector = inspector.trim();

    try {
      await api.patch(`/properties/${property._id}/assign`, payload);
      toast.success("Property assignment updated");
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const startReview = async (id) => {
    try {
      await api.patch(`/violations/${id}/start-review`);
      toast.success("Review started");
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const reviewViolation = async (id, decision) => {
    const reviewNotes = window.prompt("Enter review notes (optional):");

    if (reviewNotes === null) return;

    try {
      await api.patch(`/violations/${id}/review`, {
        decision,
        reviewNotes,
      });

      toast.success(`Violation ${decision}`);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const resolveViolation = async (id) => {
    if (!window.confirm("Mark this violation as resolved?")) return;

    try {
      await api.patch(`/violations/${id}/resolve`);
      toast.success("Violation resolved");
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const analyzeImage = async (violationId) => {
    const file = aiFiles[violationId];

    if (!file) {
      toast.error("Please select an image first");
      return;
    }

    const payload = new FormData();
    payload.append("evidenceImage", file);

    try {
      const response = await api.post(
        `/ai/analyze/${violationId}`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const result = response.data.data.aiAnalysis;

      setAiResults((current) => ({
        ...current,
        [violationId]: result,
      }));

      toast.success("AI analysis completed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getAIResult = async (violationId) => {
    try {
      const response = await api.get(`/ai/result/${violationId}`);

      setAiResults((current) => ({
        ...current,
        [violationId]: response.data.data.aiAnalysis,
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const startInspection = async (id) => {
    try {
      await api.patch(`/inspections/${id}/start`);
      toast.success("Inspection started");
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const completeInspection = async (event) => {
    event.preventDefault();

    if (!completeTarget) return;

    try {
      await api.patch(`/inspections/${completeTarget}/complete`, {
        findings: completeForm.findings,
        result: completeForm.result,
        checklist: [],
        evidenceImages: [],
      });

      toast.success("Inspection completed");
      setCompleteTarget(null);
      setCompleteForm({ findings: "", result: "compliant" });
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const cancelInspection = async (id) => {
    if (!window.confirm("Cancel this inspection?")) return;

    try {
      await api.patch(`/inspections/${id}/cancel`);
      toast.success("Inspection cancelled");
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const createNotice = async (event) => {
    event.preventDefault();

    if (!noticeTarget) return;

    try {
      const payload = {
        subject: noticeForm.subject,
        message: noticeForm.message,
      };

      if (noticeForm.dueDate) {
        payload.dueDate = new Date(noticeForm.dueDate).toISOString();
      }

      await api.post(
        `/notices/violation/${noticeTarget}`,
        payload
      );

      toast.success("Notice generated successfully");
      setNoticeTarget(null);
      setNoticeForm({
        subject: "Official HOA Bylaw Violation Notice",
        message: "",
        dueDate: "",
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const downloadPDF = async (id, noticeNumber) => {
    try {
      const response = await api.get(`/notices/${id}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `${noticeNumber || "notice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const renderForm = () => {
    if (!showForm) return null;

    return (
      <form
        onSubmit={submitForm}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? "Edit" : "Create"} {titles[type]}
          </h2>

          <button type="button" onClick={closeForm} className="text-sm text-slate-500">
            Close
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {type === "properties" && (
            <>
              <Field label="Property Name">
                <input className={inputClass} value={form.propertyName} onChange={(e) => updateForm("propertyName", e.target.value)} />
              </Field>

              <Field label="Property Number *">
                <input className={inputClass} required value={form.propertyNumber} onChange={(e) => updateForm("propertyNumber", e.target.value)} />
              </Field>

              <Field label="Street">
                <input className={inputClass} required value={form.street} onChange={(e) => updateForm("street", e.target.value)} />
              </Field>

              <Field label="City">
                <input className={inputClass} required value={form.city} onChange={(e) => updateForm("city", e.target.value)} />
              </Field>

              <Field label="State">
                <input className={inputClass} required value={form.state} onChange={(e) => updateForm("state", e.target.value)} />
              </Field>

              <Field label="ZIP Code">
                <input className={inputClass} required value={form.zipCode} onChange={(e) => updateForm("zipCode", e.target.value)} />
              </Field>

              <Field label="Homeowner MongoDB ID">
                <input className={inputClass} required value={form.owner} onChange={(e) => updateForm("owner", e.target.value)} placeholder="Enter homeowner ID" />
              </Field>

              <Field label="Inspector MongoDB ID (optional)">
                <input className={inputClass} value={form.assignedInspector} onChange={(e) => updateForm("assignedInspector", e.target.value)} placeholder="Enter inspector ID" />
              </Field>

              <Field label="Property Type">
                <select className={inputClass} value={form.propertyType} onChange={(e) => updateForm("propertyType", e.target.value)}>
                  <option value="single_family">Single Family</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="condominium">Condominium</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              <Field label="Description">
                <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
              </Field>
            </>
          )}

          {type === "categories" && (
            <>
              <Field label="Category Name">
                <input className={inputClass} required minLength={3} maxLength={100} value={form.categoryName} onChange={(e) => updateForm("categoryName", e.target.value)} />
              </Field>

              <Field label="Description">
                <textarea className={inputClass} required maxLength={500} rows={3} value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
              </Field>
            </>
          )}

          {type === "violations" && (
            <>
              <Field label="Property">
                <select className={inputClass} required value={form.property} onChange={(e) => updateForm("property", e.target.value)}>
                  <option value="">Select property</option>
                  {properties.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.propertyNumber} - {property.propertyName}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Category">
                <select className={inputClass} required value={form.category} onChange={(e) => updateForm("category", e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Severity">
                <select className={inputClass} value={form.severity} onChange={(e) => updateForm("severity", e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>

              <Field label="Location">
                <input className={inputClass} value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="e.g. Backyard, parking area" />
              </Field>

              <div className="md:col-span-2">
                <Field label="Violation Description">
                  <textarea className={inputClass} required minLength={10} maxLength={3000} rows={4} value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Evidence Images (maximum 5)">
                  <input className={inputClass} type="file" accept="image/*" multiple onChange={(e) => setEvidence(Array.from(e.target.files || []).slice(0, 5))} />
                </Field>
              </div>
            </>
          )}

          {type === "inspections" && (
            <>
              <Field label="Property">
                <select className={inputClass} required value={form.propertyId} onChange={(e) => updateForm("propertyId", e.target.value)}>
                  <option value="">Select property</option>
                  {properties.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.propertyNumber} - {property.propertyName}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Inspector MongoDB ID">
                <input className={inputClass} required value={form.inspectorId} onChange={(e) => updateForm("inspectorId", e.target.value)} placeholder="Enter inspector ID" />
              </Field>

              <Field label="Scheduled Date">
                <input className={inputClass} type="datetime-local" required value={form.scheduledDate} onChange={(e) => updateForm("scheduledDate", e.target.value)} />
              </Field>

              <Field label="Inspection Type">
                <select className={inputClass} value={form.inspectionType} onChange={(e) => updateForm("inspectionType", e.target.value)}>
                  <option value="routine">Routine</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="complaint">Complaint</option>
                  <option value="special">Special</option>
                </select>
              </Field>

              <div className="md:col-span-2">
                <Field label="Notes">
                  <textarea className={inputClass} rows={3} maxLength={2000} value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />
                </Field>
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">
            Cancel
          </button>

          <button className={buttonClass} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    );
  };

  const renderCard = (item) => {
    const id = item._id;

    if (type === "properties") {
      return (
        <article key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">{item.propertyName || "Unnamed Property"}</h3>
              <p className="mt-1 text-sm text-slate-500">Property No: {item.propertyNumber}</p>
            </div>
            <Status value={item.status} />
          </div>

          <p className="mt-4 text-sm text-slate-600">{addressText(item.address)}</p>
          <p className="mt-2 text-sm text-slate-600">Owner: {item.owner?.fullName || "—"}</p>
          <p className="mt-1 text-sm text-slate-600">Inspector: {item.assignedInspector?.fullName || "Not assigned"}</p>
          <p className="mt-1 text-sm text-slate-500">Type: {titleCase(item.propertyType)}</p>

          {isAdmin && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={buttonClass} onClick={() => assignProperty(item)}>Assign</button>
              <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => deactivateProperty(id)}>Deactivate</button>
            </div>
          )}
        </article>
      );
    }

    if (type === "categories") {
      return (
        <article key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-slate-900">{item.categoryName}</h3>
            <Status value={item.status} />
          </div>
          <p className="mt-3 text-sm text-slate-600">{item.description}</p>

          {isAdmin && (
            <div className="mt-4 flex gap-2">
              <button className={buttonClass} onClick={() => openEdit(item)}>Edit</button>
              <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => deactivateCategory(id)}>Deactivate</button>
            </div>
          )}
        </article>
      );
    }

    if (type === "violations") {
      const canReview = isAdmin || isInspector;
      const canReport = isAdmin || isInspector || isHomeowner;
      const canResolve = canReview && item.status === "confirmed";
      const canCreateNotice = (isAdmin || isBoard) && item.status === "confirmed";

      return (
        <article key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">{item.category?.categoryName || "Violation"}</h3>
              <p className="mt-1 text-xs text-slate-500">ID: {id}</p>
            </div>
            <Status value={item.status} />
          </div>

          <p className="mt-3 text-sm text-slate-700">{item.description}</p>

          <div className="mt-3 grid gap-1 text-sm text-slate-500">
            <p>Property: {item.property?.propertyName || item.property?.propertyNumber || "—"}</p>
            <p>Location: {item.location || "—"}</p>
            <p>Severity: <span className="font-semibold">{titleCase(item.severity)}</span></p>
            <p>Reported by: {item.reportedBy?.fullName || "—"}</p>
            <p>Created: {formatDate(item.createdAt)}</p>
          </div>

          {item.aiAnalysis?.analyzedAt && (
            <div className="mt-4 rounded-xl bg-violet-50 p-3 text-sm">
              <p className="font-bold text-violet-800">AI Analysis Available</p>
              <p className="mt-1 text-violet-700">{item.aiAnalysis.suggestion}</p>
              <p className="mt-1 text-violet-700">
                Confidence: {item.aiAnalysis.confidence}% · Severity: {titleCase(item.aiAnalysis.severity)}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {canReview && item.status === "pending" && (
              <button className={buttonClass} onClick={() => startReview(id)}>Start Review</button>
            )}

            {canReview && item.status === "under_review" && (
              <>
                <button className={buttonClass} onClick={() => reviewViolation(id, "confirmed")}>Confirm</button>
                <button className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600" onClick={() => reviewViolation(id, "dismissed")}>Dismiss</button>
              </>
            )}

            {canResolve && (
              <button className={buttonClass} onClick={() => resolveViolation(id)}>Resolve</button>
            )}

            {canCreateNotice && (
              <button className={buttonClass} onClick={() => setNoticeTarget(id)}>Generate Notice</button>
            )}

            {canReport && (
              <>
                <label className="cursor-pointer rounded-xl border px-3 py-2 text-sm">
                  Select AI Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAiFiles((current) => ({
                      ...current,
                      [id]: e.target.files?.[0] || null,
                    }))}
                  />
                </label>

                <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => analyzeImage(id)}>
                  Analyze with AI
                </button>

                <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => getAIResult(id)}>
                  View AI Result
                </button>
              </>
            )}
          </div>

          {aiResults[id] && (
            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm">
              <h4 className="font-bold text-violet-900">AI Analysis Result</h4>
              <p className="mt-2">Detected: {aiResults[id].isViolationDetected ? "Yes" : "No"}</p>
              <p>Suggestion: {aiResults[id].suggestion}</p>
              <p>Severity: {titleCase(aiResults[id].severity)}</p>
              <p>Confidence: {aiResults[id].confidence}%</p>
              <p>Observations: {aiResults[id].observations || "—"}</p>
              <p>Reason: {aiResults[id].reason || "—"}</p>
              <p>Recommendation: {aiResults[id].recommendation || "—"}</p>
            </div>
          )}
        </article>
      );
    }

    if (type === "inspections") {
      const canStart = (isAdmin || isInspector) && item.status === "scheduled";
      const canComplete = (isAdmin || isInspector) && item.status === "in_progress";
      const canCancel = (isAdmin || isBoard) && ["scheduled", "in_progress"].includes(item.status);

      return (
        <article key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">
                {item.property?.propertyName || item.property?.propertyNumber || "Property Inspection"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{titleCase(item.inspectionType)}</p>
            </div>
            <Status value={item.status} />
          </div>

          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p>Inspector: {item.inspector?.fullName || "—"}</p>
            <p>Scheduled: {formatDate(item.scheduledDate)}</p>
            <p>Notes: {item.notes || "—"}</p>
            {item.findings && <p>Findings: {item.findings}</p>}
            {item.result && <p>Result: {titleCase(item.result)}</p>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {canStart && (
              <button className={buttonClass} onClick={() => startInspection(id)}>Start Inspection</button>
            )}

            {canComplete && (
              <button className={buttonClass} onClick={() => setCompleteTarget(id)}>Complete Inspection</button>
            )}

            {canCancel && (
              <button className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600" onClick={() => cancelInspection(id)}>Cancel</button>
            )}
          </div>
        </article>
      );
    }

    if (type === "notices") {
      return (
        <article key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">{item.subject}</h3>
              <p className="mt-1 text-xs text-slate-500">{item.noticeNumber}</p>
            </div>
            <Status value={item.status} />
          </div>

          <p className="mt-3 text-sm text-slate-700">{item.message}</p>

          <div className="mt-3 space-y-1 text-sm text-slate-500">
            <p>Homeowner: {item.homeownerName}</p>
            <p>Property: {item.propertyName} ({item.propertyNumber})</p>
            <p>Category: {item.categoryName || "—"}</p>
            <p>Severity: {titleCase(item.severity)}</p>
            <p>Issued: {formatDate(item.issuedAt)}</p>
            <p>Due: {formatDate(item.dueDate)}</p>
          </div>

          <button className={`${buttonClass} mt-4`} onClick={() => downloadPDF(id, item.noticeNumber)}>
            Download PDF
          </button>
        </article>
      );
    }

    return null;
  };

  const canCreate =
    (type === "properties" && isAdmin) ||
    (type === "categories" && isAdmin) ||
    (type === "violations" && (isAdmin || isInspector || isHomeowner)) ||
    (type === "inspections" && (isAdmin || isBoard));

  const statuses = {
    properties: ["active", "inactive"],
    categories: ["active", "inactive"],
    violations: ["pending", "under_review", "confirmed", "dismissed", "resolved"],
    inspections: ["scheduled", "in_progress", "completed", "cancelled"],
    notices: ["issued", "acknowledged", "closed"],
  };

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-600">HOA Management</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
                {titles[type]}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage and monitor {type} for your community.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  load();
                  loadOptions();
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Refresh
              </button>

              {canCreate && (
                <button onClick={openCreate} className={buttonClass}>
                  + Add New
                </button>
              )}
            </div>
          </div>

          {renderForm()}

          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              className={inputClass}
              placeholder={`Search ${type}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className={inputClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {(statuses[type] || []).map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </div>

          {busy ? (
            <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
              Loading {type}...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <h3 className="font-bold text-slate-800">No records found</h3>
              <p className="mt-2 text-sm text-slate-500">
                There are no matching {type} records.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(renderCard)}
            </div>
          )}

          {completeTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <form onSubmit={completeInspection} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-bold">Complete Inspection</h2>

                <Field label="Findings">
                  <textarea
                    className={inputClass}
                    required
                    maxLength={5000}
                    rows={5}
                    value={completeForm.findings}
                    onChange={(e) => setCompleteForm((current) => ({
                      ...current,
                      findings: e.target.value,
                    }))}
                  />
                </Field>

                <div className="mt-4">
                  <Field label="Result">
                    <select
                      className={inputClass}
                      value={completeForm.result}
                      onChange={(e) => setCompleteForm((current) => ({
                        ...current,
                        result: e.target.value,
                      }))}
                    >
                      <option value="compliant">Compliant</option>
                      <option value="violation_found">Violation Found</option>
                    </select>
                  </Field>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setCompleteTarget(null)}>Cancel</button>
                  <button className={buttonClass}>Submit</button>
                </div>
              </form>
            </div>
          )}

          {noticeTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <form onSubmit={createNotice} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-bold">Generate Official Notice</h2>

                <div className="space-y-4">
                  <Field label="Subject">
                    <input
                      className={inputClass}
                      required
                      value={noticeForm.subject}
                      onChange={(e) => setNoticeForm((current) => ({
                        ...current,
                        subject: e.target.value,
                      }))}
                    />
                  </Field>

                  <Field label="Message">
                    <textarea
                      className={inputClass}
                      rows={4}
                      maxLength={3000}
                      value={noticeForm.message}
                      onChange={(e) => setNoticeForm((current) => ({
                        ...current,
                        message: e.target.value,
                      }))}
                    />
                  </Field>

                  <Field label="Due Date (optional)">
                    <input
                      className={inputClass}
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={noticeForm.dueDate}
                      onChange={(e) => setNoticeForm((current) => ({
                        ...current,
                        dueDate: e.target.value,
                      }))}
                    />
                  </Field>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className="rounded-xl border px-4 py-2" onClick={() => setNoticeTarget(null)}>Cancel</button>
                  <button className={buttonClass}>Generate Notice</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}

export default function ModulePage({ type, roles }) {
  const allowedRoles = roles || roleRules[type] || [];

  return (
    <ProtectedPage roles={allowedRoles}>
      <ModuleContent type={type} />
    </ProtectedPage>
  );
}
