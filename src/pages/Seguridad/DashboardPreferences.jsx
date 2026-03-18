import React, { useState, useEffect } from "react";
import { Save, CheckCircle2, Circle } from "lucide-react";
import api from "../../api/axiosConfig";
import { useToast } from "../../context/ToastContext";

export default function DashboardPreferences() {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const options = [
    { id: "usuarios", label: "Usuarios Totales", icon: "👥" },
    { id: "orgs", label: "Facultades / Sedes", icon: "🏫" },
    { id: "activos", label: "Sesiones Activas", icon: "⚡" },
    { id: "recent", label: "Actividad Reciente", icon: "🕒" },
  ];

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await api.get("/Preferences/my-config");
        const raw = res.data?.widgetsVisibles;
        if (typeof raw === "string" && raw.trim().length > 0) {
          setSelected(
            raw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          );
        } else {
          // Si no hay nada guardado, mostramos todos por defecto
          setSelected(options.map((o) => o.id));
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error cargando preferencias de dashboard:", err);
        // Fallback: todos activos
        setSelected(options.map((o) => o.id));
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, []);

  const handleToggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.post("/Preferences/update", selected);
      toast("Panel actualizado correctamente", "success");
    } catch (err) {
      toast("Error al guardar la configuración del dashboard", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-slate-950 border border-slate-800/70 p-6 animate-pulse h-48" />
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 shadow-[0_24px_70px_rgba(15,23,42,0.9)] p-6 space-y-5 text-slate-50 font-inter">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300/80 mb-1">
            Panel Maestro · Preferencias
          </p>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Qué quieres ver en tu inicio
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
            Activa o desactiva los bloques del resumen ejecutivo de tu dashboard. Tus
            elecciones se guardan solo para tu cuenta.
          </p>
        </div>
      </header>

      <div className="space-y-2">
        {options.map((opt) => {
          const isActive = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleToggle(opt.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-200 ${
                isActive
                  ? "border-emerald-400/70 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(45,212,191,0.35)]"
                  : "border-slate-700 bg-slate-900/70 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{opt.icon}</span>
                <span className="font-semibold text-sm text-slate-100">
                  {opt.label}
                </span>
              </div>
              {isActive ? (
                <CheckCircle2 className="text-emerald-400" />
              ) : (
                <Circle className="text-slate-600" />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={saveConfig}
        disabled={saving}
        className="w-full py-3.5 mt-5 rounded-2xl bg-emerald-400 text-slate-950 font-bold text-[11px] uppercase tracking-[0.22em] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 hover:bg-emerald-300 hover:shadow-emerald-400/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Save size={18} />
        {saving ? "Guardando..." : "Aplicar cambios"}
      </button>
    </div>
  );
}

