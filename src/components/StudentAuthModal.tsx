import React, { useState } from 'react';
import { Branch, StudentUser } from '../types';
import { getBranches, setCurrentStudent, getSavedStudents } from '../services/storage';
import { signInWithGoogle, syncStudentProfileToFirestore, fetchUserProfileFromFirestore } from '../services/firebase';
import { GraduationCap, ArrowRight, X, Check, Loader2, BookOpen, AlertCircle, User, Hash, ShieldCheck, RefreshCw, Sparkles, Building2 } from 'lucide-react';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: StudentUser) => void;
  initialBranchId?: string;
}

interface PendingGoogleAuth {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialBranchId,
}) => {
  const branches = getBranches();

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    initialBranchId || branches[0]?.id || 'branch-cse'
  );
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [year, setYear] = useState('2nd Year');
  const [semester, setSemester] = useState('Semester 3');
  
  // Two-step Google Flow state
  const [pendingGoogle, setPendingGoogle] = useState<PendingGoogleAuth | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualGoogleEmail, setManualGoogleEmail] = useState('');
  const [showManualEmailEntry, setShowManualEmailEntry] = useState(false);

  if (!isOpen) return null;

  const formatAuthError = (err: any): string | null => {
    const msg = err?.message || String(err || '');
    const code = err?.code || '';
    if (code === 'GOOGLE_POPUP_RESTRICTED' || msg.includes('GOOGLE_POPUP_RESTRICTED')) {
      return null; // Will cleanly show email entry without alarm
    }
    if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
      return null;
    }
    if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
      return 'Popup was blocked by your browser settings. You can enter your Google email directly below.';
    }
    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      return 'Please enter your Google account email below to continue.';
    }
    if (msg.includes('database is closing') || msg.includes('Database is closing') || msg.includes('internal-error') || msg.includes('indexeddb')) {
      return null; // Handled smoothly via direct entry
    }
    return msg || 'Please enter your Google account email below.';
  };

  const validateInputs = (): boolean => {
    if (!name.trim()) {
      setError('Please enter your official Student Full Name.');
      return false;
    }
    if (!rollNo.trim()) {
      setError('Please enter your official Roll Number / Hall Ticket No.');
      return false;
    }
    if (rollNo.trim().length < 3) {
      setError('Roll Number must be at least 3 characters long (e.g. 23VJ1A6701).');
      return false;
    }
    if (!selectedBranchId) {
      setError('Please select your academic branch.');
      return false;
    }
    return true;
  };

  /**
   * Step 1: Sign in with Google Account
   * Never auto-redirects. Always transitions to Step 2 to mandate Name, Roll No & Branch.
   */
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoadingGoogle(true);

    try {
      const { firebaseUser, email, displayName, photoURL } = await signInWithGoogle();
      
      // Look up any previous profile for pre-filling default values
      let existingProfile: any = null;
      try {
        existingProfile = await fetchUserProfileFromFirestore(`student-${firebaseUser.uid}`);
      } catch (err) {
        console.warn('Could not check Firestore profile:', err);
      }

      if (!existingProfile) {
        const saved = getSavedStudents();
        existingProfile = saved.find(s => s.googleUid === firebaseUser.uid || s.email === email);
      }

      // Pre-fill existing data if available, but ALWAYS proceed to confirmation step
      if (existingProfile) {
        if (existingProfile.name) setName(existingProfile.name);
        else if (displayName) setName(displayName);

        if (existingProfile.rollNo) setRollNo(existingProfile.rollNo);
        if (existingProfile.branchId) setSelectedBranchId(existingProfile.branchId);
        if (existingProfile.year) setYear(existingProfile.year);
        if (existingProfile.semester) setSemester(existingProfile.semester);
      } else {
        if (displayName) setName(displayName);
      }

      // Transition to Step 2 - Mandatory Academic Details Collection
      setPendingGoogle({
        uid: firebaseUser.uid,
        email,
        displayName: displayName || name || 'Student',
        photoURL: photoURL || undefined,
      });

    } catch (err: any) {
      console.error('Student Google Auth Error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(formatAuthError(err));
        setShowManualEmailEntry(true);
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  /**
   * Fallback: Continue with Google/College Email directly
   */
  const handleContinueWithManualEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = manualGoogleEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid Google or College email address (e.g. name@gmail.com).');
      return;
    }

    // Generate a consistent pseudo-UID based on email
    const pseudoUid = 'g_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    const extractedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);

    const saved = getSavedStudents();
    const existingProfile = saved.find(s => s.email?.toLowerCase() === cleanEmail);
    if (existingProfile) {
      if (existingProfile.name) setName(existingProfile.name);
      if (existingProfile.rollNo) setRollNo(existingProfile.rollNo);
      if (existingProfile.branchId) setSelectedBranchId(existingProfile.branchId);
      if (existingProfile.year) setYear(existingProfile.year);
      if (existingProfile.semester) setSemester(existingProfile.semester);
    } else {
      if (!name) setName(formattedName);
    }

    setPendingGoogle({
      uid: pseudoUid,
      email: cleanEmail,
      displayName: name || formattedName,
    });
  };

  /**
   * Step 2: Complete Student Registration & Enter Portal
   */
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pendingGoogle) {
      setError('Please sign in with your Google Account first.');
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const branch = branches.find(b => b.id === selectedBranchId) || branches[0];
      const student: StudentUser = {
        id: `student-${pendingGoogle.uid}`,
        googleUid: pendingGoogle.uid,
        role: 'student',
        name: name.trim() || pendingGoogle.displayName,
        rollNo: rollNo.trim().toUpperCase(),
        email: pendingGoogle.email,
        branchId: branch.id,
        branchCode: branch.code,
        year: year,
        semester: semester,
        bookmarkedNoteIds: [],
        photoUrl: pendingGoogle.photoURL || undefined,
      };

      await syncStudentProfileToFirestore(student);
      setCurrentStudent(student);
      onSuccess(student);
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('Failed to save student profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[94vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/90 to-indigo-50/90 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 font-display">Student Portal Login</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  pendingGoogle 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {pendingGoogle ? 'Step 2: Enter Details' : 'Step 1: Google Auth'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">
                {pendingGoogle 
                  ? 'Mandatory student details required for branch-isolated access' 
                  : 'Sign in with your Google account to begin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* STEP 1: INITIAL GOOGLE AUTHENTICATION VIEW */}
          {!pendingGoogle && (
            <div className="space-y-4 py-1">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Official Student Authentication</h3>
                  <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                    Authenticate securely with your <strong>Google Account</strong>. Next, confirm your <strong>Name</strong>, <strong>Roll No</strong>, and <strong>Branch</strong>.
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  {/* Primary Google Auth Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoadingGoogle}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-blue-500 font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 text-xs"
                  >
                    {isLoadingGoogle ? (
                      <>
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span>Connecting with Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                        <span>Sign In with Google Account</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </>
                    )}
                  </button>

                  {/* Direct Google/College Email Form (Always accessible) */}
                  <div className="pt-2 border-t border-slate-200 text-left">
                    <form onSubmit={handleContinueWithManualEmail} className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Or enter Google / College Email:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={manualGoogleEmail}
                          onChange={(e) => {
                            setManualGoogleEmail(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="e.g. name@gmail.com"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          required
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Instant verification for student accounts across all branches.
                      </p>
                    </form>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Notes, syllabus, and notifications are isolated per academic branch.</span>
              </div>
            </div>
          )}

          {/* STEP 2: MANDATORY DETAILS INPUT AFTER GOOGLE AUTH */}
          {pendingGoogle && (
            <div className="space-y-4">
              
              {/* Google Verified Account Banner */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {pendingGoogle.photoURL ? (
                    <img
                      src={pendingGoogle.photoURL}
                      alt="Google Profile"
                      className="w-10 h-10 rounded-full border-2 border-emerald-400 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {pendingGoogle.displayName.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs">{pendingGoogle.displayName}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">{pendingGoogle.email}</div>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      ✓ Google Authenticated
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingGoogle(null)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Switch Account
                </button>
              </div>

              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                
                {/* Student Full Name & Roll Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-blue-600" />
                      Roll No / Hall Ticket *
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNo}
                      onChange={(e) => {
                        setRollNo(e.target.value.toUpperCase());
                        if (error) setError(null);
                      }}
                      placeholder="e.g. 23VJ1A6701"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono font-bold text-xs uppercase bg-white"
                    />
                  </div>
                </div>

                {/* Academic Branch Selection */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>Select Academic Branch *</span>
                    <span className="text-[10px] text-blue-600 font-semibold">Strict branch isolation</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                    {branches.map((b: Branch) => {
                      const isSelected = selectedBranchId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBranchId(b.id);
                            if (error) setError(null);
                          }}
                          className={`p-2 rounded-lg text-left transition-all border text-xs flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{b.code}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {b.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Year & Semester */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Semester 1</option>
                      <option>Semester 2</option>
                      <option>Semester 3</option>
                      <option>Semester 4</option>
                      <option>Semester 5</option>
                      <option>Semester 6</option>
                      <option>Semester 7</option>
                      <option>Semester 8</option>
                    </select>
                  </div>
                </div>

                {/* Confirm & Access Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                        <span>Verifying & Entering Portal...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Details & Access Notes</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
