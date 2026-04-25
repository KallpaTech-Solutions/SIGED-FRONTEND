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
          const det = u.persona?.detalles || u.persona?.Detalles || {};
          // Intentamos mapear el rol por nombre si coincide con los roles reales,
          // de lo contrario mantenemos el mapeo numérico existente.
          const rolEncontrado = (resRoles.data || []).find(r => r.nombre === u.rol);
          const rolIdInicial = rolEncontrado ? rolEncontrado.id : (u.rol === 'SuperAdmin' ? 1 : u.rol === 'Admin' ? 2 : u.rol === 'Encargado' ? 3 : 4);

          const orgIdRaw = u.organizacion?.id ?? u.organizacion?.Id;
          setFormData({
            dni: u.persona?.dni || '',
            nombres: u.persona?.nombres || '',
            apellidos: u.persona?.apellidos || '',
            correo: u.persona?.correo || '',
            rolId: rolIdInicial,
            organizacionId: orgIdRaw != null && orgIdRaw !== '' ? String(orgIdRaw) : '',
            cargo: det.cargo ?? det.Cargo ?? '',
            oficina: det.oficina ?? det.Oficina ?? '',
            codigoEstudiante: det.codigoEstudiante ?? det.CodigoEstudiante ?? '',
            estaMatriculado: det.estaMatriculado ?? det.EstaMatriculado ?? false
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
    const dniTrim = String(formData.dni ?? "").trim();
    if (!dniTrim) {
      toast("El DNI es obligatorio: es el usuario de acceso al sistema.", "error");
      return;
    }
    const correoTrim = String(formData.correo ?? "").trim();
    if (!correoTrim) {
      toast("El correo institucional es obligatorio.", "error");
      return;
    }
    setLoading(true);

    const rolIdNum = Number(formData.rolId);
    const cargoTrim = String(formData.cargo ?? "").trim();
    const oficinaTrim = String(formData.oficina ?? "").trim();

    // Payload camelCase (API con PropertyNamingPolicy CamelCase)
    const basePayload = {
      dni: dniTrim,
      nombres: String(formData.nombres ?? "").trim(),
      apellidos: String(formData.apellidos ?? "").trim(),
      username: dniTrim,
      password: dniTrim,
      rolId: rolIdNum,
      correo: correoTrim,
      organizacionId: formData.organizacionId ? Number(formData.organizacionId) : null,
      codigoEstudiante: rolIdNum === 4 ? String(formData.codigoEstudiante ?? "").trim() || null : null,
      cargo:
        rolIdNum !== 4 ? cargoTrim || "Personal administrativo" : null,
      oficina: rolIdNum !== 4 ? oficinaTrim || "Sede Central" : null,
      telefono: null,
      dependenciaId: null,
      esPersonalInterno: true,
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-100 flex items-center justify-center p-4">
      <div className="bg-slate-950 w-full max-w-5xl rounded-3xl border border-slate-800/70 shadow-[0_32px_80px_rgba(15,23,42,0.9)] flex flex-col max-h-[90vh] animate-scale-in overflow-hidden font-inter">
        
        {/* HEADER EJECUTIVO */}
        <header className="px-8 py-6 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-300">
              <Shield size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-[0.28em] mb-1">
                Seguridad · Cuentas SIGED
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {editarUsuario ? 'Actualizar usuario institucional' : 'Registrar nuevo usuario'}
              </h2>
              <p className="text-[11px] text-slate-200/80 mt-1">
                Define el rol, la dependencia y los permisos base heredados del perfil seleccionado.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-slate-950">
          
          {/* COLUMNA IZQUIERDA: DATOS */}
          <div className="space-y-10">
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Identidad y contacto
                </p>
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
                    className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-slate-50 placeholder:text-slate-500 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400/60 outline-none transition-all" 
                    placeholder="8 dígitos" 
                    required 
                    disabled={!!editarUsuario} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase ml-1">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="nombres"
                    value={formData.nombres}
                    onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-slate-50 placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/25 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase ml-1">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-slate-50 placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/25 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase ml-1">
                    Correo Institucional <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={e => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-slate-50 placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/25 outline-none transition-all"
                    placeholder="usuario@unas.edu.pe"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Asignación de rol
                </p>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase ml-1">
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
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl font-bold text-emerald-300 text-sm outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/25"
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
                      <label className="text-[11px] font-bold text-slate-300 uppercase ml-1">
                        Cód. Universitario
                      </label>
                      <div className="relative">
                        <input
                          name="codigoEstudiante"
                          value={formData.codigoEstudiante}
                          onChange={e =>
                            setFormData({ ...formData, codigoEstudiante: e.target.value, estaMatriculado: false })
                          }
                          className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-slate-50 outline-none pr-10 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/25"
                        />
                        {formData.estaMatriculado && <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-300 uppercase ml-1">
                        Cargo
                      </label>
                      <input
                        name="cargo"
                        value={formData.cargo}
                        onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-slate-50 outline-none placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/25"
                        placeholder="Ej. Jefe OTI"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase ml-1 block mb-2">
                    Facultad / Dependencia <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="organizacionId"
                    value={formData.organizacionId}
                    onChange={e => setFormData({ ...formData, organizacionId: e.target.value })}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-slate-50 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/25"
                  >
                    <option value="">Sede Central / Administración</option>
                    {organizaciones.map(org => <option key={org.id} value={org.id}>{org.nombre}</option>)}
                  </select>
                </div>

                {esEstudiante && (
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      formData.estaMatriculado
                        ? 'bg-emerald-500/10 border-emerald-400/60'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            formData.estaMatriculado ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              formData.estaMatriculado ? 'text-emerald-300' : 'text-slate-400'
                            }`}
                          >
                            {formData.estaMatriculado ? 'Matrícula Validada' : 'Validación de Matrícula'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Sincronización con padrón UNAS
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleValidarMatricula} 
                        disabled={validating || !formData.codigoEstudiante} 
                        className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-[0.18em] hover:bg-emerald-400 disabled:opacity-40 transition-all"
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
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 flex flex-col h-full">
            <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Shield size={16} className="text-emerald-400" /> Permisos por rol seleccionado
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Este usuario heredará automáticamente estos permisos según el rol elegido. 
              Los permisos especiales adicionales se pueden gestionar luego desde el perfil del usuario.
            </p>

            <div className="flex-1 overflow-y-auto pr-2">
              {permisosRolPreview.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No hay permisos registrados para este rol todavía.
                </p>
              ) : (
                <div className="space-y-2">
                  {permisosRolPreview.map((idPerm) => {
                    const meta = permisosMaster.find((p) => p.idPermiso === idPerm);
                    return (
                      <div
                        key={idPerm}
                        className="flex items-start gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 shadow-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            {meta?.descripcion || idPerm}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight">
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
        <footer className="px-6 md:px-10 py-4 md:py-6 bg-slate-950 border-t border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
            <p className="text-[10px] md:text-[11px] text-slate-500 font-medium italic">
              * El acceso inicial será con el número de DNI.
            </p>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 text-slate-300 font-bold uppercase text-[11px] tracking-[0.18em] hover:text-white hover:bg-slate-800 rounded-full transition-colors text-center"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading || (esEstudiante && !formData.estaMatriculado)} 
                className={`w-full sm:w-auto px-6 md:px-8 py-3 rounded-full md:rounded-xl font-bold text-[11px] uppercase tracking-[0.22em] shadow-lg transition-all flex items-center justify-center gap-2 text-slate-950 ${
                  esEstudiante && !formData.estaMatriculado 
                  ? 'bg-slate-700 cursor-not-allowed shadow-none text-slate-300' 
                  : editarUsuario
                    ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/30'
                    : 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/40'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                {editarUsuario ? 'Guardar Cambios' : 'Registrar Usuario'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}