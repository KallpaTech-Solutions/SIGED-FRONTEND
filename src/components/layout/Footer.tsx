import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  MapPin,
  ExternalLink,
  PhoneCall,
} from "lucide-react";
import logoUnas from "../../assets/LogoUNAS.png";

const WHATSAPP_URL = "https://wa.me/51951907810";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-slate-950 border-t border-slate-800 pt-12 pb-8 font-inter text-slate-200">
      <div className="container mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* --- IDENTIDAD INSTITUCIONAL --- */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src={logoUnas} 
                alt="UNAS Logo" 
                className="w-12 h-12 object-contain transition-transform group-hover:rotate-3" 
              />
              <div className="flex flex-col">
                <span className="font-bold text-xl text-white tracking-tight">SIGED</span>
                <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                  UNAS - PERÚ
                </span>
              </div>
            </Link>
            <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
              Plataforma oficial para la gestión, seguimiento y difusión de las actividades deportivas de nuestra comunidad universitaria.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Youtube, href: "#" }
              ].map((social, idx) => (
                <a 
                  key={idx}
                  href={social.href} 
                  className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* --- ENLACES: COMPETENCIAS --- */}
          <div>
            <h4 className="font-bold text-slate-100 mb-7 text-[12px] uppercase tracking-[0.15em]">
              Competencias
            </h4>
            <ul className="space-y-4 text-[13px] font-semibold">
              <li>
                <Link
                  to="/torneos/interfacultades"
                  className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
                >
                  Interfacultades
                  <ExternalLink size={12} className="opacity-70" />
                </Link>
              </li>
              <li>
                <Link
                  to="/torneos/cachimbos"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Copa Cachimbos
                </Link>
              </li>
              <li>
                <Link
                  to="/calendario"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Calendario Deportivo
                </Link>
              </li>
              <li>
                <Link
                  to="/reglamentos"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Reglamentos
                </Link>
              </li>
            </ul>
          </div>

          {/* --- ENLACES: SOPORTE --- */}
          <div>
            <h4 className="font-bold text-slate-100 mb-7 text-[12px] uppercase tracking-[0.15em]">
              Soporte
            </h4>
            <ul className="space-y-4 text-[13px] font-semibold">
              <li>
                <Link
                  to="/faqs"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link
                  to="/contacto"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Contacto Directo
                </Link>
              </li>
              <li>
                <Link
                  to="/ayuda"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <a
                  href="https://portalweb.unas.edu.pe/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  Portal UNAS
                </a>
              </li>
            </ul>
          </div>

          {/* --- CONTACTO Y UBICACIÓN --- */}
          <div>
            <h4 className="font-bold text-slate-100 mb-7 text-[12px] uppercase tracking-[0.15em]">
              Ubicación
            </h4>
            <ul className="space-y-5 text-[13px] font-medium text-slate-300">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                  <MapPin size={16} />
                </div>
                <span className="leading-tight">Carretera Central km 1.21, Tingo María, Huánuco - Perú</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                  <Mail size={16} />
                </div>
                <a
                  href="mailto:gregorio.paz@unas.edu.pe"
                  className="font-bold text-slate-100 hover:text-primary transition-colors"
                >
                  gregorio.paz@unas.edu.pe
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                  <PhoneCall size={16} />
                </div>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-slate-100 hover:text-primary transition-colors"
                >
                  951 907 810 (WhatsApp)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* --- LÍNEA DE CRÉDITOS --- */}
        <div className="border-t border-slate-800 pt-6 mt-2 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            © 2026 Universidad Nacional Agraria de la Selva
          </p>
          <div className="flex items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <Link to="/privacidad" className="hover:text-primary transition-colors">
              Privacidad
            </Link>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <Link to="/terminos" className="hover:text-primary transition-colors">
              Términos
            </Link>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Desarrollado por G. Benjamin Paz Flores
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}