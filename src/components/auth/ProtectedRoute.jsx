import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // 👈 ¡ESTA ES LA LÍNEA QUE FALTA!

export const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    // 1. Mientras el AuthContext verifica el token, no mostramos nada (evita rebotes)
    if (loading) return null; 

    // 2. Si no hay usuario, al login
    if (!user) {
        return <Navigate to="/login" />;
    }

    // 3. Validación de Roles (Normalizada a mayúsculas para evitar errores)
    const userRol = user.rol?.toUpperCase();
    const reqRol = requiredRole?.toUpperCase();

    // Si pedimos un rol y el usuario no lo tiene (y no es SuperAdmin), al Home público
    if (requiredRole && userRol !== reqRol && userRol !== 'SUPERADMIN' && userRol !== 'SUPER_ADMIN') {
        return <Navigate to="/" />; 
    }

    return children;
};