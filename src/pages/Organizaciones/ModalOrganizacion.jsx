import React, { useState, useEffect } from 'react';
import { 
  X, Save, School, Type, AlignLeft, Palette, 
  Quote, Image as ImageIcon, Hash, Info, Loader2,
  Calendar, Activity, Monitor, Layers,
  ChevronDown, BookOpen, CheckCircle2
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { useToast } from '../../context/ToastContext';

export default function ModalOrganizacion({ isOpen, onClose, onRefresh, editarOrg }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', abreviatura: '', tipo: 'Facultad', descripcion: '',
    lema: '', colorRepresentativo: '#006400', logoUrl: '',
    portadaUrl: '', fechaCreacion: '', estaActivo: true 
  });

  useEffect(() => {
    if (isOpen) {
      if (editarOrg) {
        const cargarDetalle = async () => {
          try {
            const res = await api.get(`/Organizacion/${editarOrg.id}`);
            const data = res.data;
            setFormData({
              ...data,
              fechaCreacion: data.fechaCreacion ? data.fechaCreacion.split('T')[0] : '',
              estaActivo: data.estaActivo ?? true
            });
          } catch (e) { console.error("Error al cargar detalle:", e); }
        };
        cargarDetalle();
      } else {
        setFormData({ 
          nombre: '', abreviatura: '', tipo: 'Facultad', descripcion: '', 
          lema: '', colorRepresentativo: '#006400', logoUrl: '', 
          portadaUrl: '', fechaCreacion: '', estaActivo: true 
        });
      }
    }
  }, [isOpen, editarOrg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const clean = (val) => (val && val.trim() !== "" ? val.trim() : null);

    const payload = {
      nombre: formData.nombre.trim(),
      abreviatura: formData.abreviatura.trim().toUpperCase(),
      tipo: formData.tipo,
      descripcion: clean(formData.descripcion),
      lema: clean(formData.lema),
      colorRepresentativo: formData.colorRepresentativo || "#006400",
      logoUrl: clean(formData.logoUrl),
      portadaUrl: clean(formData.portadaUrl),
      fechaCreacion: formData.fechaCreacion ? new Date(formData.fechaCreacion).toISOString() : null,
      estaActivo: Boolean(formData.estaActivo)
    };

    try {
      if (editarOrg) {
        await api.put(`/Organizacion/${editarOrg.id}`, payload);
      } else {
        await api.post('/Organizacion', payload);
      }
      toast(editarOrg ? 'Organización actualizada correctamente' : 'Organización registrada correctamente', 'success');
      onRefresh();
      onClose();
    } catch (error) {
      const errMsg = error.response?.data?.message ?? "Revisa los datos";
      toast(typeof errMsg === 'string' ? errMsg : "Revisa los datos", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-4xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] border border-slate-200 font-inter">
        
        {/* --- HEADER CON PREVIEW --- */}
        <div className="relative h-40 w-full shrink-0 bg-slate-100 border-b border-slate-100">
          <img 
            src={formData.portadaUrl || 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=1000'} 
            className="w-full h-full object-cover transition-opacity duration-500 opacity-60" 
            alt=""
          />
          <div className="absolute inset-0 bg-linear-to-t from-white to-transparent" />
          
          <div className="absolute bottom-4 left-8 flex items-end gap-5">
            <div 
              className="w-20 h-20 rounded-2xl bg-white p-2 shadow-xl flex items-center justify-center border-2 transition-colors duration-500"
              style={{ borderColor: formData.colorRepresentativo }}
            >
              {formData.logoUrl ? (
                <img src={formData.logoUrl} className="w-full h-full object-contain" alt="Logo" />
              ) : <School size={32} className="text-slate-200" />}
            </div>
            <div className="mb-1">
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-2">
                 {formData.nombre || 'Nueva Unidad'}
               </h2>
               <div className="flex gap-2">
                  <span className="bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{formData.tipo}</span>
                  <span className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{formData.abreviatura || 'SIGLAS'}</span>
               </div>
            </div>
          </div>

          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* --- CUERPO DEL FORMULARIO --- */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* COLUMNA IZQUIERDA: DATOS OFICIALES */}
          <div className="space-y-8">
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <Info size={14} className="text-primary" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Información Principal</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Nombre de la Institución</label>
                <input 
                  required value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-slate-800 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all" 
                  placeholder="Nombre completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Abreviatura / Siglas</label>
                  <input 
                    required value={formData.abreviatura} 
                    onChange={e => setFormData({...formData, abreviatura: e.target.value.toUpperCase()})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 uppercase tracking-wider outline-none focus:border-primary/40" 
                    placeholder="Ej. FIIS" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Tipo</label>
                  <select 
                    value={formData.tipo} 
                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none"
                  >
                    <option value="Facultad">Facultad</option>
                    <option value="Administración">Administración</option>
                    <option value="Escuela">Escuela</option>
                    <option value="Sede">Sede</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Fecha Creación</label>
                  <input 
                    type="date" value={formData.fechaCreacion} 
                    onChange={e => setFormData({...formData, fechaCreacion: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Estado Operativo</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, estaActivo: !formData.estaActivo})}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${formData.estaActivo ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">{formData.estaActivo ? 'Activo' : 'Suspendido'}</span>
                    <div className={`w-2 h-2 rounded-full ${formData.estaActivo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <ImageIcon size={14} className="text-primary" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identidad Visual</p>
              </div>
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-4">
                  <input type="color" value={formData.colorRepresentativo} onChange={e => setFormData({...formData, colorRepresentativo: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm" />
                  <input value={formData.colorRepresentativo} onChange={e => setFormData({...formData, colorRepresentativo: e.target.value})} className="flex-1 bg-transparent font-mono text-xs uppercase font-bold outline-none" />
                </div>
                <input value={formData.logoUrl || ''} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] outline-none" placeholder="URL Logo (PNG/SVG)" />
                <input value={formData.portadaUrl || ''} onChange={e => setFormData({...formData, portadaUrl: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] outline-none" placeholder="URL Portada (Banner)" />
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: CONTENIDO */}
          <div className="space-y-8 flex flex-col h-full">
             <section className="flex flex-col flex-1 space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <BookOpen size={14} className="text-primary" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reseña Histórica</p>
                </div>
                <textarea 
                  value={formData.descripcion || ''} 
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className="flex-1 w-full p-5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary/40 text-sm leading-relaxed text-slate-600 resize-none"
                  placeholder="Describe la historia y misión de la unidad..."
                />
             </section>

             <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <Quote size={14} className="text-primary" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lema</p>
                </div>
                <input 
                  value={formData.lema || ''} 
                  onChange={e => setFormData({...formData, lema: e.target.value})} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium italic text-slate-500 outline-none" 
                  placeholder="Lema institucional" 
                />
             </section>

             {/* ACCIONES FOOTER INTEGRADO */}
             <div className="pt-6 mt-auto border-t border-slate-100 flex justify-end gap-3">
               <button type="button" onClick={onClose} className="px-6 py-2 text-slate-400 font-bold uppercase text-[11px] tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
               <button 
                type="submit" 
                disabled={loading}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-700 transition-all flex items-center gap-2"
               >
                 {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                 {editarOrg ? 'Guardar Cambios' : 'Registrar Unidad'}
               </button>
             </div>
          </div>

        </form>
      </div>
    </div>
  );
}