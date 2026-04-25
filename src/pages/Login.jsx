import { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff, LogIn, TreePine } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext"; // 👈 IMPORTAMOS EL CONTEXTO
import { useToast } from "../context/ToastContext";
import {
  parseSafeReturnUrl,
  POST_LOGIN_REDIRECT_KEY,
} from "../utils/returnUrl";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isPasswordValid = password.length >= 8;

  /** Prioridad: ?returnUrl= (p. ej. Navbar) · respaldo sessionStorage (p. ej. flujo inscripción). */
  const effectiveReturnUrl = useMemo(() => {
    const fromQuery = parseSafeReturnUrl(searchParams.get("returnUrl"));
    if (fromQuery) return fromQuery;
    try {
      return parseSafeReturnUrl(sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY));
    } catch {
      return null;
    }
  }, [searchParams]);

  // 👇 EXTRAEMOS LA FUNCIÓN DE LOGIN DEL CONTEXTO
  const { login, user } = useAuth(); 

  // Redirigir si ya está logueado oficialmente
  useEffect(() => {
    if (user) {
      navigate(effectiveReturnUrl || "/PanelControl", { replace: true });
    }
  }, [user, navigate, effectiveReturnUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/Auth/login", {
        username: username,
        password: password
      });

      // 👇 DELEGAMOS TODO EL TRABAJO AL AUTHCONTEXT 👇
      // Él decidirá si entra al Dashboard o si lo manda a /security/update-password
      login(response.data, effectiveReturnUrl || undefined);

    } catch (err) {
      setError(err.response?.data?.message || "DNI o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 bg-slate-50 flex items-center justify-center px-4 py-8 animate-fade-in font-inter">
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-[0_18px_50px_rgba(15,23,42,0.16)] overflow-hidden border-2 border-emerald-400 bg-emerald-100">
          {/* Header institucional */}
          <div className="bg-emerald-50/80 border-b-2 border-emerald-200 px-8 pt-7 pb-5">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-center animate-scale-in text-emerald-600">
                <TreePine className="w-7 h-7" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-emerald-600/90">
                Acceso institucional
              </p>
              <h1 className="text-2xl font-bold tracking-tight font-montserrat uppercase text-slate-900">
                SIGED UNAS
              </h1>
              <p className="text-xs text-slate-500">
                Sistema de Gestión de Eventos Deportivos
              </p>
            </div>
          </div>

          <div className="p-8 bg-white">
            <h2 className="text-lg font-bold text-slate-900 mb-6 text-center font-montserrat tracking-wide">
              Iniciar sesión
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5 font-inter">
              {error && (
                <div className="p-3 bg-destructive/10 border-2 border-destructive/30 rounded-lg animate-scale-in">
                  <p className="text-xs text-destructive font-semibold text-center">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-2 tracking-[0.18em]">
                  DNI / Usuario
                </label>
                <input
                  type="text"
                  placeholder="Ingresa tu DNI"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-2 tracking-[0.18em]">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // 🚫 Bloquea el "Pegar" (Ctrl+V o menú contextual)
                  onPaste={(e) => {
                    e.preventDefault();
                    toast(
                      "Por seguridad, no se permite pegar la contraseña. Escríbela manualmente.",
                      "warning"
                    );
                  }}
                  // 🚫 Bloquea el clic derecho para que no puedan usar el menú "Pegar" del navegador
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                  required
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <p className="mt-1 text-[11px] text-slate-500">
                  La contraseña debe tener al menos{" "}
                  <span className="font-semibold text-slate-900">8 caracteres</span>.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold border-2 border-emerald-600 hover:bg-emerald-400 hover:border-emerald-500 hover:shadow-[0_18px_40px_rgba(16,185,129,0.25)] hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs tracking-[0.22em] uppercase"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-200 border-t-transparent rounded-full animate-spin" />
                    <span className="font-montserrat tracking-[0.2em] text-[11px]">
                      Ingresando...
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span className="font-montserrat">INGRESAR</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
              <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                <span className="font-bold text-slate-900 italic">¿Problemas de acceso?</span><br />
                Contacta a la OTI o al Comité Deportivo para restablecer tu cuenta.
              </p>
            </div>
          </div>

          <div className="px-8 py-3 bg-slate-50 border-t border-slate-200">
            <p className="text-center text-[10px] text-slate-400 uppercase font-semibold tracking-[0.2em]">
              © 2026 Universidad Nacional Agraria de la Selva
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}