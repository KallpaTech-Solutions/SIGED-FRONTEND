import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosConfig';
import { POST_LOGIN_REDIRECT_KEY } from '../utils/returnUrl';

const AuthContext = createContext();

/** Primer valor string si el claim JWT viene como string o arreglo (tokens .NET). */
function firstString(value) {
    if (value == null) return null;
    if (Array.isArray(value)) return firstString(value[0]);
    const s = typeof value === 'string' ? value : String(value);
    const t = s.trim();
    return t.length ? t : null;
}

const ROLE_CLAIM_KEYS = [
    'role',
    'Role',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

function extractRoleFromToken(decoded, userData) {
    if (!decoded || typeof decoded !== 'object') {
        return firstString(userData?.rol ?? userData?.Rol);
    }
    for (const key of ROLE_CLAIM_KEYS) {
        const v = firstString(decoded[key]);
        if (v) return v;
    }
    return firstString(userData?.rol ?? userData?.Rol);
}

function extractPermissionsFromToken(decoded) {
    if (!decoded || typeof decoded !== 'object') return [];
    const raw = decoded.permission ?? decoded.Permission;
    if (raw == null) return [];
    const list = Array.isArray(raw) ? raw : [raw];
    return [...new Set(list.map((p) => String(p).trim()).filter(Boolean))];
}

function isSuperAdminRol(rol) {
    const s = firstString(rol);
    if (!s) return false;
    return s.replace(/\s+/g, '').toUpperCase() === 'SUPERADMIN';
}

function processToken(userData) {
    try {
        const decoded = jwtDecode(userData.token);
        const permissions = extractPermissionsFromToken(decoded);
        const rol = extractRoleFromToken(decoded, userData);
        return {
            ...userData,
            permissions,
            rol,
        };
    } catch (error) {
        console.error("Error al decodificar el token", error);
        return {
            ...userData,
            permissions: extractPermissionsFromToken({}),
            rol: firstString(userData?.rol ?? userData?.Rol),
        };
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();

    const login = (data, redirectAfter) => {
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
        const target =
            typeof redirectAfter === "string" && redirectAfter.trim().length > 0
                ? redirectAfter.trim()
                : "/PanelControl";
        setTimeout(() => {
            try {
                sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
            } catch {
                /* ignore */
            }
            navigate(target, { replace: true });
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
                const parsed = JSON.parse(savedUser);
                // Vuelve a leer permisos/rol desde el JWT (corrige usuarios guardados sin permissions o rol desfasado)
                const refreshed = processToken({ ...parsed, token });
                setUser(refreshed);
                try {
                    localStorage.setItem('user', JSON.stringify(refreshed));
                } catch {
                    /* ignore quota / private mode */
                }
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
        if (isSuperAdminRol(user?.rol)) return true;
        return user?.permissions?.includes(permissionName) || false;
    };

    const hasRole = (roleName) => {
        if (isSuperAdminRol(user?.rol)) return true;
        return firstString(user?.rol) === roleName;
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