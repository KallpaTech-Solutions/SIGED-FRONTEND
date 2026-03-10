import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Shield, Mail, Key, Power, ArrowLeft, 
  School, Edit3, Camera, X,
  Hash, Clock, ShieldCheck
} from 'lucide-react';
import api, { BASE_URL } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import ModalUsuario from './ModalUsuario';

export default function UsuarioDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permisosMaster, setPermisosMaster] = useState([]);
  const [permisosDirectosTemp, setPermisosDirectosTemp] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  // --- 1. CARGA DE DATOS ---
  const fetchData = async () => {
    try {
      const userRes = await api.get(`/Usuarios/${id}`);
      const userData = userRes.data;

      const normalizedUser = {
        ...userData,
        estaActivo: userData.estaActivo !== undefined ? userData.estaActivo : (userData.EstaActivo ?? true),
      };

      setTargetUser(normalizedUser);
      setPermisosDirectosTemp(normalizedUser.permisosDirectos || []);
    } catch (error) {
      toast("Error al sincronizar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const isUserActive = targetUser ? Boolean(targetUser.estaActivo) : false;

  // --- 2. CAMBIO DE ESTADO ---
  const handleToggleEstado = async (u) => {
    const estaActivoNow = u.estaActivo ?? true;
    const nuevoEstado = !estaActivoNow;
    const nombre = u.persona?.nombres || 'este usuario';

    const ok = await confirm({
      title: nuevoEstado ? 'Activar usuario' : 'Desactivar usuario',
      message: `¿Desea ${nuevoEstado ? 'activar' : 'desactivar'} al usuario ${nombre}?`,
      variant: nuevoEstado ? 'info' : 'warning',
      confirmText: 'Sí, continuar',
    });

    if (!ok) return;

    try {
      await api.patch(`/Usuarios/${id}/estado?activo=${nuevoEstado}`);
      await fetchData(); 
      toast(nuevoEstado ? 'Usuario activado' : 'Usuario desactivado', 'success');
    } catch (error) {
      toast('Error al cambiar estado', 'error');
    }
  };

  // --- 3. SUBIDA DE FOTO ---
  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFoto(true);
    const formData = new FormData();
    formData.append('archivo', file);

    try {
      await api.post(`/Usuarios/${id}/foto`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      toast("Fotografía actualizada", "success");
      fetchData(); 
    } catch (error) {
      toast("Error al subir la imagen", "error");
    } finally {
      setUploadingFoto(false);
    }
  };

  // --- 4. GESTIÓN DE PERMISOS DIRECTOS ---
  const openPermisosModal = async () => {
    try {
      if (permisosMaster.length === 0) {
        const res = await api.get('/Permisos');
        setPermisosMaster(res.data || []);
      }
      setPermisosDirectosTemp(targetUser.permisosDirectos || []);
      setIsPermModalOpen(true);
    } catch (error) {
      toast('Error al cargar catálogo de permisos', 'error');
    }
  };

  const handleSavePermisosDirectos = async () => {
    try {
      await api.post('/Usuarios/asignar-permisos-directos', {
        usuarioId: targetUser.id,
        permisos: permisosDirectosTemp,
      });
      toast('Permisos directos actualizados', 'success');
      setIsPermModalOpen(false);
      fetchData();
    } catch (error) {
      toast('No se pudieron actualizar los permisos', 'error');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Cargando Ficha UNAS...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button onClick={() => navigate('/PanelControl/usuarios')} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors group">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowLeft size={16} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest">Panel de Usuarios</span>
        </button>

        <div className="flex items-center gap-3">
          {can('security.user.manage') && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-black transition-all shadow-lg flex items-center gap-2"
            >
              <Edit3 size={16} /> Editar Perfil
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-slate-800 relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [bg-size:16px_16px]"></div>
        </div>
        
        <div className="px-10 pb-10">
          <div className="relative flex flex-col md:flex-row justify-between items-center md:items-end -mt-16 mb-10 gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="h-32 w-32 bg-white p-2 rounded-[2.5rem] shadow-2xl relative group">
                <div className="w-full h-full bg-slate-50 rounded-4xl flex items-center justify-center text-slate-300 overflow-hidden">
                  {targetUser.persona?.fotoPath ? (
                    <img src={`${BASE_URL}${targetUser.persona.fotoPath}`} className="w-full h-full object-cover" alt="Perfil" />
                  ) : ( <User size={48} /> )}
                </div>
                {can('security.user.manage') && !uploadingFoto && (
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 rounded-4xl text-white text-center">
                    <Camera size={20} />
                    <span className="text-[8px] font-bold uppercase mt-1 tracking-widest">Subir Foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFotoChange} />
                  </label>
                )}
                {uploadingFoto && <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-4xl animate-pulse"></div>}
              </div>
              
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                  {targetUser.persona?.nombres} {targetUser.persona?.apellidos}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-4 text-slate-400">
                  <span className="text-xs font-semibold flex items-center gap-1.5"><Hash size={14}/> {targetUser.persona?.dni}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">{targetUser.rol}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <div className={`px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 ${isUserActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${isUserActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  {isUserActive ? 'Estado activo' : 'Inhabilitado'}
                </span>
              </div>
              {can('security.user.manage') && (
                <button 
                  onClick={() => handleToggleEstado(targetUser)}
                  className={`px-8 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 text-white shadow-lg ${isUserActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  <Power size={16} /> {isUserActive ? 'Desactivar' : 'Activar'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <section className="space-y-6">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Datos Institucionales</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Mail size={12}/> Correo</p>
                    <p className="text-sm font-semibold text-slate-700">{targetUser.persona?.correo || 'No asignado'}</p>
                  </div>
                  <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><School size={12}/> Organización</p>
                    {/* FIJAMOS EL ERROR DEL OBJETO AQUÍ ABAJO: */}
                    <p className="text-sm font-semibold text-slate-700">
                      {targetUser.organizacion?.nombre || targetUser.organizacion || 'Sede Central'}
                    </p>
                  </div>
                </div>
              </section>

              <div className="p-8 bg-primary/3 rounded-3xl border border-primary/10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Cargo / Función</p>
                  <p className="text-xl font-bold text-slate-800">
                    {targetUser.persona?.detalles?.cargo || targetUser.persona?.detalles?.tipo || 'Usuario'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Actividad</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <Clock size={16} className="text-slate-300" />
                    <span>Registro: {targetUser.fechaRegistro ? new Date(targetUser.fechaRegistro).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 rounded-4xl p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 space-y-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Control de Seguridad</p>
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase mb-2">Username</p>
                      <p className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20 inline-block">
                        {targetUser.username}
                      </p>
                    </div>
                    {can('security.user.manage') && (
                      <div className="space-y-3">
                        <button 
                          onClick={async () => {
                            const ok = await confirm({ title: 'Reiniciar contraseña', message: `¿Resetear clave al DNI?`, variant: 'warning', confirmText: 'Sí, reiniciar' });
                            if (ok) {
                              try {
                                await api.post(`/Usuarios/${id}/reiniciar-password`);
                                toast('Contraseña reiniciada', 'success');
                              } catch (e) { toast('Error al reiniciar', 'error'); }
                            }
                          }} 
                          className="w-full py-3.5 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-3 transition-all text-[11px] font-bold uppercase tracking-widest border border-white/10"
                        >
                          <Key size={16} /> Reiniciar Clave
                        </button>
                        <button
                          onClick={openPermisosModal}
                          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all text-[11px] font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary-700 shadow-lg shadow-primary/40 border border-primary/50"
                        >
                          <ShieldCheck size={16} /> Permisos Directos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-4xl p-8 border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Permisos Actuales</p>
                <div className="flex flex-wrap gap-2">
                  {(targetUser.permisosDelRol || []).concat(targetUser.permisosDirectos || []).map(p => (
                    <span key={p} className="px-3 py-1 bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500 rounded-lg uppercase">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && targetUser && (
        <ModalUsuario
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onRefresh={fetchData}
          editarUsuario={{ id: targetUser.id }}
        />
      )}

      {isPermModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPermModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-scale-in overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Gestión de permisos especiales
                </p>
                <h2 className="text-lg font-bold text-slate-800">
                  {targetUser.persona?.nombres} {targetUser.persona?.apellidos}
                </h2>
              </div>
              <button onClick={() => setIsPermModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Resumen de permisos actuales */}
            <div className="mb-4 space-y-3">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                  Permisos otorgados por rol
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(targetUser.permisosDelRol || []).map((p) => (
                    <span
                      key={`rol-${p}`}
                      className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-600 rounded-lg uppercase"
                    >
                      {p}
                    </span>
                  ))}
                  {(targetUser.permisosDelRol || []).length === 0 && (
                    <span className="text-[10px] text-slate-400">Sin permisos desde el rol.</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                  Permisos especiales actuales
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(permisosDirectosTemp || []).map((p) => (
                    <span
                      key={`direct-temp-${p}`}
                      className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700 rounded-lg uppercase"
                    >
                      {p}
                    </span>
                  ))}
                  {(permisosDirectosTemp || []).length === 0 && (
                    <span className="text-[10px] text-slate-400">Sin permisos especiales asignados.</span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Marca los permisos que quieres que este usuario tenga <span className="font-semibold">además</span> de los que ya le otorga su rol.
            </p>

            {/* Lista de permisos disponibles para asignar como especiales (solo los que no vienen por rol) */}
            <div className="max-h-80 overflow-y-auto space-y-2 mb-4 pr-1">
              {permisosMaster
                .filter((perm) => !(targetUser.permisosDelRol || []).includes(perm.idPermiso))
                .map((perm) => {
                  const idPermiso = perm.idPermiso;
                  const checked = permisosDirectosTemp.includes(idPermiso);
                  return (
                    <label
                      key={idPermiso}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        checked ? 'bg-primary/5 border-primary/30' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setPermisosDirectosTemp((prev) =>
                            prev.includes(idPermiso)
                              ? prev.filter((p) => p !== idPermiso)
                              : [...prev, idPermiso],
                          )
                        }
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-700">{perm.descripcion}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tight">
                          {perm.categoria} • {idPermiso}
                        </p>
                      </div>
                    </label>
                  );
                })}
              {permisosMaster.filter((perm) => !(targetUser.permisosDelRol || []).includes(perm.idPermiso)).length === 0 && (
                <p className="text-[10px] text-slate-400">
                  Todos los permisos disponibles ya están otorgados por el rol.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPermModalOpen(false)}
                className="px-6 py-2 text-[11px] font-bold uppercase text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermisosDirectos}
                className="px-8 py-2 bg-primary text-white rounded-xl text-[11px] font-bold uppercase shadow-lg shadow-primary/20 hover:bg-primary-700"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}