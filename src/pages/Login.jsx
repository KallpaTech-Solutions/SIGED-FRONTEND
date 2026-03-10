import { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn, TreePine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext"; // 👈 IMPORTAMOS EL CONTEXTO

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // 👇 EXTRAEMOS LA FUNCIÓN DE LOGIN DEL CONTEXTO
  const { login, user } = useAuth(); 

  // Redirigir si ya está logueado oficialmente
  useEffect(() => {
    if (user) {
      navigate("/PanelControl"); // ✅ Redirigir siempre a la ruta oficial
    }
  }, [user, navigate]);

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
      login(response.data);

    } catch (err) {
      setError(err.response?.data?.message || "DNI o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-border">
          
          <div className="bg-linear-to-r from-primary to-secondary p-8 text-primary-foreground">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center animate-scale-in">
                <TreePine className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center tracking-tight font-montserrat uppercase">
              SIGED UNAS
            </h1>
            <p className="text-center text-primary-foreground/90 text-sm mt-2 font-inter">
              Sistema de Gestión de Eventos Deportivos
            </p>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-bold text-foreground mb-6 text-center font-montserrat">
              Iniciar Sesión
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5 font-inter">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-scale-in">
                  <p className="text-xs text-destructive font-semibold text-center">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
                  DNI / Usuario
                </label>
                <input
                  type="text"
                  placeholder="Ingresa tu DNI"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-linear-to-r from-primary to-secondary text-primary-foreground rounded-lg font-bold hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    <span className="font-montserrat">INGRESAR</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                <span className="font-bold text-foreground italic">¿Problemas de acceso?</span><br />
                Contacta a la OTI o al Comité Deportivo para restablecer tu cuenta.
              </p>
            </div>
          </div>

          <div className="px-8 py-3 bg-muted border-t border-border">
            <p className="text-center text-[10px] text-muted-foreground uppercase font-semibold">
              © 2026 Universidad Nacional Agraria de la Selva
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}