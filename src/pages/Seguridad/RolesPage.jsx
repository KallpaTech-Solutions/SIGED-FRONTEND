import React, { useState, useEffect } from 'react';
import { Shield, Save, Lock, ChevronRight, Activity, Check } from 'lucide-react';
import api from '../../api/axiosConfig';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function RolesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selectedRol, setSelectedRol] = useState(null);
  const [permisosMaster, setPermisosMaster] = useState([]); // Lista total de la API
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]); // Permisos del rol actual
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserLevel, setCurrentUserLevel] = useState(1);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // 1. Carga inicial: Roles y Catálogo Maestro de Permisos
  const fetchInitialData = async () => {
    try {
      const [resRoles, resPerms] = await Promise.all([
        api.get('/Roles'),
        api.get('/Permisos')
      ]);

      const rolesDb = resRoles.data || [];
      setRoles(rolesDb);
      setPermisosMaster(resPerms.data || []);
    } catch (error) {
      console.error("Error al sincronizar matriz de seguridad", error);
    } finally {
      setLoading(false);
    }
  };

  // Una vez que tenemos roles y usuario, calculamos su nivel máximo
  useEffect(() => {
    if (!user) return;
    if (roles.length === 0) return;

    const rolActual = roles.find(r => r.nombre === user.rol);

    if (rolActual && typeof rolActual.nivel === 'number') {
      setCurrentUserLevel(rolActual.nivel);
    } else if (user.rol === 'SuperAdmin') {
      // Fallback: SuperAdmin al tope si algo no cuadra
      setCurrentUserLevel(100);
    }
  }, [roles, user]);

  // 2. Al seleccionar un rol, cargamos sus permisos actuales desde la DB
  const handleSelectRol = async (rol) => {
    setIsCreating(false);
    setSelectedRol(rol);
    setPermisosSeleccionados([]); // Limpieza visual inmediata
    try {
      const res = await api.get(`/Roles/${rol.id}`);
      const rolCompleto = res.data;
      setSelectedRol(rolCompleto);
      // Se espera que .permisos sea un array de IDs: ["security.user.view", ...]
      setPermisosSeleccionados(rolCompleto.permisos || []);
    } catch (e) {
      console.warn("Este rol aún no tiene permisos asignados.");
      setPermisosSeleccionados([]);
    }
  };

  // 3. Guardar la nueva matriz en el Backend
  const handleSave = async () => {
    if (!selectedRol) return;

    if (!selectedRol.nombre || selectedRol.nombre.trim() === '') {
      toast('El nombre del rol es obligatorio.', 'error');
      return;
    }

    if (selectedRol.nivel === undefined || selectedRol.nivel === null) {
      toast('Debes especificar el nivel jerárquico del rol.', 'error');
      return;
    }

    // Validación de jerarquía: no se pueden crear/editar roles con nivel mayor al propio
    if (selectedRol.nivel > currentUserLevel) {
      toast(`No puedes asignar un nivel mayor a tu propio nivel (${currentUserLevel}).`, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: selectedRol.nombre,
        descripcion: selectedRol.descripcion,
        nivel: selectedRol.nivel,
        permisos: permisosSeleccionados,
      };

      if (!selectedRol.id) {
        // Crear nuevo rol
        const res = await api.post('/Roles', payload);
        toast('Rol creado correctamente', 'success');
        setIsCreating(false);
        // Volvemos a cargar los roles y seleccionamos el nuevo si viene en la respuesta
        await fetchInitialData();
        if (res.data?.id) {
          const nuevo = res.data;
          setSelectedRol(nuevo);
          setPermisosSeleccionados(nuevo.permisos || []);
        }
      } else {
        // Actualizar rol existente
        await api.put(`/Roles/${selectedRol.id}`, payload);
        toast('Matriz de seguridad actualizada para ' + selectedRol.nombre, 'success');
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Error al guardar la configuración.";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 text-center font-black text-slate-400 animate-pulse uppercase tracking-widest">
      Sincronizando Matriz UNAS...
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 font-montserrat">
      
      {/* Columna Izquierda: Listado de Roles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Roles</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCreating(true);
              const nuevo = { id: null, nombre: '', descripcion: '', nivel: 1, permisos: [] };
              setSelectedRol(nuevo);
              setPermisosSeleccionados([]);
            }}
            className="text-[11px] font-bold uppercase px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            + Nuevo
          </button>
        </div>
        
        <div className="bg-white rounded-4xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          {roles.map(rol => (
            <button 
              key={rol.id}
              onClick={() => handleSelectRol(rol)}
              className={`w-full p-6 text-left flex justify-between items-center transition-all ${
                selectedRol?.id === rol.id && !isCreating ? 'bg-primary text-white' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span className="font-bold uppercase text-sm tracking-widest">{rol.nombre}</span>
              <ChevronRight size={18} className={selectedRol?.id === rol.id && !isCreating ? 'text-white' : 'text-slate-300'} />
            </button>
          ))}
        </div>
      </div>

      {/* Columna Derecha: Matriz de Permisos */}
      <div className="lg:col-span-2 space-y-4">
        {selectedRol ? (
          <div className="bg-white rounded-4xl border border-slate-100 shadow-xl shadow-slate-200/60 p-8 animate-in slide-in-from-right-4">
            
            {/* Cabecera de Matriz */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="space-y-2 w-full md:w-auto">
                {isCreating ? (
                  <>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                      Nombre del nuevo rol <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedRol.nombre}
                      onChange={e => setSelectedRol(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full md:w-72 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                      placeholder="Ej. Coordinador de Liga"
                    />
                    <div className="flex flex-col md:flex-row gap-2 mt-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                          Nivel jerárquico <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={currentUserLevel}
                          value={selectedRol.nivel ?? 1}
                          onChange={e => setSelectedRol(prev => ({ ...prev, nivel: Number(e.target.value) }))}
                          className="w-full md:w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                          placeholder="Nivel"
                        />
                        <p className="mt-1 text-[10px] text-slate-400">
                          No puedes crear roles con nivel mayor a <span className="font-bold">{currentUserLevel}</span>.
                        </p>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                          Descripción <span className="text-slate-300">(opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={selectedRol.descripcion || ''}
                          onChange={e => setSelectedRol(prev => ({ ...prev, descripcion: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                          placeholder="Ej. Puede gestionar usuarios de su facultad"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-black text-slate-800 uppercase leading-none">
                      Permisos: {selectedRol.nombre}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                      <Activity size={12} /> Nivel {selectedRol.nivel} • {permisosMaster.length} acciones disponibles
                    </p>
                    {selectedRol.descripcion && (
                      <p className="text-[11px] text-slate-500 max-w-md">
                        {selectedRol.descripcion}
                      </p>
                    )}
                  </>
                )}
              </div>
              
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50"
              >
                {saving ? 'GUARDANDO...' : <><Save size={16} /> {isCreating ? 'CREAR ROL' : 'GUARDAR MATRIZ'}</>}
              </button>
            </div>

            {/* Grid de Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permisosMaster.map(perm => {
                const idPerm = perm.idPermiso;
                const isSelected = permisosSeleccionados.includes(idPerm);
                return (
                  <label 
                    key={idPerm} 
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected ? 'bg-primary/5 border-primary/30' : 'bg-slate-50 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        className="peer w-6 h-6 rounded-lg border-slate-300 text-primary focus:ring-primary/20 transition-all appearance-none border-2 checked:bg-primary checked:border-primary"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermisosSeleccionados([...permisosSeleccionados, idPerm]);
                          } else {
                            setPermisosSeleccionados(permisosSeleccionados.filter(p => p !== idPerm));
                          }
                        }}
                      />
                      <Check size={14} className="absolute text-white left-1.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    
                    <div>
                      <p className={`font-bold text-sm transition-colors ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                        {perm.descripcion}
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter opacity-70">
                        {perm.categoria} | {idPerm}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          /* Estado Vacío */
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-slate-100 rounded-4xl p-12">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
              <Lock size={48} className="opacity-20 text-slate-400" />
            </div>
            <p className="font-black uppercase tracking-widest text-sm text-slate-400 text-center">
              Selecciona un rol de la izquierda <br /> para gestionar su acceso institucional
            </p>
          </div>
        )}
      </div>
    </div>
  );
}