import React from 'react';
import { Branch, BrandingConfig, StudentUser, TeacherUser } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { 
  GraduationCap, 
  ShieldCheck, 
  LogOut, 
  BookOpen, 
} from 'lucide-react';

interface HeaderProps {
  branding: BrandingConfig;
  currentRole: 'student' | 'teacher' | null;
  currentStudent: StudentUser | null;
  currentTeacher: TeacherUser | null;
  activeBranch: Branch | null;
  onOpenStudentAuth: () => void;
  onOpenTeacherAuth: () => void;
  onLogout: () => void;
  onNavigateToNote?: (noteId: string, subjectId: string, unitNumber: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  branding,
  currentRole,
  currentStudent,
  currentTeacher,
  activeBranch,
  onOpenStudentAuth,
  onOpenTeacherAuth,
  onLogout,
  onNavigateToNote,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      
      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Left: Institution Crest & Faculty Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-blue-900 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-indigo-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 tracking-tight truncate font-display">
                {branding.facultyName}
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                {branding.institutionShort || 'Academic Portal'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {branding.portalTitle} • {branding.department}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* If Student logged in */}
          {currentRole === 'student' && currentStudent && activeBranch && (
            <div className="flex items-center gap-2.5">
              
              {/* Branch Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="font-bold text-blue-900">{activeBranch.code}</span>
                <span className="text-blue-600 text-[10px]">({currentStudent.year})</span>
              </div>

              {/* Branch-isolated Notifications */}
              <NotificationCenter
                branchId={currentStudent.branchId}
                branchCode={currentStudent.branchCode}
                studentId={currentStudent.id}
                onNavigateToNote={onNavigateToNote}
              />

              {/* Student Profile Pill */}
              <div className="flex items-center gap-2 pl-1.5 bg-slate-50 py-1 px-2.5 rounded-xl border border-slate-200">
                {currentStudent.photoUrl ? (
                  <img
                    src={currentStudent.photoUrl}
                    alt={currentStudent.name}
                    className="w-7 h-7 rounded-full object-cover border border-blue-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {currentStudent.name.charAt(0)}
                  </div>
                )}
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>{currentStudent.name}</span>
                    {currentStudent.googleUid && (
                      <span title="Verified Google Account" className="inline-block">
                        <svg className="w-3 h-3 inline" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{currentStudent.rollNo}</div>
                </div>
              </div>

              {/* Logout / Switch */}
              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Log out from Student Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* If Teacher logged in */}
          {currentRole === 'teacher' && currentTeacher && activeBranch && (
            <div className="flex items-center gap-2.5">
              
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-900">Faculty Mode</span>
                <span className="text-emerald-700 text-[11px]">({activeBranch.code})</span>
              </div>

              {/* Notifications for current active branch */}
              <NotificationCenter
                branchId={activeBranch.id}
                branchCode={activeBranch.code}
                studentId="teacher-view"
                onNavigateToNote={onNavigateToNote}
              />

              {/* Teacher Profile Pill */}
              <div className="flex items-center gap-2 pl-1.5 bg-slate-50 py-1 px-2.5 rounded-xl border border-slate-200">
                {currentTeacher.photoUrl ? (
                  <img
                    src={currentTeacher.photoUrl}
                    alt={currentTeacher.name}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {currentTeacher.name.charAt(0)}
                  </div>
                )}
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>{currentTeacher.name}</span>
                    {currentTeacher.googleUid && (
                      <span title="Verified Google Account" className="inline-block">
                        <svg className="w-3 h-3 inline" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{currentTeacher.designation}</div>
                </div>
              </div>

              {/* Logout button */}
              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Exit Faculty Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* If Guest / On Landing Page */}
          {!currentRole && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenStudentAuth}
                className="px-3.5 sm:px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Login</span>
              </button>

              <button
                type="button"
                onClick={onOpenTeacherAuth}
                className="px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Faculty Login</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
