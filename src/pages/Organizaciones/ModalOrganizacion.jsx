import React, { useState, useEffect } from 'react';
import {
  X,
  School,
  Image as ImageIcon,
  Info,
  Loader2,
  Quote,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { useToast } from '../../context/ToastContext';

const FALLBACK_PORTADA =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png';

export default function ModalOrganizacion({ isOpen, onClose, onRefresh, editarOrg }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    abreviatura: '',
    tipo: 'Facultad',
    descripcion: '',
    lema: '',
    colorRepresentativo: '#006400',
    logoUrl: '',
    portadaUrl: '',
    fechaCreacion: '',
    estaActivo: true,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (editarOrg) {
      const cargarDetalle = async () => {
        try {
          const res = await api.get(`/Organizacion/${editarOrg.id}`);
          const data = res.data;
          setFormData({
            ...data,
            fechaCreacion: data.fechaCreacion ? data.fechaCreacion.split('T')[0] : '',
            estaActivo: data.estaActivo ?? true,
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Error al cargar detalle:', e);
        }
      };
      cargarDetalle();
    } else {
      setFormData({
        nombre: '',
        abreviatura: '',
        tipo: 'Facultad',
        descripcion: '',
        lema: '',
        colorRepresentativo: '#006400',
        logoUrl: '',
        portadaUrl: '',
        fechaCreacion: '',
        estaActivo: true,
      });
    }
  }, [isOpen, editarOrg]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'abreviatura' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const clean = (val) => (val && val.trim() !== '' ? val.trim() : null);

    const payload = {
      nombre: formData.nombre.trim(),
      abreviatura: formData.abreviatura.trim().toUpperCase(),
      tipo: formData.tipo,
      descripcion: clean(formData.descripcion),
      lema: clean(formData.lema),
      colorRepresentativo: formData.colorRepresentativo || '#006400',
      logoUrl: clean(formData.logoUrl),
      portadaUrl: clean(formData.portadaUrl),
      fechaCreacion: formData.fechaCreacion
        ? new Date(formData.fechaCreacion).toISOString()
        : null,
      estaActivo: Boolean(formData.estaActivo),
    };

    try {
      if (editarOrg) {
        await api.put(`/Organizacion/${editarOrg.id}`, payload);
      } else {
        await api.post('/Organizacion', payload);
      }
      toast(
        editarOrg
          ? 'Organización actualizada correctamente'
          : 'Organización registrada correctamente',
        'success',
      );
      onRefresh();
      onClose();
    } catch (error) {
      const errMsg = error.response?.data?.message ?? 'Revisa los datos';
      toast(typeof errMsg === 'string' ? errMsg : 'Revisa los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-100 flex items-center justify-center p-4">
      <div className="bg-white/95 w-full max-w-5xl rounded-[32px] shadow-[0_28px_80px_rgba(15,23,42,0.70)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] border border-slate-800/30 font-inter">
        {/* HEADER EJECUTIVO */}
        <div className="relative w-full shrink-0 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-600 px-8 py-5 border-b border-slate-800/60 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900/40 border border-emerald-400/60 flex items-center justify-center">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo"
                  className="w-10 h-10 object-contain rounded-xl"
                />
              ) : (
                <School className="text-emerald-300" size={30} />
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-[0.28em] mb-1">
                {editarOrg ? 'Editar unidad' : 'Nueva unidad'}
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {formData.nombre || 'Unidad institucional'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 text-slate-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO - TODO EN UNA SOLA VISTA */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 pt-4 bg-slate-50/80"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* COLUMNA IZQUIERDA */}
            <div className="space-y-8">
              {/* DATOS GENERALES */}
              <section>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Info size={14} className="text-emerald-500" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Información principal
                  </p>
                </div>

                <div className="space-y-2 mt-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                    Nombre de la institución
                  </label>
                  <input
                    required
                    value={formData.nombre}
                    onChange={handleChange('nombre')}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                      Abreviatura / Siglas
                    </label>
                    <input
                      required
                      value={formData.abreviatura}
                      onChange={handleChange('abreviatura')}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold uppercase outline-none"
                      placeholder="Ej. FIIS"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                      Tipo
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={handleChange('tipo')}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                    >
                      <option value="Facultad">Facultad</option>
                      <option value="Sede">Sede</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                      Fecha creación
                    </label>
                    <input
                      type="date"
                      value={formData.fechaCreacion}
                      onChange={handleChange('fechaCreacion')}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                      Estado operativo
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          estaActivo: !prev.estaActivo,
                        }))
                      }
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                        formData.estaActivo
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {formData.estaActivo ? 'Activo' : 'Suspendido'}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          formData.estaActivo
                            ? 'bg-emerald-500 animate-pulse'
                            : 'bg-slate-300'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* IDENTIDAD VISUAL */}
              <section>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ImageIcon size={14} className="text-emerald-500" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Identidad visual
                  </p>
                </div>
                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 mt-3">
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.colorRepresentativo}
                      onChange={handleChange('colorRepresentativo')}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                    />
                    <input
                      value={formData.colorRepresentativo}
                      onChange={handleChange('colorRepresentativo')}
                      className="flex-1 bg-transparent font-mono text-xs uppercase font-bold outline-none"
                    />
                  </div>
                  <input
                    value={formData.logoUrl}
                    onChange={handleChange('logoUrl')}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] outline-none"
                    placeholder="URL Logo (PNG/SVG)"
                  />
                  <div className="space-y-2">
                    <input
                      value={formData.portadaUrl}
                      onChange={handleChange('portadaUrl')}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] outline-none"
                      placeholder="URL Portada (Banner horizontal)"
                    />
                    {/* Vista previa de portada */}
                    <div className="mt-1 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                        Vista previa de portada
                      </div>
                      <div className="w-full max-h-52 bg-slate-200 rounded-b-xl overflow-hidden">
                        {formData.portadaUrl ? (
                          <img
                            src={formData.portadaUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (e.target.src !== FALLBACK_PORTADA) {
                                // eslint-disable-next-line no-param-reassign
                                e.target.src = FALLBACK_PORTADA;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[11px] text-slate-400 gap-1">
                            <div className="w-8 h-8 rounded-full bg-slate-300/70 flex items-center justify-center">
                              <ImageIcon size={16} className="text-slate-600" />
                            </div>
                            <span>Sin portada seleccionada</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* COLUMNA DERECHA: HISTORIA Y MISIÓN */}
            <div className="space-y-8 flex flex-col h-full">
              <section className="flex flex-col flex-1 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <BookOpen size={14} className="text-emerald-500" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Reseña e Historia
                  </p>
                </div>
                <textarea
                  value={formData.descripcion || ''}
                  onChange={handleChange('descripcion')}
                  className="flex-1 w-full p-5 bg-white border border-slate-200 rounded-2xl outline-none text-sm leading-relaxed min-h-[150px]"
                  placeholder="Describe la historia y misión de la unidad..."
                />
              </section>

              <section className="space-y-4 mt-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Quote size={14} className="text-emerald-500" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Lema
                  </p>
                </div>
                <input
                  value={formData.lema || ''}
                  onChange={handleChange('lema')}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm italic outline-none"
                  placeholder="Lema institucional"
                />
              </section>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-slate-200 flex flex-col md:flex-row md:justify-end gap-3 md:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full md:w-auto px-6 py-3 text-slate-400 font-bold uppercase text-[11px] tracking-widest hover:text-slate-600 text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-emerald-500 text-slate-900 px-8 md:px-10 py-3 rounded-full md:rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              {editarOrg ? 'Guardar cambios' : 'Registrar unidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}