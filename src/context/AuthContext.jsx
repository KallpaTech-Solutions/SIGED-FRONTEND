import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();

    // --- FUNCIÓN INTERNA PARA PROCESAR EL TOKEN ---
    // Dentro de AuthContext.jsx -> Modifica processToken
    const processToken = (userData) => {
        try {
            const decoded = jwtDecode(userData.token);
            
            // 1. Extraer Permisos
            let rawPermissions = decoded.permission || [];
            const permissions = Array.isArray(rawPermissions) ? rawPermissions : [rawPermissions];

            // 2. Extraer Rol (Buscamos todas las formas posibles que usa C#)
            const roleFromToken = 
                decoded.role || 
                decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 
                userData.rol; // Si el API lo mandó por fuera

            // 3. Devolvemos el usuario con el ROL GARANTIZADO
            return { 
                ...userData, 
                permissions, 
                rol: roleFromToken 
            };
        } catch (error) {
            console.error("Error al decodificar el token", error);
            return { ...userData, permissions: [], rol: null };
        }
    };

    const login = (data) => {
        // 🛡️ Si requiere cambio de contraseña, redirigimos ahí primero
        if (data.requiereCambioPassword) {
            localStorage.setItem("temp_user", JSON.stringify(data));
            navigate('/Seguridad/update-password');
            return; 
        }
    
        const userWithPermissions = processToken(data);

        // 1. Guardamos en storage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userWithPermissions));

        // 2. Actualizamos el estado global
        setUser(userWithPermissions);
        
        // 3. Damos un tic al render antes de navegar para evitar carreras
        setTimeout(() => {
            navigate('/PanelControl', { replace: true });
        }, 10);
    };

    const completePasswordChange = (finalUserData) => {
        localStorage.removeItem("temp_user");
        
        const userWithPermissions = processToken(finalUserData);

        localStorage.setItem("token", finalUserData.token);
        localStorage.setItem("user", JSON.stringify(userWithPermissions));
        setUser(userWithPermissions);
        
        // Navegamos con React para evitar recarga completa
        navigate('/PanelControl', { replace: true });
    };

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (savedUser && token) {
            try {
                // Solo hidratamos el usuario; la navegación la manejan las rutas/protected routes
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.clear();
                setUser(null);
            }
        }
        setLoading(false); // siempre liberamos el loading al final
    }, []);

    // Cerrar sesión también en otras pestañas cuando desaparece el token
    useEffect(() => {
        const syncLogout = (e) => {
            if (e.key === 'token' && !e.newValue) {
                setUser(null);
                window.location.href = '/login';
            }
        };

        window.addEventListener('storage', syncLogout);
        return () => window.removeEventListener('storage', syncLogout);
    }, []);

    // --- EL CEREBRO DE LA SEGURIDAD ---
    const can = (permissionName) => {
        // SuperAdmin lo puede todo por defecto
        if (user?.rol === "SuperAdmin") return true;
        
        return user?.permissions?.includes(permissionName) || false;
    };

    const hasRole = (roleName) => {
        return user?.rol === roleName || user?.rol === "SuperAdmin";
    };

    const logout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);
        try {
            // Avisamos al backend para que invalide sesión / registre auditoría
            await api.post('/Auth/logout');
        } catch (e) {
            // Si falla el logout del backend, igual limpiamos el cliente
            console.warn('Fallo al cerrar sesión en el backend', e);
        } finally {
            localStorage.clear(); 
            setUser(null);
            setLoggingOut(false);
            navigate('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            setUser, 
            login, 
            logout, 
            can,        // ✅ Ahora es 100% seguro
            hasRole, 
            completePasswordChange, 
            loading,
            loggingOut
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);