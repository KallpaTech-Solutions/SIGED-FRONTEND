import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, School, Calendar, Info, 
  MapPin, BookOpen, Activity, 
  X, Maximize2, Quote,
  ExternalLink, Award, Share2, Edit3,
  Copy, Check, Facebook, Twitter, MessageCircle
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import ModalOrganizacion from './ModalOrganizacion';

export default function OrganizacionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  
  // ESTADOS
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Control de edición
  const [isShareOpen, setIsShareOpen] = useState(false); // Control de compartir
  const [copied, setCopied] = useState(false);

  const fetchDetalle = async () => {
    try {
      const res = await api.get(`/Organizacion/${id}`);
      setOrg(res.data);
    } catch (e) {
      console.error("Error al cargar detalle", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (can('core.org.view')) fetchDetalle();
    else setLoading(false);
  }, [id]);

  // Lógica de Copiar Enlace
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-6 bg-white font-inter">
      <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] animate-pulse">Sincronizando Identidad UNAS</p>
    </div>
  );

  if (!org) return <div className="p-20 text-center font-bold text-slate-300 uppercase tracking-widest">Unidad no encontrada</div>;

  if (!can('core.org.view')) {
    return (
      <div className="flex flex-col items-center justify-center p-20 rounded-2xl bg-slate-50 border border-slate-100">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No tiene permisos para ver esta sección</p>
        <p className="text-xs text-slate-400 mt-2">Contacte al administrador si necesita acceso.</p>
      </div>
    );
  }

  // URLs de Compartir
  const shareLinks = {
    whatsapp: `https://wa.me/?text=Mira la ficha oficial de ${org.nombre} en SIGED-UNAS: ${window.location.href}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`,
    twitter: `https://twitter.com/intent/tweet?text=Ficha Institucional de ${org.nombre}&url=${window.location.href}`,
  };

  const fallbackGradient = {
    background: `linear-gradient(135deg, ${org.colorRepresentativo || '#1e293b'} 0%, #0f172a 100%)`
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-inter pb-24 relative overflow-x-hidden">
      
      {/* 🖼️ VISUALIZADOR (LIGHTBOX) */}
      {selectedImage && (
        <div className="fixed inset-0 z-300 bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-all p-3 bg-white/10 rounded-2xl border border-white/10 shadow-2xl"><X size={32} /></button>
          <img src={selectedImage} className="max-w-full max-h-[85vh] object-contain rounded-4xl shadow-2xl animate-scale-in border border-white/10" alt="Vista Pro" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* 🔗 MODAL DE COMPARTIR (GLASSMORPHISM) */}
      {isShareOpen && (
        <div className="fixed inset-0 z-250 flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsShareOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-sm w-full animate-scale-in border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Compartir Ficha</h3>
            <p className="text-slate-400 text-xs text-center mb-8 uppercase tracking-widest font-bold">Difunde la identidad institucional</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <a href={shareLinks.whatsapp} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all group">
                <MessageCircle size={24} />
                <span className="text-[10px] font-bold uppercase">WhatsApp</span>
              </a>
              <a href={shareLinks.facebook} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                <Facebook size={24} />
                <span className="text-[10px] font-bold uppercase">Facebook</span>
              </a>
            </div>

            <button 
              onClick={copyToClipboard}
              className="w-full py-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 group"
            >
              {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-slate-400 group-hover:text-primary" />}
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{copied ? 'Enlace Copiado' : 'Copiar Enlace'}</span>
            </button>

            <button onClick={() => setIsShareOpen(false)} className="mt-6 w-full text-slate-300 text-[10px] font-bold uppercase hover:text-red-500 transition-colors">Cerrar</button>
          </div>
        </div>
      )}

      {/* 🚀 HERO SECTION */}
      <div className="relative h-[42vh] w-full">
        {org.portadaUrl ? (
          <div className="w-full h-full cursor-zoom-in group relative" onClick={() => setSelectedImage(org.portadaUrl)}>
            <img src={org.portadaUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all duration-500 flex items-center justify-center">
               <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100 shadow-2xl"><Maximize2 size={28} /></div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative" style={fallbackGradient}>
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[20px_20px]"></div>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-[#f8fafc] via-slate-900/20 to-slate-900/40 pointer-events-none" />
        <div className="absolute top-8 left-8 z-50">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3 px-5 py-2.5 bg-white/10 hover:bg-white backdrop-blur-lg text-white hover:text-slate-900 rounded-2xl transition-all border border-white/10 shadow-xl">
            <ArrowLeft size={18} /><span className="text-[11px] font-bold uppercase tracking-widest text-inherit">Regresar</span>
          </button>
        </div>
      </div>

      {/* 📊 ESTRUCTURA FLOTANTE */}
      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-16">
           <div className="relative group cursor-zoom-in" onClick={() => org.logoUrl && setSelectedImage(org.logoUrl)}>
              <div className="w-40 h-40 md:w-52 md:h-52 bg-white rounded-[3rem] p-6 shadow-xl flex items-center justify-center border-[6px] border-white overflow-hidden transition-all duration-500 group-hover:shadow-primary/20">
                {org.logoUrl ? <img src={org.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <School size={60} className="text-slate-100" />}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-all flex items-center justify-center">
                   <Maximize2 className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 border-4 border-white shadow-lg flex items-center justify-center text-white"><Award size={18} /></div>
           </div>

           <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg">{org.tipo}</span>
                <span className="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg" style={{ backgroundColor: org.colorRepresentativo }}>{org.abreviatura}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-800 tracking-tight leading-none">{org.nombre}</h1>
              {org.lema && (
                <div className="flex items-center justify-center md:justify-start gap-3 text-slate-400 font-medium italic text-lg">
                  <span className="w-8 h-px bg-slate-200"></span><Quote size={16} className="text-primary opacity-40" /><span>{org.lema}</span>
                </div>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-sm border border-slate-200/60 relative overflow-hidden h-full">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10"><BookOpen size={22} /></div>
                <div><h3 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Reseña Histórica</h3><div className="h-1 w-8 bg-primary/30 rounded-full mt-1"></div></div>
              </div>
              <p className="text-slate-600 text-xl leading-[1.8] font-medium text-justify">{org.descripcion || "En proceso de actualización..."}</p>

              {org.portadaUrl && (
                <div className="mt-16 rounded-[2.5rem] overflow-hidden aspect-video bg-slate-100 relative group cursor-zoom-in border border-slate-200 shadow-inner" onClick={() => setSelectedImage(org.portadaUrl)}>
                  <img src={org.portadaUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700" alt="" />
                  <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white font-bold text-[10px] uppercase tracking-[0.2em]">Visualizar Campus</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5 group">
              <School size={150} className="absolute -right-8 -bottom-8 text-white/3 -rotate-12" />
              <div className="relative z-10 space-y-8">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Ficha de Datos</p>
                <div className="space-y-8">
                  {[
                    { label: 'Fundación', value: org.fechaCreacion ? new Date(org.fechaCreacion).getFullYear() : 'S/N', icon: Calendar, color: 'text-primary' },
                    { label: 'Ubicación', value: 'Tingo María, Perú', icon: MapPin, color: 'text-sky-400' },
                    { label: 'Estado', value: org.estaActivo ? 'Activa' : 'Inactiva', icon: Activity, color: 'text-emerald-400' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-5 items-start">
                      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0"><item.icon size={18} className={item.color} /></div>
                      <div className="flex flex-col leading-tight"><span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">{item.label}</span><span className="text-sm font-semibold text-white/90">{item.value}</span></div>
                    </div>
                  ))}
                </div>
                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full border-2 border-white shadow-xl" style={{ backgroundColor: org.colorRepresentativo }}></div><span className="text-[10px] font-mono text-white/40 uppercase">{org.colorRepresentativo}</span></div>
                   <ExternalLink size={16} className="text-white/20 hover:text-white cursor-pointer" />
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN (MEJORADO) */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-3">
               {can('core.org.manage') && (
                 <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-4 bg-slate-50 hover:bg-primary hover:text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-slate-100 group"
                 >
                    <Edit3 size={18} className="text-slate-400 group-hover:text-white" /> Editar Contenido
                 </button>
               )}
               
               <button 
                onClick={() => setIsShareOpen(true)}
                className="w-full py-4 bg-white hover:bg-slate-50 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-slate-200"
               >
                  <Share2 size={18} className="text-slate-400" /> Compartir Ficha
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📝 COMPONENTE MODAL INTEGRADO */}
      {isModalOpen && (
        <ModalOrganizacion 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchDetalle} // Recarga los datos de la ficha al terminar
          editarOrg={org} // Le pasamos el objeto completo para que cargue los datos
        />
      )}
    </div>
  );
}