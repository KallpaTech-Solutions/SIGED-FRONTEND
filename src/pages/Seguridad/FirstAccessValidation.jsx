import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';

export default function FirstAccessValidation() {
  const { completePasswordChange } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const procesarAcceso = async (mantenerClaveActual) => {
    setError('');
    
    if (!formData.currentPassword) {
      return setError('Debes ingresar tu contraseña actual (DNI) para continuar.');
    }

    if (!mantenerClaveActual) {
      if (!formData.newPassword || formData.newPassword.length < 6) {
        return setError('La nueva contraseña debe tener al menos 6 caracteres.');
      }
      if (formData.newPassword !== formData.confirmPassword) {
        return setError('Las nuevas contraseñas no coinciden.');
      }
    }

    setLoading(true);
    try {
      // 1. Extraemos todo el objeto temporal
      const tempUserString = localStorage.getItem("temp_user");
      if (!tempUserString) {
        throw new Error("No se pudo identificar tu sesión. Vuelve a iniciar sesión.");
      }

      const tempUser = JSON.parse(tempUserString);

      // 2. Armamos el Payload inteligente
      const payload = {
        currentPassword: formData.currentPassword,
        // Si elige mantenerla, enviamos su DNI como si fuera la clave nueva
        newPassword: mantenerClaveActual ? formData.currentPassword : formData.newPassword,
        confirmPassword: mantenerClaveActual ? formData.currentPassword : formData.confirmPassword
      };

      // 3. Consumimos nuestro nuevo endpoint seguro (Ya no necesita el ID en la URL)
      await api.post(`/Usuarios/cambiar-password`, payload, {
        headers: { Authorization: `Bearer ${tempUser.token}` }
      });

      // 4. Clonamos el usuario, forzando los booleanos a false porque el backend ya lo liberó
      const finalUserData = {
        ...tempUser, 
        requiereCambioPassword: false,
        mustChangePassword: false
      };

      // Toast se mostrará brevemente antes del redirect
      completePasswordChange(finalUserData);

    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-montserrat">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-8 border border-gray-100">
        
        {/* Tu diseño visual se mantiene intacto aquí... */}
        <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner">
          <ShieldAlert className="text-orange-600" size={32} />
        </div>
        <h2 className="text-2xl font-black text-center text-gray-800 uppercase tracking-tight">
          Validación de Acceso
        </h2>
        <p className="text-gray-500 text-center text-sm mt-2 mb-8">
          Por políticas del SIGED, debes confirmar tu acceso inicial. Puedes cambiar tu contraseña genérica o decidir mantenerla.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center mb-6 animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="Contraseña Actual (Tu DNI)" 
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={formData.currentPassword}
              onChange={e => setFormData({...formData, currentPassword: e.target.value})}
            />
          </div>

          <div className="pt-4 border-t border-dashed border-gray-200">
            <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">
              Si deseas cambiarla (Opcional):
            </p>
            <div className="space-y-3">
              <input 
                type="password" 
                placeholder="Nueva Contraseña" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all bg-gray-50 focus:bg-white"
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
              />
              <input 
                type="password" 
                placeholder="Confirmar Nueva Contraseña" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all bg-gray-50 focus:bg-white"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-6 space-y-3 flex flex-col mt-2">
            <button 
              onClick={() => procesarAcceso(false)}
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-green-700 hover:-translate-y-1 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "PROCESANDO..." : formData.newPassword ? "ACTUALIZAR Y ENTRAR" : "INGRESAR AL SISTEMA"}
              <ArrowRight size={20} />
            </button>
            
            <button 
              onClick={() => procesarAcceso(true)}
              disabled={loading || formData.newPassword.length > 0} 
              className="w-full py-3 flex items-center justify-center gap-2 text-sm text-gray-500 font-bold hover:text-gray-800 transition-colors disabled:opacity-30"
            >
              <CheckCircle size={18} />
              MANTENER MI DNI COMO CLAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}