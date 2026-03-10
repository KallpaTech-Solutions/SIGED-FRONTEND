import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Navbar from "./components/layout/Navbar"; 
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsuariosPage from "./pages/Usuarios/UsuariosPage";
import FirstAccessValidation from './pages/Seguridad/FirstAccessValidation';
import UsuarioDetalle from './pages/Usuarios/UsuarioDetalle';
import SuperAdminSummary from './pages/Inicio/SuperAdminSummary'; 
import ConfiguracionPage from "./pages/Seguridad/ConfiguracionPage";
import TorneosPage from './pages/Torneos/TorneosPage';
import OrganizacionesPage from './pages/Organizaciones/OrganizacionesPage';
import EstudianteSummary from './pages/Inicio/EstudianteSummary';
import EncargadoSummary from './pages/Inicio/EncargadoSummary';
// 👈 Importamos el nuevo componente de detalles
import OrganizacionDetail from './pages/Organizaciones/OrganizacionDetail'; 

const DashboardHome = () => {
  const { user } = useAuth();
  
  // Normalizamos a mayúsculas para comparar seguro
  const rol = user?.rol?.toUpperCase();

  if (rol === 'SUPERADMIN' || rol === 'ADMIN') {
    return <SuperAdminSummary />;
  }

  if (rol === 'ENCARGADO') {
    return <EncargadoSummary />;
  }

  if (rol === 'ESTUDIANTE') {
    return <EstudianteSummary />;
  }

  return (
    <div className="p-10 text-center font-bold text-slate-400 animate-pulse">
      IDENTIFICANDO PERFIL DE USUARIO...
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
            <Route path="/Seguridad/update-password" element={<FirstAccessValidation />} />
            
            {/* --- 🟢 PANEL ÚNICO (Consolidado y Protegido) --- */}
            <Route path="/PanelControl" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
              <Route index element={<DashboardHome />} /> 
              
              {/* Gestión de Usuarios */}
              <Route path="usuarios" element={<UsuariosPage />} />
              <Route path="usuarios/:id" element={<UsuarioDetalle />} />
              
              {/* Gestión de Organizaciones (Facultades) */}
              <Route path="organizaciones" element={<OrganizacionesPage />} />
              <Route path="organizaciones/:id" element={<OrganizacionDetail />} /> 
              
              {/* Otros Módulos */}
              <Route path="torneos" element={<TorneosPage />} />
              <Route path="configuracion" element={<ConfiguracionPage />} />
            </Route>

            {/* Redirecciones y Errores */}
            <Route path="/dashboard" element={<Navigate to="/PanelControl" replace />} />
            
            {/* 💡 Si en el futuro quieres que los estudiantes vean la info sin loguearse, 
                puedes habilitar esta ruta pública también: */}
            {/* <Route path="/portal/organizaciones/:id" element={<OrganizacionDetail />} /> */}

            <Route path="*" element={<Home />} />
          </Routes>
        </main>
          </ToastProvider>
        </ConfirmProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;