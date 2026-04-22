import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trophy,
  Calendar,
  ImagePlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { createTournament } from "../../api/tournamentsAdminService";

export default function TorneoCreatePage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const canManage = can("tourn.manage");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [form, setForm] = useState({
    name: "",
    year: currentYear,
    startDate: "",
    endDate: "",
    organizer: "",
    description: "",
    logoFile: null,
  });

  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Indica el nombre del torneo.";
    if (!form.year || form.year < 1900 || form.year > 2100)
      e.year = "Año no válido.";
    if (!form.startDate) e.startDate = "Indica la fecha de inicio.";
    if (!form.endDate) e.endDate = "Indica la fecha de fin.";
    if (form.startDate && form.endDate) {
      const a = new Date(form.startDate);
      const b = new Date(form.endDate);
      if (a > b) e.endDate = "La fecha de fin debe ser posterior al inicio.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const goBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("Name", form.name.trim());
      fd.append("Year", String(form.year));
      if (form.description?.trim())
        fd.append("Description", form.description.trim());
      fd.append("StartDate", new Date(form.startDate).toISOString());
      fd.append("EndDate", new Date(form.endDate).toISOString());
      if (form.organizer?.trim())
        fd.append("Organizer", form.organizer.trim());
      if (form.logoFile) fd.append("LogoFile", form.logoFile);

      await createTournament(fd);
      toast("Torneo creado correctamente.", "success");
      navigate("/PanelControl/torneos");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo crear el torneo.";
      toast(
        typeof msg === "string" ? msg : "Error al crear el torneo.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <p className="text-amber-900 font-semibold text-sm">
          No tenés permiso para crear torneos. Hace falta permiso de{" "}
          <strong>administración de torneos</strong>.
        </p>
        <Link
          to="/PanelControl/torneos"
          className="inline-flex mt-4 text-sm font-bold text-emerald-700 hover:underline"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/PanelControl/torneos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Torneos
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          <span
            className={
              step === 1
                ? "text-emerald-600"
                : "text-slate-400"
            }
          >
            1 · Datos
          </span>
          <span className="text-slate-300">/</span>
          <span
            className={
              step === 2
                ? "text-emerald-600"
                : "text-slate-400"
            }
          >
            2 · Revisión
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-emerald-900 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Trophy className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Nuevo torneo institucional
              </h1>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Paso {step} de 2 — los datos se envían al crear al final.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nombre del torneo *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                  placeholder="Ej. Torneo Interfacultades UNAS 2026"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Año *
                </label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.year}
                  onChange={(e) =>
                    setField("year", parseInt(e.target.value, 10) || currentYear)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                />
                {errors.year && (
                  <p className="text-xs text-red-600 mt-1">{errors.year}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Organizador
                </label>
                <input
                  type="text"
                  value={form.organizer}
                  onChange={(e) => setField("organizer", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                  placeholder="Ej. OTI / Bienestar Universitario"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Inicio *
                </label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                />
                {errors.startDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Fin *
                </label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                />
                {errors.endDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.endDate}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none resize-y min-h-[88px]"
                  placeholder="Opcional — reglas generales, público objetivo…"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  <ImagePlus className="w-3.5 h-3.5" />
                  Logo del torneo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setField("logoFile", e.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Opcional — se sube al servidor (multipart).
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-sm">
              <p className="text-slate-500 text-xs">
                Revisá los datos antes de confirmar. Después podrás agregar
                competencias y fases desde el detalle del torneo (próximos pasos).
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <div>
                  <dt className="text-[10px] font-bold uppercase text-slate-400">
                    Nombre
                  </dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {form.name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase text-slate-400">
                    Año
                  </dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {form.year}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase text-slate-400">
                    Vigencia
                  </dt>
                  <dd className="font-medium text-slate-800 mt-0.5">
                    {form.startDate
                      ? new Date(form.startDate).toLocaleString("es-PE")
                      : "—"}{" "}
                    →{" "}
                    {form.endDate
                      ? new Date(form.endDate).toLocaleString("es-PE")
                      : "—"}
                  </dd>
                </div>
                {form.organizer?.trim() && (
                  <div className="sm:col-span-2">
                    <dt className="text-[10px] font-bold uppercase text-slate-400">
                      Organizador
                    </dt>
                    <dd className="text-slate-800 mt-0.5">{form.organizer}</dd>
                  </div>
                )}
                {form.description?.trim() && (
                  <div className="sm:col-span-2">
                    <dt className="text-[10px] font-bold uppercase text-slate-400">
                      Descripción
                    </dt>
                    <dd className="text-slate-700 mt-0.5 whitespace-pre-wrap">
                      {form.description}
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase text-slate-400">
                    Logo
                  </dt>
                  <dd className="text-slate-700 mt-0.5">
                    {form.logoFile ? form.logoFile.name : "Sin archivo"}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {step === 2 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
            ) : (
              <span />
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-sm"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando…
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4" />
                    Crear torneo
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
