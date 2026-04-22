import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsuariosPage from "./pages/Usuarios/UsuariosPage";
import FirstAccessValidation from "./pages/Seguridad/FirstAccessValidation";
import UsuarioDetalle from "./pages/Usuarios/UsuarioDetalle";
import SuperAdminSummary from "./pages/Inicio/SuperAdminSummary";
import ConfiguracionPage from "./pages/Seguridad/ConfiguracionPage";
import TorneosPage from "./pages/Torneos/TorneosPage";
import TorneoCreatePage from "./pages/Torneos/TorneoCreatePage";
import TorneoDetallePage from "./pages/Torneos/TorneoDetallePage";
import CompetenciaFixtureSetupPage from "./pages/Torneos/CompetenciaFixtureSetupPage";
import TorneoMesaPartidosPage from "./pages/Torneos/TorneoMesaPartidosPage";
import DisciplinasAdminPage from "./pages/Torneos/DisciplinasAdminPage";
import DisciplinaCreatePage from "./pages/Torneos/DisciplinaCreatePage";
import DisciplinaReglasPage from "./pages/Torneos/DisciplinaReglasPage";
import DisciplinaDetallePage from "./pages/Torneos/DisciplinaDetallePage";
import DisciplinaEditPage from "./pages/Torneos/DisciplinaEditPage";
import TorneosPublicPage from "./pages/Torneos/TorneosPublicPage";
import CompetenciaPublicaPage from "./pages/Torneos/CompetenciaPublicaPage";
import TorneoPublicoDetallePage from "./pages/Torneos/TorneoPublicoDetallePage";
import EquipoPublicoPage from "./pages/Torneos/EquipoPublicoPage";
import TorneoInscripcionPage from "./pages/Torneos/TorneoInscripcionPage";
import EquiposPlantelesAdminPage from "./pages/Torneos/EquiposPlantelesAdminPage";
import DelegadoGestionEquiposPage from "./pages/Torneos/DelegadoGestionEquiposPage";
import PartidoPublicoPage from "./pages/Torneos/PartidoPublicoPage";
import SedesAdminPage from "./pages/Torneos/SedesAdminPage";
import CalendarioPage from "./pages/Calendario/CalendarioPage";
import OrganizacionesPage from "./pages/Organizaciones/OrganizacionesPage";
import EstudianteSummary from "./pages/Inicio/EstudianteSummary";
import DelegadoSummary from "./pages/Inicio/DelegadoSummary";
import EncargadoSummary from "./pages/Inicio/EncargadoSummary";
import OrganizacionDetail from "./pages/Organizaciones/OrganizacionDetail";
import NoticiasPage from "./pages/Noticias/NoticiasPage";
import NoticiaDetalle from "./pages/Noticias/NoticiaDetalle";
import NoticiasAdminPage from "./pages/Noticias/NoticiasAdminPage";
import NoticiasAdminForm from "./pages/Noticias/NoticiasAdminForm";

const DashboardHome = () => {
  const { user, can } = useAuth();

  const rol = user?.rol?.toUpperCase();

  if (rol === "SUPERADMIN" || rol === "ADMIN") {
    return <SuperAdminSummary />;
  }

  if (rol === "ENCARGADO") {
    return <EncargadoSummary />;
  }

  if (rol === "ESTUDIANTE") {
    return <EstudianteSummary />;
  }

  const esDelegadoTorneo =
    rol === "DELEGADO_ESCUELA" ||
    rol === "DELEGADO" ||
    (can("tourn.team.manage") &&
      !can("tourn.manage") &&
      rol !== "ESTUDIANTE");

  if (esDelegadoTorneo) {
    return <DelegadoSummary />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center max-w-lg mx-auto shadow-sm">
      <p className="text-slate-800 font-semibold">Bienvenido al panel SIGED</p>
      <p className="text-sm text-slate-600 mt-2">
        Tu rol ({user?.rol ? String(user.rol) : "sin definir"}) no tiene un
        resumen específico en esta pantalla. Usá el menú lateral para acceder a
        los módulos habilitados.
      </p>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ConfirmProvider>
          <ToastProvider>
            <Navbar />
            <main className="min-h-screen">
              <Routes>
                {/* Rutas Públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/Seguridad/update-password"
                  element={<FirstAccessValidation />}
                />
                <Route path="/noticias" element={<NoticiasPage />} />
                <Route path="/noticia/:slug" element={<NoticiaDetalle />} />
                <Route path="/torneos" element={<TorneosPublicPage />} />
                <Route
                  path="/torneos/torneo/:tournamentId/inscripcion"
                  element={<TorneoInscripcionPage />}
                />
                <Route
                  path="/torneos/torneo/:tournamentId"
                  element={<TorneoPublicoDetallePage />}
                />
                <Route
                  path="/torneos/partido/:matchId"
                  element={<PartidoPublicoPage />}
                />
                <Route
                  path="/torneos/equipo/:teamId"
                  element={<EquipoPublicoPage />}
                />
                <Route path="/torneos/:id" element={<CompetenciaPublicaPage />} />
                <Route path="/calendario" element={<CalendarioPage />} />

                {/* --- 🟢 PANEL ÚNICO (Consolidado y Protegido) --- */}
                <Route
                  path="/PanelControl/*"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardHome />} />

                  {/* Gestión de Usuarios */}
                  <Route path="usuarios" element={<UsuariosPage />} />
                  <Route path="usuarios/:id" element={<UsuarioDetalle />} />

                  {/* Gestión de Organizaciones (Facultades) */}
                  <Route
                    path="organizaciones"
                    element={<OrganizacionesPage />}
                  />
                  <Route
                    path="organizaciones/:id"
                    element={<OrganizacionDetail />}
                  />

                  {/* Gestión de Noticias */}
                  <Route path="noticias" element={<NoticiasAdminPage />} />
                  <Route path="noticias/crear" element={<NoticiasAdminForm />} />
                  <Route path="noticias/:id" element={<NoticiasAdminForm />} />

                  {/* Otros Módulos */}
                  <Route path="torneos" element={<TorneosPage />} />
                  <Route
                    path="gestion-equipos"
                    element={<DelegadoGestionEquiposPage />}
                  />
                  <Route
                    path="gestion-equipos/torneo/:tournamentId/inscripcion"
                    element={<TorneoInscripcionPage />}
                  />
                  <Route
                    path="torneos/equipos"
                    element={<EquiposPlantelesAdminPage />}
                  />
                  <Route path="torneos/sedes" element={<SedesAdminPage />} />
                  <Route path="torneos/nuevo" element={<TorneoCreatePage />} />
                  <Route
                    path="torneos/:tournamentId/competencias/:competitionId/fixture"
                    element={<CompetenciaFixtureSetupPage />}
                  />
                  <Route
                    path="torneos/:tournamentId/mesa"
                    element={<TorneoMesaPartidosPage />}
                  />
                  <Route path="torneos/:id" element={<TorneoDetallePage />} />
                  <Route path="disciplinas" element={<DisciplinasAdminPage />} />
                  <Route
                    path="disciplinas/nuevo"
                    element={<DisciplinaCreatePage />}
                  />
                  <Route
                    path="disciplinas/:disciplineId/editar"
                    element={<DisciplinaEditPage />}
                  />
                  <Route
                    path="disciplinas/:disciplineId/reglas"
                    element={<DisciplinaReglasPage />}
                  />
                  <Route
                    path="disciplinas/:disciplineId"
                    element={<DisciplinaDetallePage />}
                  />
                  <Route path="configuracion" element={<ConfiguracionPage />} />
                </Route>

                {/* Redirecciones y Errores */}
                <Route
                  path="/dashboard"
                  element={<Navigate to="/PanelControl" replace />}
                />

                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <Footer />
          </ToastProvider>
        </ConfirmProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;