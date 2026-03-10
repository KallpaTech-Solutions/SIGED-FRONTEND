import React, { useState, useEffect } from 'react';
import { X, Save, Shield, CheckCircle, Loader2, UserCheck } from 'lucide-react';
import api from '../../api/axiosConfig';
import { useToast } from '../../context/ToastContext';

export default function ModalUsuario({ isOpen, onClose, onRefresh, editarUsuario }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [organizaciones, setOrganizaciones] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisosMaster, setPermisosMaster] = useState([]);
  const [permisosRolPreview, setPermisosRolPreview] = useState([]);

  const [formData, setFormData] = useState({
    dni: '', nombres: '', apellidos: '', correo: '',
    rolId: 4, organizacionId: '', cargo: '', oficina: '', 
    codigoEstudiante: '', estaMatriculado: false 
  });

  useEffect(() => {
    const cargarDatosYOrgs = async () => {
      try {
        const [resOrgs, resRoles, resPerms] = await Promise.all([
          api.get('/Organizacion'),
          api.get('/Roles'),
          api.get('/Permisos'),
        ]);
        setOrganizaciones(resOrgs.data || []);
        setRoles(resRoles.data || []);
        setPermisosMaster(resPerms.data || []);

        if (editarUsuario) {
          const resUser = await api.get(`/Usuarios/${editarUsuario.id}`);
          const u = resUser.data;
          // Intentamos mapear el rol por nombre si coincide con los roles reales,
          // de lo contrario mantenemos el mapeo numérico existente.
          const rolEncontrado = (resRoles.data || []).find(r => r.nombre === u.rol);
          const rolIdInicial = rolEncontrado ? rolEncontrado.id : (u.rol === 'SuperAdmin' ? 1 : u.rol === 'Admin' ? 2 : u.rol === 'Encargado' ? 3 : 4);

          setFormData({
            dni: u.persona?.dni || '',
            nombres: u.persona?.nombres || '',
            apellidos: u.persona?.apellidos || '',
            correo: u.persona?.correo || '',
            rolId: rolIdInicial,
            organizacionId: u.organizacion?.id || '',
            cargo: u.persona?.cargo || '', 
            oficina: u.persona?.oficina || '', 
            codigoEstudiante: u.persona?.codigoEstudiante || '',
            estaMatriculado: u.persona?.estaMatriculado || false
          });

          // Cargamos vista previa de permisos del rol
          try {
            const resRol = await api.get(`/Roles/${rolIdInicial}`);
            setPermisosRolPreview(resRol.data?.permisos || []);
          } catch {
            setPermisosRolPreview([]);
          }
        } else {
          // Para nuevo usuario, mostramos permisos del rol por defecto (ESTUDIANTE = 4)
          try {
            const resRol = await api.get(`/Roles/4`);
            setPermisosRolPreview(resRol.data?.permisos || []);
          } catch {
            setPermisosRolPreview([]);
          }
        }
      } catch (error) { console.error("Error al cargar datos", error); }
    };

    if (isOpen) cargarDatosYOrgs();
  }, [isOpen, editarUsuario]);

  const handleValidarMatricula = async () => {
    if (!formData.codigoEstudiante) return;
    setValidating(true);
    setTimeout(() => {
      const esValido = formData.codigoEstudiante.length > 4;
      setFormData(prev => ({ ...prev, estaMatriculado: esValido }));
      setValidating(false);
    }, 800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Payload base compatible con el DTO del backend
    const basePayload = {
      dni: String(formData.dni),
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      username: formData.dni,
      password: String(formData.dni),
      rolId: Number(formData.rolId),
      correo: formData.correo || null,
      organizacionId: formData.organizacionId ? Number(formData.organizacionId) : null,
      codigoEstudiante: Number(formData.rolId) === 4 ? formData.codigoEstudiante : null,
      cargo: Number(formData.rolId) !== 4 ? (formData.cargo || "Personal Administrativo") : null,
      oficina: Number(formData.rolId) !== 4 ? (formData.oficina || "Sede Central") : null,
      telefono: null,
      dependenciaId: null,
    };

    try {
      if (editarUsuario) {
        const updatePayload = {
          ...basePayload,
          id: editarUsuario.id,
        };
        await api.put(`/Usuarios/${editarUsuario.id}`, updatePayload);
      } else {
        await api.post('/Usuarios/registrar', basePayload);
      }
      toast(editarUsuario ? 'Usuario actualizado correctamente' : 'Usuario registrado correctamente', 'success');
      onRefresh();
      onClose();
    } catch (error) {
      const response = error.response;
      const data = response?.data;

      let backendMessage =
        data?.message ||
        data?.detail ||
        data?.title ||
        "Error al guardar cambios.";

      // Si vienen errores de validación de ASP.NET (ModelState), los concatenamos
      if (data?.errors && typeof data.errors === 'object') {
        const detalles = Object.values(data.errors)
          .flat()
          .join(' ');
        if (detalles) {
          backendMessage = detalles;
        }
      }

      // Si el backend manda un string plano, lo usamos
      if (!data?.errors && typeof data === 'string') {
        backendMessage = data;
      }

      // Si hay respuesta pero sin body, usamos status y statusText
      if (!data && response) {
        backendMessage = response.statusText || `Error HTTP ${response.status}`;
      }

      // Si NO hay respuesta (error de red / CORS / timeout)
      if (!response) {
        backendMessage = error.message || 'No se pudo conectar con el servidor.';
      }

      // Último recurso: mostrar el JSON completo para entender el fallo de transacción
      if (backendMessage === "Error al guardar cambios." && data && typeof data === 'object') {
        backendMessage = JSON.stringify(data);
      }

      // Prefijo con el código HTTP si existe
      if (response?.status) {
        backendMessage = `[${response.status}] ${backendMessage}`;
      }

      toast(backendMessage, "error");
      console.error("Error al registrar/actualizar usuario:", data || error);
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const esEstudiante = Number(formData.rolId) === 4;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] animate-scale-in overflow-hidden font-inter">
        
        {/* HEADER LIMPIO */}
        <header className="px-8 py-6 bg-white border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {editarUsuario ? 'Actualizar Información' : 'Registrar Nuevo Usuario'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">Configuración de Cuenta Institucional</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* COLUMNA IZQUIERDA: DATOS */}
          <div className="space-y-10">
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identidad y Contacto</p>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block ml-1">
                    DNI (Usuario de Acceso) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="dni" 
                    value={formData.dni} 
                    onChange={e => setFormData({...formData, dni: e.target.value})} 
                    className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all" 
                    placeholder="8 dígitos" 
                    required 
                    disabled={!!editarUsuario} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input name="nombres" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-primary/40 outline-none transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input name="apellidos" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-primary/40 outline-none transition-all" required />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                    Correo Institucional <span className="text-red-500">*</span>
                  </label>
                  <input type="email" name="correo" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-primary/40 outline-none transition-all" placeholder="usuario@unas.edu.pe" />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asignación de Rol</p>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                      Rol de Usuario <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="rolId" 
                      value={formData.rolId} 
                      onChange={async e => {
                        const val = Number(e.target.value);
                        setFormData(prev => ({ ...prev, rolId: val, estaMatriculado: val !== 4 }));
                        // Cargamos vista previa de permisos del rol seleccionado
                        try {
                          const resRol = await api.get(`/Roles/${val}`);
                          setPermisosRolPreview(resRol.data?.permisos || []);
                        } catch {
                          setPermisosRolPreview([]);
                        }
                      }} 
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-primary text-sm outline-none"
                    >
                      {roles.map((rol) => (
                        <option key={rol.id} value={rol.id}>
                          {rol.nombre.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {esEstudiante ? (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Cód. Universitario</label>
                      <div className="relative">
                        <input name="codigoEstudiante" value={formData.codigoEstudiante} onChange={e => setFormData({...formData, codigoEstudiante: e.target.value, estaMatriculado: false})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none pr-10" />
                        {formData.estaMatriculado && <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Cargo</label>
                      <input name="cargo" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none" placeholder="Ej. Jefe OTI" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 block mb-2">
                    Facultad / Dependencia <span className="text-red-500">*</span>
                  </label>
                  <select name="organizacionId" value={formData.organizacionId} onChange={e => setFormData({...formData, organizacionId: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm font-semibold outline-none">
                    <option value="">Sede Central / Administración</option>
                    {organizaciones.map(org => <option key={org.id} value={org.id}>{org.nombre}</option>)}
                  </select>
                </div>

                {esEstudiante && (
                  <div className={`p-5 rounded-2xl border transition-all ${formData.estaMatriculado ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${formData.estaMatriculado ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${formData.estaMatriculado ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {formData.estaMatriculado ? 'Matrícula Validada' : 'Validación de Matrícula'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">Sincronización con padrón UNAS</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleValidarMatricula} 
                        disabled={validating || !formData.codigoEstudiante} 
                        className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase hover:bg-black disabled:opacity-30 transition-all"
                      >
                        {validating ? <Loader2 className="animate-spin" size={14} /> : 'Validar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: VISTA PREVIA DE PERMISOS DEL ROL */}
          <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 flex flex-col h-full">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Shield size={16} className="text-primary" /> Permisos por Rol Seleccionado
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Este usuario heredará automáticamente estos permisos según el rol elegido. 
              Los permisos especiales adicionales se pueden gestionar luego desde el perfil del usuario.
            </p>

            <div className="flex-1 overflow-y-auto pr-2">
              {permisosRolPreview.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  No hay permisos registrados para este rol todavía.
                </p>
              ) : (
                <div className="space-y-2">
                  {permisosRolPreview.map((idPerm) => {
                    const meta = permisosMaster.find((p) => p.idPermiso === idPerm);
                    return (
                      <div
                        key={idPerm}
                        className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {meta?.descripcion || idPerm}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-tight">
                            {meta?.categoria || 'Sin categoría'} • {idPerm}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </form>

        {/* FOOTER */}
        <footer className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[11px] text-slate-400 font-medium italic">
            * El acceso inicial será con el número de DNI.
          </p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 text-slate-500 font-bold uppercase text-[11px] hover:text-slate-800 transition-colors">Cancelar</button>
            <button 
              onClick={handleSubmit}
              disabled={loading || (esEstudiante && !formData.estaMatriculado)} 
              className={`px-8 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 text-white ${
                esEstudiante && !formData.estaMatriculado 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : editarUsuario ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-primary hover:bg-primary-700 shadow-primary/20'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              {editarUsuario ? 'Guardar Cambios' : 'Registrar Usuario'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}