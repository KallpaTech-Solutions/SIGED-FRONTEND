import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, ArrowRight, UserCog, 
  Edit, Key, Power, Trash2
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import ModalUsuario from './ModalUsuario';

export default function UsuariosPage() {
  const { can } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/Usuarios');
      const list = response.data || [];
      setUsuarios(list.map((u) => ({
        ...u,
        estaActivo: u.estaActivo ?? u.EstaActivo ?? true,
      })));
    } catch (error) {
      console.error("Error al cargar usuarios", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirEdicion = (u) => {
    setUsuarioAEditar(u); // Cargamos el usuario seleccionado
    setIsModalOpen(true); // Abrimos el modal
  };
  const handleToggleEstado = async (u) => {
    const estaActivo = u.estaActivo ?? u.EstaActivo ?? true;
    const nuevoEstado = !estaActivo;
    const nombre = typeof u.nombreCompleto === 'string' ? u.nombreCompleto : [u.persona?.nombres, u.persona?.apellidos].filter(Boolean).join(' ') || 'este usuario';
    const ok = await confirm({
      title: nuevoEstado ? 'Activar usuario' : 'Desactivar usuario',
      message: `¿Desea ${nuevoEstado ? 'activar' : 'desactivar'} al usuario ${nombre}?`,
      variant: nuevoEstado ? 'info' : 'warning',
      confirmText: 'Sí, continuar',
    });
    if (!ok) return;
    try {
      await api.patch(`/Usuarios/${u.id}/estado?activo=${nuevoEstado}`);
      fetchUsuarios();
      toast(nuevoEstado ? 'Usuario activado correctamente' : 'Usuario desactivado correctamente', 'success');
    } catch (error) {
      toast('Error al cambiar estado', 'error');
    }
  };

  const handleResetPassword = async (u) => {
    const nombre = typeof u.nombreCompleto === 'string' ? u.nombreCompleto : [u.persona?.nombres, u.persona?.apellidos].filter(Boolean).join(' ') || 'este usuario';
    const ok = await confirm({
      title: 'Reiniciar contraseña',
      message: `¿Reiniciar contraseña de ${nombre} al DNI? El usuario deberá cambiarla en el próximo acceso.`,
      variant: 'warning',
      confirmText: 'Sí, reiniciar',
    });
    if (!ok) return;
    try {
      await api.post(`/Usuarios/${u.id}/reiniciar-password`);
      toast('Contraseña reiniciada con éxito', 'success');
    } catch (error) {
      toast('Error al reiniciar contraseña', 'error');
    }
  };

  const handleDeleteUser = async (u) => {
    const nombre = typeof u.nombreCompleto === 'string' ? u.nombreCompleto : [u.persona?.nombres, u.persona?.apellidos].filter(Boolean).join(' ') || 'este usuario';
    const ok = await confirm({
      title: 'Eliminar usuario',
      message: `¿Estás seguro de eliminar definitivamente a ${nombre}? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Sí, eliminar',
    });
    if (!ok) return;

    try {
      await api.delete(`/Usuarios/${u.id}`);
      toast('Usuario eliminado correctamente', 'success');
      fetchUsuarios();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'No se pudo eliminar el usuario.';
      toast(msg, 'error');
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.dni?.includes(busqueda)
  );

  if (!can('security.user.view')) {
    return (
      <div className="flex flex-col items-center justify-center p-20 rounded-2xl bg-slate-50 border border-slate-100">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No tiene permisos para ver esta sección</p>
        <p className="text-xs text-slate-400 mt-2">Contacte al administrador si necesita acceso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-inter">
      
      {/* --- SECCIÓN SUPERIOR: TÍTULO Y BÚSQUEDA --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <UserCog size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Gestión de Usuarios
            </h2>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
            Directorio General SIGED
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Input de Búsqueda Refinado */}
          <div className="relative flex-1 md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all"
            />
          </div>
          
          {can('security.user.manage') && (
            <button 
              onClick={() => { setUsuarioAEditar(null); setIsModalOpen(true); }} 
              className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary/20 uppercase tracking-wider"
            >
              <UserPlus size={18} /> Registrar
            </button>
          )}
        </div>
      </div>

      {/* --- TABLA DE USUARIOS --- */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Información del Usuario</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Rol / Institución</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar con iniciales */}
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {u.nombreCompleto?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 leading-tight mb-0.5">{u.nombreCompleto}</span>
                          <span className="text-[11px] font-semibold text-slate-400 tracking-wider">DNI {u.dni}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          u.rol === 'SuperAdmin' 
                          ? 'bg-purple-50 text-purple-600 border-purple-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {u.rol}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {u.nombreOrganizacion || 'Sede Central'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Ver Detalle - visible para quien tiene view */}
                        <button 
                          onClick={() => navigate(`/PanelControl/usuarios/${u.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Perfil Detallado"
                        >
                          <ArrowRight size={18} />
                        </button>
                        {/* Editar, Reset Pass, Estado - solo para quien tiene manage */}
                        {can('security.user.manage') && (
                          <>
                            <button 
                              onClick={() => abrirEdicion(u)}
                              className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                              title="Editar Datos"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleResetPassword(u)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Resetear Clave"
                            >
                              <Key size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar Usuario"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleToggleEstado(u)}
                              className={`p-2 rounded-lg transition-all duration-300 ${
                                u.estaActivo 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm shadow-emerald-200/50' 
                                : 'bg-red-50 text-red-500 hover:bg-red-600 hover:text-white shadow-sm shadow-red-200/50'
                              }`}
                              title={u.estaActivo ? "Desactivar Acceso" : "Activar Acceso"}
                            >
                              <Power size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-20 text-center text-slate-400 text-sm font-medium">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ModalUsuario 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setUsuarioAEditar(null); }} 
          onRefresh={fetchUsuarios}
          editarUsuario={usuarioAEditar}
        />
      )}
    </div>
  );
}