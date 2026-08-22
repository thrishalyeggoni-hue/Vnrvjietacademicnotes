import React from 'react';
import { Branch, BrandingConfig } from '../types';
import { 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  Bell, 
  Layers, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  FileText, 
  FileSpreadsheet, 
  FolderDown, 
  ShieldAlert,
  Users
} from 'lucide-react';

interface LandingPageProps {
  branding: BrandingConfig;
  branches: Branch[];
  onOpenStudentAuth: (branchId?: string) => void;
  onOpenTeacherAuth: (branchId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  branding,
  branches,
  onOpenStudentAuth,
  onOpenTeacherAuth,
}) => {
  return (
    <div className="space-y-16 py-6 sm:py-10">
      
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-14 overflow-hidden shadow-2xl border border-indigo-900/40">
        
        {/* Glow background effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          
          {/* Institution & Faculty Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-indigo-200 backdrop-blur-md">
            <Building2 className="w-4 h-4 text-indigo-300" />
            <span className="font-semibold">{branding.institution}</span>
            <span className="text-white/40">•</span>
            <span className="font-mono text-indigo-300">{branding.regulation}</span>
          </div>

          {/* Main Hero Title */}
          <div className="space-y-2">
            <div className="text-sm sm:text-base font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Academic Notes & Curriculum Repository
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {branding.facultyName}
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-light leading-relaxed">
              {branding.tagline}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
            A secure, branch-isolated academic portal for students to access syllabus-aligned notes and for faculty to publish, organize, and control unit-wise course material.
          </p>

          {/* Dual Login Action CTA Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            
            {/* Student Login Card */}
            <div
              onClick={() => onOpenStudentAuth()}
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/90 to-indigo-700/90 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer group border border-blue-400/30 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Student Portal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  Select your branch to access verified unit notes, preview lecture slides, and receive syllabus updates.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google Login
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/20">Branch Isolated</span>
              </div>
            </div>

            {/* Teacher Login Card */}
            <div
              onClick={() => onOpenTeacherAuth()}
              className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600/90 to-teal-700/90 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer group border border-emerald-400/30 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Faculty & Teacher Portal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                  Upload unit-wise materials, control student visibility (Publish vs Draft), and broadcast notifications.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google Login
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/20">Full Control</span>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* Feature Pillar Highlights */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Designed for Academic Excellence & Reliability
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A structured workflow ensuring students get only the relevant notes, while faculty retain complete sharing control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Branch Content Isolation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Students belonging to CSE strictly see CSE curriculum material; students in ECE or CS-DS see their respective syllabus notes. Zero cross-branch contamination.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Selective Teacher Sharing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Faculty decide exactly which units and notes are published to students. Keep draft units private until ready, and toggle visibility with one click.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Targeted Branch Notifications</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Publishing a new note instantly notifies all students in that branch. Direct click-through opens the note immediately in their study dashboard.
            </p>
          </div>

        </div>
      </section>

      {/* College Engineering Branches Catalog (Matches VNRVJIET Syllabus Book) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Academic Branches Directory ({branches.length} Programs)
            </h2>
            <p className="text-xs text-slate-500">
              Select any branch to sign in as a student and view curriculum notes
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-400 self-start sm:self-auto">
            Autonomous R25 Regulation
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {branches.map((branch) => (
            <div
              key={branch.id}
              onClick={() => onOpenStudentAuth(branch.id)}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {branch.code.substring(0, 3)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {branch.totalStudentsCount || 120} sts
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                  {branch.code}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                  {branch.name}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open Notes &rarr;
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Faculty Profile & Bio Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white flex items-center justify-center font-bold text-3xl sm:text-4xl shrink-0 shadow-lg border-2 border-white">
          <BookOpen className="w-12 h-12 text-white" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Faculty Academic Portal Coordinator
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {branding.facultyName}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            {branding.designation} • {branding.department}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            {branding.institution}. Dedicated to providing structured, high-quality, verified academic resources to foster deep understanding of engineering concepts across departments.
          </p>

          <div className="pt-2 flex items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-600 flex-wrap">
            <span>📍 {branding.officeRoom}</span>
            <span>✉️ {branding.contactEmail}</span>
          </div>
        </div>
      </section>

    </div>
  );
};
