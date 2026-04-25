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
      const { newPassword, confirmPassword } = formData;
      const hasMinLength = newPassword && newPassword.length >= 8;
      const hasUpper = /[A-ZÁÉÍÓÚÑ]/.test(newPassword || "");
      const hasLower = /[a-záéíóúñ]/.test(newPassword || "");
      const hasNumber = /\d/.test(newPassword || "");

      if (!hasMinLength || !hasUpper || !hasLower || !hasNumber) {
        return setError(
          "La nueva contraseña debe tener mínimo 8 caracteres y combinar mayúsculas, minúsculas y números."
        );
      }

      if (newPassword !== confirmPassword) {
        return setError("Las nuevas contraseñas no coinciden.");
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
    <div className="flex-1 min-h-0 bg-slate-50 flex items-center justify-center px-4 py-6 font-montserrat">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 md:gap-10 items-stretch">
        {/* Lado izquierdo: mensaje institucional */}
        <div className="hidden md:flex flex-col justify-center rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_60px_rgba(15,23,42,0.08)] text-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700 mb-4">
            <ShieldAlert size={14} />
            Seguridad · Primer acceso
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            Protege tu cuenta SIGED
          </h1>
          <p className="mt-3 text-sm text-slate-600 max-w-md">
            Por seguridad, el primer ingreso requiere confirmar tu contraseña
            genérica (DNI) y, si deseas, definir una clave personal más segura.
          </p>
          <ul className="mt-6 space-y-2 text-xs text-slate-500">
            <li>• Usa mínimo 8 caracteres.</li>
            <li>• Combina mayúsculas, minúsculas y números.</li>
            <li>• Evita repetir tu DNI como contraseña definitiva.</li>
            <li>• No compartas tus credenciales con terceros.</li>
          </ul>
        </div>

        {/* Lado derecho: tarjeta de formulario */}
        <div className="bg-white rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.10)] p-6 md:p-8 border border-slate-200 max-w-md mx-auto text-slate-900">
          <div className="md:hidden flex justify-center mb-5">
            <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-200">
              <ShieldAlert className="text-emerald-600" size={28} />
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-center text-slate-900 uppercase tracking-tight">
            Validación de acceso
          </h2>
          <p className="text-slate-500 text-center text-xs md:text-sm mt-2 mb-6 md:mb-8">
            Confirma tu contraseña actual (DNI). Luego puedes mantenerla o
            definir una nueva clave para continuar al panel.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs md:text-sm font-bold text-center mb-5">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input 
                type="password" 
                placeholder="Contraseña actual (tu DNI)" 
                className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400/60 transition-all text-sm placeholder:text-slate-400"
                value={formData.currentPassword}
                onChange={e => setFormData({...formData, currentPassword: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-dashed border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">
                Si deseas cambiarla (opcional)
              </p>
              <div className="space-y-3">
                <input 
                  type="password" 
                  placeholder="Nueva contraseña" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white text-sm placeholder:text-slate-400"
                  value={formData.newPassword}
                  onChange={e => setFormData({...formData, newPassword: e.target.value})}
                />
                <input 
                  type="password" 
                  placeholder="Confirmar nueva contraseña" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white text-sm placeholder:text-slate-400"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-5 space-y-3 flex flex-col mt-1">
              <button 
                onClick={() => procesarAcceso(false)}
                disabled={loading}
                className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-emerald-600 hover:-translate-y-[1px] transition-all shadow-lg shadow-emerald-500/40 disabled:opacity-50 disabled:hover:translate-y-0 text-xs tracking-[0.2em] uppercase"
              >
                {loading ? "PROCESANDO..." : formData.newPassword ? "ACTUALIZAR Y ENTRAR" : "INGRESAR AL SISTEMA"}
                <ArrowRight size={18} />
              </button>
              
              <button 
                onClick={() => procesarAcceso(true)}
                disabled={loading || formData.newPassword.length > 0} 
                className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-bold hover:text-slate-800 transition-colors disabled:opacity-30 uppercase tracking-[0.18em]"
              >
                <CheckCircle size={16} />
                Mantener DNI como clave
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}