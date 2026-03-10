import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, School, Trophy, Activity, ArrowRight, Clock } from 'lucide-react';
import api from '../../api/axiosConfig';

export default function SuperAdminSummary() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/Dashboard/summary');
        setStats(response.data);
      } catch (error) {
        console.error("Error al cargar estadísticas");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sincronizando UNAS...</p>
      </div>
    </div>
  );

  const cards = [
    { title: 'Usuarios Totales', value: stats?.totalUsuarios, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/PanelControl/usuarios' },
    { title: 'Facultades', value: stats?.totalFacultades, icon: School, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/PanelControl/organizaciones' },
    { title: 'Torneos Activos', value: stats?.totalTorneos, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', path: '/PanelControl/torneos' },
    { title: 'Sesiones Activas', value: stats?.usuariosActivos, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50', path: null },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div 
            key={i} 
            onClick={() => card.path && navigate(card.path)}
            className={`group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 ${card.path ? 'hover:border-primary/30 hover:shadow-md cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}>
              <card.icon size={22} />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{card.title}</p>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{card.value || 0}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actividad Reciente */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-slate-400" /> Actividad Reciente
            </h3>
            <button onClick={() => navigate('/PanelControl/usuarios')} className="text-primary font-bold text-[10px] uppercase tracking-widest hover:underline">
              Ver Usuarios
            </button>
          </div>
          <div className="p-4 space-y-1">
            {stats?.ultimosUsuarios?.map((user, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
                    {user?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{user}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Nuevo registro en el sistema</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Banner de Eventos */}
        <div className="bg-primary p-8 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between">
          <Trophy size={64} className="absolute -right-4 -top-4 text-white/10 rotate-12" />
          <div className="relative z-10">
            <span className="bg-white/20 text-[9px] font-bold px-2 py-1 rounded mb-4 inline-block uppercase tracking-widest">Aviso OTI</span>
            <h4 className="text-xl font-bold leading-tight mb-2">Interfacultades 2026</h4>
            <p className="text-white/70 text-sm leading-relaxed">Las inscripciones están próximas a abrirse. Revisa los reglamentos actualizados.</p>
          </div>
          <button className="mt-8 bg-white text-primary text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all">
            Ver Calendario
          </button>
        </div>
      </div>
    </div>
  );
}