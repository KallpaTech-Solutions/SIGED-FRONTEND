import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, School, Edit3, Trash2, 
  AlertCircle, Loader2, Building2, GraduationCap, 
  MapPin, Settings, Power, PowerOff, ShieldCheck, ChevronRight
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import ModalOrganizacion from './ModalOrganizacion';
import { useNavigate } from 'react-router-dom';

export default function OrganizacionesPage() {
  const { can } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [organizaciones, setOrganizaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orgAEditar, setOrgAEditar] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tiposDisponibles = ["Todos", "Facultad", "Administración", "Escuela", "Sede"];

  useEffect(() => { fetchOrganizaciones(); }, []);
  
  const fetchOrganizaciones = async () => {
    setLoading(true);
    try {
      const response = await api.get('/Organizacion');
      setOrganizaciones(response.data);
    } catch (error) {
      console.error("Error de sincronización:", error);
    } finally {
      setLoading(false);
    }
  };

  const irADetalles = (id) => navigate(`/PanelControl/organizaciones/${id}`);

  const handleToggleStatus = async (e, org) => {
    e.stopPropagation();
    const accion = org.estaActivo ? "desactivar" : "activar";
    const ok = await confirm({
      title: org.estaActivo ? 'Desactivar unidad' : 'Activar unidad',
      message: `¿Deseas ${accion} la unidad: ${org.nombre}?`,
      variant: org.estaActivo ? 'warning' : 'info',
      confirmText: 'Sí, continuar',
    });
    if (!ok) return;
    try {
      await api.patch(`/Organizacion/${org.id}/toggle-status`);
      fetchOrganizaciones();
      toast(org.estaActivo ? 'Unidad desactivada correctamente' : 'Unidad activada correctamente', 'success');
    } catch (error) {
      toast('Error al cambiar el estado', 'error');
    }
  };

  const handleDelete = async (e, org) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Eliminar unidad',
      message: `¿Eliminar permanentemente "${org.nombre}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Sí, eliminar',
    });
    if (!ok) return;
    try {
      await api.delete(`/Organizacion/${org.id}`);
      fetchOrganizaciones();
      toast('Organización eliminada correctamente', 'success');
    } catch (error) {
      const errMsg = error.response?.data?.message ?? error.response?.data?.detail ?? 'No se pudo eliminar';
      toast(typeof errMsg === 'string' ? errMsg : 'No se pudo eliminar', 'error');
    }
  };

  const abrirEdicion = (e, org) => {
    e.stopPropagation();
    setOrgAEditar(org);
    setIsModalOpen(true);
  };

  const filtrados = organizaciones.filter(o => {
    const matchBusqueda = (o.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                          o.abreviatura?.toLowerCase().includes(busqueda.toLowerCase()));
    const matchTipo = filtroTipo === "Todos" || o.tipo === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  const getIcon = (tipo) => {
    const props = { size: 18, className: "text-slate-400" };
    switch(tipo) {
      case 'Facultad': return <GraduationCap {...props} />;
      case 'Administración': return <Settings {...props} />;
      case 'Sede': return <MapPin {...props} />;
      default: return <Building2 {...props} />;
    }
  };

  if (!can('core.org.view')) {
    return (
      <div className="flex flex-col items-center justify-center p-20 rounded-2xl bg-slate-50 border border-slate-100">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No tiene permisos para ver esta sección</p>
        <p className="text-xs text-slate-400 mt-2">Contacte al administrador si necesita acceso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-inter pb-20">
      
      {/* HEADER REFINADO con acento de color */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-3xl bg-linear-to-br from-primary/5 via-white to-emerald-500/5 border border-primary/10">
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-2">
             <span className="text-[10px] font-bold uppercase tracking-widest">Panel Maestro</span>
             <ChevronRight size={12} className="text-primary/60" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Estructura UNAS</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Organizaciones</h2>
        </div>

        {can('core.org.manage') && (
          <button 
            onClick={() => { setOrgAEditar(null); setIsModalOpen(true); }} 
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary-700 transition-all shadow-lg shadow-primary/25 flex items-center gap-2 hover:shadow-primary/30"
          >
            <Plus size={18} /> Registrar Unidad
          </button>
        )}
      </div>

      {/* FILTROS Y BÚSQUEDA con más color */}
      <div className="flex flex-col lg:flex-row gap-6 items-center p-5 rounded-2xl bg-slate-50/80 border border-slate-100">
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Siglas o nombre de la unidad..." 
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 w-full">
          {tiposDisponibles.map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                filtroTipo === tipo 
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30 hover:text-primary/80'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE CARDS (Más limpias) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Cargando registros institucionales...</p>
          </div>
        ) : filtrados.length > 0 ? (
          filtrados.map((org) => {
            const colorOrg = org.colorRepresentativo || '#0284c7';
            const isActiva = org.estaActivo;
            return (
            <div 
              key={org.id} 
              onClick={() => irADetalles(org.id)}
              className={`group relative rounded-3xl border-2 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1 ${
                isActiva 
                  ? 'bg-white border-slate-200 shadow-md hover:shadow-xl hover:shadow-slate-300/40' 
                  : 'bg-slate-100 border-slate-200 grayscale'
              }`}
            >
              {/* Barra superior con color institucional */}
              <div 
                className={`h-1.5 w-full transition-opacity ${!isActiva && 'opacity-40'}`}
                style={{ backgroundColor: colorOrg }}
              />
              
              {/* Badge de estado */}
              <div className="absolute top-4 right-4 z-10">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm ${
                  isActiva 
                    ? 'bg-emerald-500/90 text-white' 
                    : 'bg-amber-500/90 text-white'
                }`}>
                  {isActiva ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div className="p-8 flex flex-col h-full space-y-6">
                {/* Logo e Icono */}
                <div className="flex justify-between items-start">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center p-3 border-2 transition-colors"
                    style={{ 
                      backgroundColor: isActiva ? `${colorOrg}15` : '#f1f5f9',
                      borderColor: isActiva ? `${colorOrg}40` : '#e2e8f0'
                    }}
                  >
                    {org.logoUrl ? 
                      <img src={org.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : 
                      getIcon(org.tipo)
                    }
                  </div>
                  
                  {/* Acciones solo en Hover - visible solo con core.org.manage */}
                  {can('core.org.manage') && (
                    <div className="flex gap-1 bg-white/95 border border-slate-200 p-1 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <button onClick={(e) => abrirEdicion(e, org)} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                      <button onClick={(e) => handleToggleStatus(e, org)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        {org.estaActivo ? <Power size={14} /> : <PowerOff size={14} />}
                      </button>
                      <button onClick={(e) => handleDelete(e, org)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>

                {/* Info de la Unidad */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                      style={{ 
                        backgroundColor: isActiva ? `${colorOrg}25` : '#e2e8f0',
                        color: isActiva ? colorOrg : '#94a3b8'
                      }}
                    >
                      {org.abreviatura}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{org.tipo}</span>
                  </div>
                  <h3 className={`text-sm font-bold leading-snug line-clamp-2 uppercase ${isActiva ? 'text-slate-800' : 'text-slate-500'}`}>
                    {org.nombre}
                  </h3>
                </div>

                {/* Footer de la Card */}
                <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor: isActiva ? `${colorOrg}20` : '#e2e8f0' }}>
                   <span className={`text-[10px] font-bold ${isActiva ? 'text-slate-400' : 'text-slate-400'}`}>ID: {org.id}</span>
                   <div 
                    className="w-5 h-5 rounded-full border-2 border-white shadow-md ring-2 ring-slate-100" 
                    style={{ backgroundColor: colorOrg }} 
                    title={colorOrg}
                   />
                </div>
              </div>
            </div>
          );})
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-primary/20 rounded-[2.5rem] bg-linear-to-br from-slate-50 to-primary/5">
            <AlertCircle size={32} className="mx-auto text-primary/40 mb-4" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No se encontraron unidades</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ModalOrganizacion 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setOrgAEditar(null); }}
          onRefresh={fetchOrganizaciones}
          editarOrg={orgAEditar}
        />
      )}
    </div>
  );
}