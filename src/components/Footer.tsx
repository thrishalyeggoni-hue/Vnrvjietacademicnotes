import React from 'react';
import { BrandingConfig } from '../types';
import { BookOpen, Mail, MapPin, ShieldCheck } from 'lucide-react';

interface FooterProps {
  branding: BrandingConfig;
}

export const Footer: React.FC<FooterProps> = ({ branding }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Col 1: Portal info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <span>{branding.facultyName}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              {branding.tagline} Maintained under {branding.regulation} syllabus guidelines for {branding.institution}.
            </p>
            <div className="text-[11px] text-slate-500">
              {branding.department} • {branding.academicYear}
            </div>
          </div>

          {/* Col 2: Faculty Contact Details */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Faculty Contact</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <a href={`mailto:${branding.contactEmail}`} className="hover:text-white transition-colors truncate">
                  {branding.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{branding.officeRoom}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{branding.designation}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} {branding.institution}. All academic materials reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Branch-Isolated Access</span>
            <span>•</span>
            <span>Unit-Wise Organization</span>
            <span>•</span>
            <span>Selective Sharing</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
