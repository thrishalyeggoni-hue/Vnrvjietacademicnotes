import React, { useState, useEffect } from 'react';
import { 
  BrandingConfig, 
  Branch, 
  StudentUser, 
  TeacherUser 
} from './types';
import { 
  getBranding, 
  getBranches, 
  getCurrentRole, 
  getCurrentStudent, 
  getCurrentTeacher, 
  clearAuthSession,
  setCurrentTeacher,
  saveBranding
} from './services/storage';
import { logOutFirebaseUser } from './services/firebase';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentAuthModal } from './components/StudentAuthModal';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [branding, setBranding] = useState<BrandingConfig>(getBranding());
  const [branches, setBranches] = useState<Branch[]>(getBranches());
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher' | null>(getCurrentRole());
  const [currentStudent, setCurrentStudent] = useState<StudentUser | null>(getCurrentStudent());
  const [currentTeacherState, setCurrentTeacherState] = useState<TeacherUser | null>(getCurrentTeacher());

  // Modals state
  const [isStudentAuthOpen, setIsStudentAuthOpen] = useState(false);
  const [isTeacherAuthOpen, setIsTeacherAuthOpen] = useState(false);
  const [authPresetBranchId, setAuthPresetBranchId] = useState<string | undefined>(undefined);

  // Deep-linking target from notification click
  const [selectedNoteTarget, setSelectedNoteTarget] = useState<{
    noteId: string;
    subjectId: string;
    unitNumber: number;
  } | null>(null);

  // Refresh branding or branch data on updates
  const refreshData = () => {
    setBranding(getBranding());
    setBranches(getBranches());
    setCurrentStudent(getCurrentStudent());
    setCurrentTeacherState(getCurrentTeacher());
  };

  const handleOpenStudentAuth = (branchId?: string) => {
    setAuthPresetBranchId(branchId);
    setIsStudentAuthOpen(true);
  };

  const handleOpenTeacherAuth = (branchId?: string) => {
    setAuthPresetBranchId(branchId);
    setIsTeacherAuthOpen(true);
  };

  const handleStudentLoginSuccess = (student: StudentUser) => {
    setCurrentStudent(student);
    setCurrentRole('student');
    setIsStudentAuthOpen(false);
  };

  const handleTeacherLoginSuccess = (teacher: TeacherUser) => {
    setCurrentTeacherState(teacher);
    setCurrentRole('teacher');
    setIsTeacherAuthOpen(false);
  };

  const handleLogout = () => {
    logOutFirebaseUser();
    clearAuthSession();
    setCurrentRole(null);
    setCurrentStudent(null);
    setCurrentTeacherState(null);
    setSelectedNoteTarget(null);
  };

  const handleTeacherSwitchBranch = (branchId: string) => {
    if (currentTeacherState) {
      const updatedTeacher = { ...currentTeacherState, activeBranchId: branchId };
      setCurrentTeacher(updatedTeacher);
      setCurrentTeacherState(updatedTeacher);
    }
  };

  const handleNavigateToNote = (noteId: string, subjectId: string, unitNumber: number) => {
    setSelectedNoteTarget({ noteId, subjectId, unitNumber });
  };

  // Determine active branch object
  const activeBranch: Branch | null = (() => {
    if (currentRole === 'student' && currentStudent) {
      return branches.find(b => b.id === currentStudent.branchId) || branches[0] || null;
    }
    if (currentRole === 'teacher' && currentTeacherState) {
      return branches.find(b => b.id === currentTeacherState.activeBranchId) || branches[0] || null;
    }
    return null;
  })();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Universal Institutional Header */}
      <Header
        branding={branding}
        currentRole={currentRole}
        currentStudent={currentStudent}
        currentTeacher={currentTeacherState}
        activeBranch={activeBranch}
        onOpenStudentAuth={() => handleOpenStudentAuth()}
        onOpenTeacherAuth={() => handleOpenTeacherAuth()}
        onLogout={handleLogout}
        onNavigateToNote={handleNavigateToNote}
      />

      {/* Main Content Area with Smooth View Transition */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full py-6">
        <AnimatePresence mode="wait">
          
          {/* 1. LANDING PAGE (Guest) */}
          {!currentRole && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <LandingPage
                branding={branding}
                branches={branches}
                onOpenStudentAuth={handleOpenStudentAuth}
                onOpenTeacherAuth={handleOpenTeacherAuth}
              />
            </motion.div>
          )}

          {/* 2. STUDENT DASHBOARD */}
          {currentRole === 'student' && currentStudent && activeBranch && (
            <motion.div
              key="student-dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <StudentDashboard
                student={currentStudent}
                branch={activeBranch}
                selectedNoteTarget={selectedNoteTarget}
                onClearTarget={() => setSelectedNoteTarget(null)}
              />
            </motion.div>
          )}

          {/* 3. TEACHER / FACULTY DASHBOARD */}
          {currentRole === 'teacher' && currentTeacherState && (
            <motion.div
              key="teacher-dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TeacherDashboard
                teacher={currentTeacherState}
                onSwitchBranch={handleTeacherSwitchBranch}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer branding={branding} />

      {/* Student Authentication & Branch Selector Modal */}
      <StudentAuthModal
        isOpen={isStudentAuthOpen}
        onClose={() => setIsStudentAuthOpen(false)}
        onSuccess={handleStudentLoginSuccess}
        initialBranchId={authPresetBranchId}
      />

      {/* Teacher Authentication Modal */}
      <TeacherAuthModal
        isOpen={isTeacherAuthOpen}
        onClose={() => setIsTeacherAuthOpen(false)}
        onSuccess={handleTeacherLoginSuccess}
        initialBranchId={authPresetBranchId}
      />

    </div>
  );
}
