import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Loader2, Trophy } from "lucide-react";
import {
  fetchCompetitionChampionsByYear,
  fetchPublicDisciplines,
} from "../../api/tournamentsPublicService";

function normId(row) {
  return String(row?.competitionId ?? row?.CompetitionId ?? "");
}

export default function CampeonesPublicPage() {
  const defaultYear = new Date().getFullYear();
  const [year, setYear] = useState(defaultYear);
  const [disciplineId, setDisciplineId] = useState("");
  const [disciplines, setDisciplines] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const yearOptions = useMemo(() => {
    const y = defaultYear;
    return Array.from({ length: 8 }, (_, i) => y - 3 + i);
  }, [defaultYear]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchPublicDisciplines();
        if (!cancelled) setDisciplines(list);
      } catch {
        if (!cancelled) setDisciplines([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCompetitionChampionsByYear({
          year,
          disciplineId: disciplineId || undefined,
        });
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(
            e?.response?.data?.message ||
              "No se pudo cargar el listado de campeones."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year, disciplineId]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-white text-slate-900 font-inter">
      <section className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border-b border-border/20 py-10 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link
            to="/torneos"
            className="inline-flex items-center gap-2 text-amber-100/90 hover:text-white text-sm font-semibold mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Torneos
          </Link>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-400/20 p-3 border border-amber-400/30">
              <Trophy className="w-8 h-8 text-amber-300" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-200/90 mb-1">
                Público · vitrina
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Campeones por competencia
              </h1>
              <p className="mt-2 text-sm text-amber-50/90 max-w-2xl leading-relaxed">
                Equipos campeones registrados al cerrar cada competencia. Podés filtrar por año
                del torneo y por disciplina.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex-1 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl py-8 md:py-10 space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-xs text-slate-600">
              <span className="block font-semibold text-slate-500 mb-1">Año del torneo</span>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium min-w-[8rem]"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-600 min-w-[12rem] flex-1 max-w-xs">
              <span className="block font-semibold text-slate-500 mb-1">Disciplina</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
              >
                <option value="">Todas</option>
                {disciplines.map((d) => {
                  const id = d.id ?? d.Id;
                  const name = d.name ?? d.Name ?? String(id);
                  return (
                    <option key={id} value={String(id)}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-slate-500 py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              Cargando campeones…
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <p className="text-sm text-slate-600 py-8 text-center rounded-2xl border border-dashed border-slate-200 bg-white px-4">
              No hay campeones registrados para este año
              {disciplineId ? " y esta disciplina" : ""}. Cuando una competencia cierre con
              campeón definido, aparecerá aquí.
            </p>
          )}

          {!loading && rows.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm text-left min-w-[32rem]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-bold">Campeón</th>
                    <th className="px-4 py-3 font-bold">Competencia</th>
                    <th className="px-4 py-3 font-bold">Torneo</th>
                    <th className="px-4 py-3 font-bold w-28"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => {
                    const cid = normId(r);
                    const compHref = cid ? `/torneos/${cid}` : "/torneos";
                    return (
                      <tr key={cid || `${r.championTeamName}-${r.categoryName}`} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                              {r.championTeamLogoUrl ? (
                                <img
                                  src={r.championTeamLogoUrl}
                                  alt=""
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <Trophy className="w-5 h-5 text-amber-600" aria-hidden />
                              )}
                            </div>
                            <span className="font-semibold text-slate-900">
                              {r.championTeamName ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="text-slate-500">{r.disciplineName ?? "—"}</span>
                          {r.categoryName ? (
                            <span className="block text-xs text-slate-500 mt-0.5">
                              {r.categoryName}
                              {r.gender ? ` · ${r.gender}` : ""}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {r.tournamentName ?? "—"}{" "}
                          <span className="text-slate-400 tabular-nums">
                            ({r.tournamentYear ?? year})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={compHref}
                            className="inline-flex text-xs font-bold text-emerald-700 hover:text-emerald-900"
                          >
                            Ver competencia →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
