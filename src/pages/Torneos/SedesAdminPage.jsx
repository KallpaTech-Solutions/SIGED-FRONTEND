import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  MapPin,
  Building2,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import {
  createVenue,
  createVenueComplex,
  deleteVenue,
  deleteVenueComplex,
  fetchVenueComplexesAdmin,
  fetchVenuesAdmin,
  updateVenue,
} from "../../api/venuesAdminService";

function complexLabel(c) {
  return c?.name ?? c?.Name ?? "—";
}

function venueComplexName(v) {
  const cx = v?.complex ?? v?.Complex;
  return cx ? complexLabel(cx) : "—";
}

const emptyVenueForm = () => ({
  id: null,
  name: "",
  address: "",
  capacity: 0,
  complexId: "",
});

const emptyComplexForm = () => ({
  name: "",
  address: "",
  description: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  mapUrl: "",
  openingHoursNote: "",
  isActive: true,
});

export default function SedesAdminPage() {
  const { can } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const canManage = can("tourn.manage");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [venues, setVenues] = useState([]);
  const [complexes, setComplexes] = useState([]);
  const [venueForm, setVenueForm] = useState(emptyVenueForm);
  const [complexForm, setComplexForm] = useState(emptyComplexForm);
  const [venueSaving, setVenueSaving] = useState(false);
  const [complexSaving, setComplexSaving] = useState(false);
  const [busyVenueId, setBusyVenueId] = useState(null);
  const [busyComplexId, setBusyComplexId] = useState(null);

  const reload = useCallback(async () => {
    const [v, c] = await Promise.all([
      fetchVenuesAdmin(),
      fetchVenueComplexesAdmin({ onlyActive: false }),
    ]);
    setVenues(v);
    setComplexes(c);
  }, []);

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await reload();
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "No se pudieron cargar sedes y complejos."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canManage, reload]);

  const handleVenueSubmit = async (e) => {
    e.preventDefault();
    if (!canManage || venueSaving) return;
    const name = venueForm.name.trim();
    if (!name) {
      toast("El nombre de la cancha o sede es obligatorio.", "error");
      return;
    }
    const capacity = Math.max(0, Number(venueForm.capacity) || 0);
    const address = venueForm.address.trim() || null;
    const complexId = venueForm.complexId ? venueForm.complexId : null;
    const payload = { name, address, capacity, complexId };
    setVenueSaving(true);
    try {
      if (venueForm.id) {
        await updateVenue(venueForm.id, payload);
        toast("Sede actualizada.", "success");
      } else {
        await createVenue(payload);
        toast("Sede creada. Ya podés usarla al programar partidos.", "success");
      }
      setVenueForm(emptyVenueForm());
      await reload();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo guardar la sede.",
        "error"
      );
    } finally {
      setVenueSaving(false);
    }
  };

  const handleEditVenue = (v) => {
    const id = v.id ?? v.Id;
    setVenueForm({
      id: String(id),
      name: String(v.name ?? v.Name ?? ""),
      address: String(v.address ?? v.Address ?? ""),
      capacity: Number(v.capacity ?? v.Capacity ?? 0),
      complexId: (() => {
        const cid = v.complexId ?? v.ComplexId;
        return cid ? String(cid) : "";
      })(),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteVenue = async (v) => {
    const id = v.id ?? v.Id;
    const label = v.name ?? v.Name ?? "esta sede";
    const ok = await confirm({
      title: "Eliminar sede",
      message: `¿Eliminar «${label}»? No debe tener partidos programados.`,
      confirmText: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    setBusyVenueId(String(id));
    try {
      await deleteVenue(id);
      toast("Sede eliminada.", "success");
      if (venueForm.id === String(id)) setVenueForm(emptyVenueForm());
      await reload();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo eliminar.",
        "error"
      );
    } finally {
      setBusyVenueId(null);
    }
  };

  const handleComplexSubmit = async (e) => {
    e.preventDefault();
    if (!canManage || complexSaving) return;
    const name = complexForm.name.trim();
    if (!name) {
      toast("El nombre del complejo es obligatorio.", "error");
      return;
    }
    setComplexSaving(true);
    try {
      await createVenueComplex({
        name,
        address: complexForm.address.trim() || null,
        description: complexForm.description.trim() || null,
        contactName: complexForm.contactName.trim() || null,
        contactPhone: complexForm.contactPhone.trim() || null,
        contactEmail: complexForm.contactEmail.trim() || null,
        mapUrl: complexForm.mapUrl.trim() || null,
        openingHoursNote: complexForm.openingHoursNote.trim() || null,
        isActive: !!complexForm.isActive,
      });
      toast("Complejo creado. Podés asociar canchas abajo.", "success");
      setComplexForm(emptyComplexForm());
      await reload();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo crear el complejo.",
        "error"
      );
    } finally {
      setComplexSaving(false);
    }
  };

  const handleDeleteComplex = async (c) => {
    const id = c.id ?? c.Id;
    const label = complexLabel(c);
    const ok = await confirm({
      title: "Eliminar complejo",
      message: `¿Eliminar «${label}»? No debe tener canchas asociadas.`,
      confirmText: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    setBusyComplexId(String(id));
    try {
      await deleteVenueComplex(id);
      toast("Complejo eliminado.", "success");
      await reload();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo eliminar.",
        "error"
      );
    } finally {
      setBusyComplexId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        No tenés permiso para administrar sedes. Contactá a un administrador de
        torneos.
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/PanelControl/torneos"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Torneos
          </Link>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Sedes y canchas
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Alta de <strong>canchas o espacios</strong> donde se juegan los
            partidos (nombre, dirección, aforo y complejo opcional). Estas sedes
            aparecen al programar fecha y hora en cada partido.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-sm font-semibold">Cargando…</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-10 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Canchas / sedes de juego
            </h3>
            <form onSubmit={handleVenueSubmit} className="space-y-3">
              {venueForm.id && (
                <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Editando sede existente. Guardá para aplicar cambios o{" "}
                  <button
                    type="button"
                    className="underline font-bold"
                    onClick={() => setVenueForm(emptyVenueForm())}
                  >
                    cancelar edición
                  </button>
                  .
                </p>
              )}
              <label className="block text-xs">
                <span className="text-slate-600">Nombre de la cancha o sede</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={venueForm.name}
                  onChange={(e) =>
                    setVenueForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ej. Losa 1, Campo auxiliar"
                  required
                />
              </label>
              <label className="block text-xs">
                <span className="text-slate-600">Dirección (opcional)</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={venueForm.address}
                  onChange={(e) =>
                    setVenueForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </label>
              <label className="block text-xs">
                <span className="text-slate-600">Aforo / capacidad (0 si no aplica)</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full max-w-[200px] rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                  value={venueForm.capacity}
                  onChange={(e) =>
                    setVenueForm((f) => ({
                      ...f,
                      capacity: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block text-xs">
                <span className="text-slate-600">Complejo (opcional)</span>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={venueForm.complexId}
                  onChange={(e) =>
                    setVenueForm((f) => ({ ...f, complexId: e.target.value }))
                  }
                >
                  <option value="">— Sin complejo —</option>
                  {complexes.map((c) => {
                    const cid = c.id ?? c.Id;
                    return (
                      <option key={cid} value={String(cid)}>
                        {complexLabel(c)}
                      </option>
                    );
                  })}
                </select>
              </label>
              <button
                type="submit"
                disabled={venueSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {venueSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {venueForm.id ? "Guardar cambios" : "Dar de alta sede"}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Listado ({venues.length})
              </p>
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto">
                {venues.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-slate-400">
                    Todavía no hay sedes. Creá la primera con el formulario de
                    arriba.
                  </li>
                )}
                {venues.map((v) => {
                  const id = v.id ?? v.Id;
                  const cap = v.capacity ?? v.Capacity ?? 0;
                  return (
                    <li
                      key={id}
                      className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-white hover:bg-slate-50/80"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {v.name ?? v.Name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {venueComplexName(v)} · Aforo {cap}
                          {(v.address ?? v.Address) && (
                            <span className="block truncate mt-0.5">
                              {v.address ?? v.Address}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditVenue(v)}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVenue(v)}
                          disabled={busyVenueId === String(id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"
                          title="Eliminar"
                        >
                          {busyVenueId === String(id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Complejos deportivos (opcional)
            </h3>
            <p className="text-xs text-slate-500">
              Agrupá varias canchas bajo un mismo predio (ej. «Polideportivo
              UNAS»). Podés crear canchas sin complejo.
            </p>
            <ul className="text-sm space-y-2 max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50/80">
              {complexes.length === 0 && (
                <li className="text-slate-400 italic">Ninguno aún.</li>
              )}
              {complexes.map((c) => {
                const id = c.id ?? c.Id;
                const active = c.isActive ?? c.IsActive;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium text-slate-800 truncate">
                      {complexLabel(c)}
                      {!active && (
                        <span className="ml-2 text-[10px] text-amber-700 font-bold uppercase">
                          inactivo
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteComplex(c)}
                      disabled={busyComplexId === String(id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"
                      title="Eliminar si no tiene canchas"
                    >
                      {busyComplexId === String(id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <form onSubmit={handleComplexSubmit} className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Nuevo complejo
              </p>
              <label className="block text-xs">
                <span className="text-slate-600">Nombre</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={complexForm.name}
                  onChange={(e) =>
                    setComplexForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ej. Polideportivo central"
                  required
                />
              </label>
              <label className="block text-xs">
                <span className="text-slate-600">Dirección</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={complexForm.address}
                  onChange={(e) =>
                    setComplexForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </label>
              <label className="block text-xs">
                <span className="text-slate-600">Descripción</span>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[72px]"
                  value={complexForm.description}
                  onChange={(e) =>
                    setComplexForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-xs">
                  <span className="text-slate-600">Contacto</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={complexForm.contactName}
                    onChange={(e) =>
                      setComplexForm((f) => ({
                        ...f,
                        contactName: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-xs">
                  <span className="text-slate-600">Teléfono</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={complexForm.contactPhone}
                    onChange={(e) =>
                      setComplexForm((f) => ({
                        ...f,
                        contactPhone: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="block text-xs">
                <span className="text-slate-600">Correo de contacto</span>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={complexForm.contactEmail}
                  onChange={(e) =>
                    setComplexForm((f) => ({
                      ...f,
                      contactEmail: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block text-xs">
                <span className="text-slate-600">Enlace a mapa (URL)</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={complexForm.mapUrl}
                  onChange={(e) =>
                    setComplexForm((f) => ({ ...f, mapUrl: e.target.value }))
                  }
                  placeholder="https://…"
                />
              </label>
              <label className="block text-xs">
                <span className="text-slate-600">Horarios / notas</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={complexForm.openingHoursNote}
                  onChange={(e) =>
                    setComplexForm((f) => ({
                      ...f,
                      openingHoursNote: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={complexForm.isActive}
                  onChange={(e) =>
                    setComplexForm((f) => ({
                      ...f,
                      isActive: e.target.checked,
                    }))
                  }
                />
                Activo (visible en listados que filtran por activos)
              </label>
              <button
                type="submit"
                disabled={complexSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 disabled:opacity-50"
              >
                {complexSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Crear complejo
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
