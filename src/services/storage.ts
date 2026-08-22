import { 
  AcademicNote, 
  Branch, 
  BrandingConfig, 
  StudentNotification, 
  StudentUser, 
  Subject, 
  TeacherUser 
} from '../types';
import { 
  INITIAL_BRANCHES, 
  INITIAL_BRANDING, 
  INITIAL_NOTES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_SUBJECTS, 
  DEMO_STUDENTS, 
  DEMO_TEACHER 
} from './seedData';
import { syncNoteToFirestore, deleteNoteFromFirestore } from './firebase';

const KEYS = {
  BRANDING: 'acad_portal_branding_v1',
  BRANCHES: 'acad_portal_branches_v1',
  SUBJECTS: 'acad_portal_subjects_v1',
  NOTES: 'acad_portal_notes_v2',
  NOTIFICATIONS: 'acad_portal_notifications_v2',
  CURRENT_USER_ROLE: 'acad_portal_current_role_v1',
  CURRENT_STUDENT: 'acad_portal_student_session_v1',
  CURRENT_TEACHER: 'acad_portal_teacher_session_v1',
  SAVED_STUDENTS: 'acad_portal_saved_students_v2',
  FACULTY_PASSCODE: 'acad_portal_faculty_passcode_v1',
  CLEANUP_FLAG: 'acad_portal_demo_cleaned_v2',
};

// Default secure institutional passcode for faculty
export const DEFAULT_FACULTY_PASSCODE = 'FACULTY@2025';

// Listeners for instant reactive updates
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export function subscribeToStorage(callback: StorageListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function notifySubscribers() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

// ----------------- INITIALIZATION -----------------
export function initializeStorage() {
  if (typeof window === 'undefined') return;

  const isCleaned = localStorage.getItem(KEYS.CLEANUP_FLAG);
  if (!isCleaned) {
    localStorage.removeItem('acad_portal_notes_v1');
    localStorage.removeItem('acad_portal_notifications_v1');
    localStorage.removeItem('acad_portal_saved_students_v1');
    localStorage.setItem(KEYS.NOTES, JSON.stringify([]));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.SAVED_STUDENTS, JSON.stringify([]));
    localStorage.setItem(KEYS.CLEANUP_FLAG, 'true');
  }

  const existingBranding = localStorage.getItem(KEYS.BRANDING);
  if (!existingBranding) {
    localStorage.setItem(KEYS.BRANDING, JSON.stringify(INITIAL_BRANDING));
  } else {
    try {
      const parsed = JSON.parse(existingBranding);
      if (parsed.facultyName === '[MAM NAME]' || !parsed.facultyName || parsed.facultyName.includes('[MAM')) {
        localStorage.setItem(KEYS.BRANDING, JSON.stringify(INITIAL_BRANDING));
      }
    } catch {
      localStorage.setItem(KEYS.BRANDING, JSON.stringify(INITIAL_BRANDING));
    }
  }

  if (!localStorage.getItem(KEYS.BRANCHES)) {
    localStorage.setItem(KEYS.BRANCHES, JSON.stringify(INITIAL_BRANCHES));
  }
  if (!localStorage.getItem(KEYS.SUBJECTS)) {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
  }
  
  if (!localStorage.getItem(KEYS.NOTES)) {
    localStorage.setItem(KEYS.NOTES, JSON.stringify([]));
  }

  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
  }

  if (!localStorage.getItem(KEYS.SAVED_STUDENTS)) {
    localStorage.setItem(KEYS.SAVED_STUDENTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(KEYS.FACULTY_PASSCODE)) {
    localStorage.setItem(KEYS.FACULTY_PASSCODE, DEFAULT_FACULTY_PASSCODE);
  }

  const existingTeacher = localStorage.getItem(KEYS.CURRENT_TEACHER);
  if (!existingTeacher || existingTeacher.includes('[MAM NAME]')) {
    localStorage.setItem(KEYS.CURRENT_TEACHER, JSON.stringify(DEMO_TEACHER));
  }
}

// ----------------- FACULTY SECURITY PASSCODE -----------------
export function getFacultyPasscode(): string {
  try {
    return localStorage.getItem(KEYS.FACULTY_PASSCODE) || DEFAULT_FACULTY_PASSCODE;
  } catch {
    return DEFAULT_FACULTY_PASSCODE;
  }
}

export function setFacultyPasscode(newCode: string): void {
  if (typeof window !== 'undefined' && newCode.trim()) {
    localStorage.setItem(KEYS.FACULTY_PASSCODE, newCode.trim());
    notifySubscribers();
  }
}

export function verifyFacultyPasscode(enteredCode: string): boolean {
  const current = getFacultyPasscode();
  return (enteredCode || '').trim() === current.trim();
}

// ----------------- BRANDING -----------------
export function getBranding(): BrandingConfig {
  try {
    const data = localStorage.getItem(KEYS.BRANDING);
    return data ? JSON.parse(data) : INITIAL_BRANDING;
  } catch {
    return INITIAL_BRANDING;
  }
}

export function saveBranding(branding: BrandingConfig): void {
  localStorage.setItem(KEYS.BRANDING, JSON.stringify(branding));
  notifySubscribers();
}

// ----------------- BRANCHES -----------------
export function getBranches(): Branch[] {
  try {
    const data = localStorage.getItem(KEYS.BRANCHES);
    return data ? JSON.parse(data) : INITIAL_BRANCHES;
  } catch {
    return INITIAL_BRANCHES;
  }
}

export function getBranchById(id: string): Branch | undefined {
  return getBranches().find(b => b.id === id);
}

export function getBranchByCode(code: string): Branch | undefined {
  return getBranches().find(b => b.code.toLowerCase() === code.toLowerCase());
}

export function addBranch(branch: Branch): void {
  const branches = getBranches();
  branches.push(branch);
  localStorage.setItem(KEYS.BRANCHES, JSON.stringify(branches));
  notifySubscribers();
}

// ----------------- SUBJECTS -----------------
export function getSubjects(): Subject[] {
  try {
    const data = localStorage.getItem(KEYS.SUBJECTS);
    return data ? JSON.parse(data) : INITIAL_SUBJECTS;
  } catch {
    return INITIAL_SUBJECTS;
  }
}

export function getSubjectsByBranch(branchId: string): Subject[] {
  return getSubjects().filter(s => s.branchId === branchId);
}

export function getSubjectById(subjectId: string): Subject | undefined {
  return getSubjects().find(s => s.id === subjectId);
}

export function addSubject(subject: Subject): void {
  const subjects = getSubjects();
  subjects.push(subject);
  localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  notifySubscribers();
}

export function updateSubject(subject: Subject): void {
  const subjects = getSubjects().map(s => s.id === subject.id ? subject : s);
  localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  notifySubscribers();
}

export function deleteSubject(subjectId: string): void {
  const subjects = getSubjects().filter(s => s.id !== subjectId);
  localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  // Also delete associated notes
  const notes = getNotes().filter(n => n.subjectId !== subjectId);
  localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  notifySubscribers();
}

// ----------------- NOTES (INSTANT ZERO-DELAY OPERATIONS) -----------------
export function getNotes(): AcademicNote[] {
  try {
    const data = localStorage.getItem(KEYS.NOTES);
    return data ? JSON.parse(data) : INITIAL_NOTES;
  } catch {
    return INITIAL_NOTES;
  }
}

/**
 * STRICT BRANCH-BASED ISOLATION & SHARING
 * When onlyShared is true (Student mode):
 * - Returns ONLY notes matching the student's branchId
 * - Returns ONLY notes where isShared === true
 */
export function getNotesByBranch(branchId: string, onlyShared: boolean = false): AcademicNote[] {
  const allNotes = getNotes();
  return allNotes.filter(note => {
    const matchesBranch = note.branchId === branchId;
    if (!matchesBranch) return false;
    if (onlyShared) {
      return note.isShared === true;
    }
    return true;
  });
}

export function getNotesBySubject(subjectId: string, onlyShared: boolean = false): AcademicNote[] {
  const allNotes = getNotes();
  return allNotes.filter(note => {
    const matchesSubject = note.subjectId === subjectId;
    if (!matchesSubject) return false;
    if (onlyShared) {
      return note.isShared === true;
    }
    return true;
  });
}

export function getNoteById(noteId: string): AcademicNote | undefined {
  return getNotes().find(n => n.id === noteId);
}

/**
 * Instant Zero-Delay Note Save
 * Immediately writes to localStorage, notifies subscribers, and syncs to Firestore in background.
 */
export function saveNote(note: AcademicNote): void {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === note.id);
  const wasAlreadyShared = index >= 0 ? notes[index].isShared : false;

  const updatedNote = {
    ...note,
    lastModifiedDate: new Date().toISOString(),
  };

  if (index >= 0) {
    notes[index] = updatedNote;
  } else {
    notes.unshift(updatedNote);
  }
  
  // 1. Instant local synchronous update (0 ms latency)
  localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));

  // 2. If newly shared/published, automatically trigger a notification to this branch!
  if (note.isShared && !wasAlreadyShared) {
    createShareNotification(note);
  }

  // 3. Immediately broadcast to all active components
  notifySubscribers();

  // 4. Background cloud sync to Firestore (non-blocking)
  syncNoteToFirestore(updatedNote).catch(err => {
    console.warn('Background Firestore sync failed:', err);
  });
}

/**
 * Instant Zero-Delay Save for Multiple Notes in a Single Batch (e.g. multi-file upload for a Unit)
 */
export function saveMultipleNotes(newNotes: AcademicNote[]): void {
  if (!newNotes || newNotes.length === 0) return;
  const notes = getNotes();

  newNotes.forEach(note => {
    const index = notes.findIndex(n => n.id === note.id);
    const wasAlreadyShared = index >= 0 ? notes[index].isShared : false;
    const updatedNote = {
      ...note,
      lastModifiedDate: new Date().toISOString(),
    };

    if (index >= 0) {
      notes[index] = updatedNote;
    } else {
      notes.unshift(updatedNote);
    }

    if (note.isShared && !wasAlreadyShared) {
      createShareNotification(note);
    }

    // Sync to Firestore in background
    syncNoteToFirestore(updatedNote).catch(err => {
      console.warn('Background Firestore sync failed for note:', note.id, err);
    });
  });

  localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  notifySubscribers();
}

/**
 * Bulk Toggle Sharing for All Notes in a Specific Unit of a Subject
 */
export function bulkToggleUnitNotesShare(subjectId: string, unitNumber: number, isShared: boolean): void {
  const notes = getNotes();
  let modifiedCount = 0;

  notes.forEach(note => {
    if (note.subjectId === subjectId && note.unitNumber === unitNumber) {
      const wasShared = note.isShared;
      if (wasShared !== isShared) {
        note.isShared = isShared;
        note.lastModifiedDate = new Date().toISOString();
        modifiedCount++;

        if (isShared && !wasShared) {
          createShareNotification(note);
        }

        syncNoteToFirestore(note).catch(err => console.warn('Sync failed:', err));
      }
    }
  });

  if (modifiedCount > 0) {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
    notifySubscribers();
  }
}

/**
 * Instant Toggle Share
 */
export function toggleNoteShare(noteId: string, isShared: boolean): void {
  const notes = getNotes();
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  const wasShared = note.isShared;
  note.isShared = isShared;
  note.lastModifiedDate = new Date().toISOString();

  // Instant local write
  localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));

  if (isShared && !wasShared) {
    createShareNotification(note);
  }

  notifySubscribers();

  // Background sync
  syncNoteToFirestore(note).catch(err => console.warn('Sync failed:', err));
}

/**
 * Instant Zero-Delay Note Delete
 */
export function deleteNote(noteId: string): void {
  const notes = getNotes().filter(n => n.id !== noteId);
  
  // 1. Instant local removal (0 ms latency)
  localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  
  // 2. Instant notification
  notifySubscribers();

  // 3. Background Firestore removal
  deleteNoteFromFirestore(noteId).catch(err => {
    console.warn('Background Firestore delete error:', err);
  });
}

export function recordNoteDownload(noteId: string): void {
  const notes = getNotes();
  const note = notes.find(n => n.id === noteId);
  if (note) {
    note.downloadsCount = (note.downloadsCount || 0) + 1;
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
    notifySubscribers();
  }
}

// ----------------- NOTIFICATIONS -----------------
export function getNotifications(): StudentNotification[] {
  try {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function getNotificationsForBranch(branchId: string): StudentNotification[] {
  return getNotifications().filter(n => n.targetBranchId === branchId);
}

export function getUnreadNotificationCount(branchId: string, studentId: string): number {
  const branchNotifs = getNotificationsForBranch(branchId);
  return branchNotifs.filter(n => !n.readByStudentIds.includes(studentId)).length;
}

export function markNotificationRead(notificationId: string, studentId: string): void {
  const notifs = getNotifications();
  const notif = notifs.find(n => n.id === notificationId);
  if (notif && !notif.readByStudentIds.includes(studentId)) {
    notif.readByStudentIds.push(studentId);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    notifySubscribers();
  }
}

export function markAllNotificationsRead(branchId: string, studentId: string): void {
  const notifs = getNotifications();
  let changed = false;
  notifs.forEach(n => {
    if (n.targetBranchId === branchId && !n.readByStudentIds.includes(studentId)) {
      n.readByStudentIds.push(studentId);
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    notifySubscribers();
  }
}

function createShareNotification(note: AcademicNote): void {
  const branch = getBranchById(note.branchId);
  const branchName = branch ? branch.shortName : 'Branch';
  const branding = getBranding();
  const teacherDisplayName = note.uploadedByTeacherName || branding.facultyName;

  const newNotification: StudentNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    targetBranchId: note.branchId,
    title: `New Notes Shared: ${note.subjectName} (Unit ${note.unitNumber})`,
    message: `${teacherDisplayName} shared "${note.title}" for ${branchName} students.`,
    noteId: note.id,
    subjectId: note.subjectId,
    subjectName: note.subjectName,
    unitNumber: note.unitNumber,
    teacherName: teacherDisplayName,
    timestamp: new Date().toISOString(),
    readByStudentIds: [],
  };

  const notifs = getNotifications();
  notifs.unshift(newNotification);
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
}

// ----------------- SESSIONS & AUTH & REGISTERED STUDENTS -----------------
export function getCurrentRole(): 'student' | 'teacher' | null {
  try {
    return (localStorage.getItem(KEYS.CURRENT_USER_ROLE) as 'student' | 'teacher') || null;
  } catch {
    return null;
  }
}

export function getCurrentStudent(): StudentUser | null {
  try {
    const data = localStorage.getItem(KEYS.CURRENT_STUDENT);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentStudent(student: StudentUser): void {
  localStorage.setItem(KEYS.CURRENT_USER_ROLE, 'student');
  localStorage.setItem(KEYS.CURRENT_STUDENT, JSON.stringify(student));
  
  // Also save in saved students roster
  const saved = getSavedStudents();
  const idx = saved.findIndex(s => s.id === student.id || s.rollNo.toUpperCase() === student.rollNo.toUpperCase());
  if (idx >= 0) {
    saved[idx] = { ...saved[idx], ...student };
  } else {
    saved.unshift(student);
  }
  localStorage.setItem(KEYS.SAVED_STUDENTS, JSON.stringify(saved));
  
  notifySubscribers();
}

export function getSavedStudents(): StudentUser[] {
  try {
    const data = localStorage.getItem(KEYS.SAVED_STUDENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getCurrentTeacher(): TeacherUser | null {
  try {
    const data = localStorage.getItem(KEYS.CURRENT_TEACHER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentTeacher(teacher: TeacherUser): void {
  localStorage.setItem(KEYS.CURRENT_USER_ROLE, 'teacher');
  localStorage.setItem(KEYS.CURRENT_TEACHER, JSON.stringify(teacher));
  notifySubscribers();
}

export function updateTeacherActiveBranch(branchId: string): void {
  const teacher = getCurrentTeacher();
  if (teacher) {
    teacher.activeBranchId = branchId;
    setCurrentTeacher(teacher);
  }
}

export function toggleStudentBookmark(studentId: string, noteId: string): void {
  const student = getCurrentStudent();
  if (student && student.id === studentId) {
    const bookmarks = student.bookmarkedNoteIds || [];
    if (bookmarks.includes(noteId)) {
      student.bookmarkedNoteIds = bookmarks.filter(id => id !== noteId);
    } else {
      student.bookmarkedNoteIds = [...bookmarks, noteId];
    }
    setCurrentStudent(student);
  }
}

export function logout(): void {
  localStorage.removeItem(KEYS.CURRENT_USER_ROLE);
  localStorage.removeItem(KEYS.CURRENT_STUDENT);
  localStorage.removeItem(KEYS.CURRENT_TEACHER);
  notifySubscribers();
}

export const clearAuthSession = logout;

// ----------------- REAL BROWSER DOWNLOAD GENERATOR -----------------
export function triggerFileDownload(note: AcademicNote): void {
  recordNoteDownload(note.id);

  let blob: Blob;
  let filename = note.fileName || `${note.title.replace(/[^a-z0-9]/gi, '_')}.${note.fileType || 'pdf'}`;

  if (note.fileData && note.fileData.startsWith('data:')) {
    const parts = note.fileData.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    blob = new Blob([uInt8Array], { type: contentType });
  } else {
    const branding = getBranding();
    const branch = getBranchById(note.branchId);
    const content = `================================================================================
${branding.institution}
${branding.department}
================================================================================
COURSE: ${note.subjectName} (${note.subjectCode})
BRANCH: ${branch?.name || note.branchId} (${branch?.code || ''})
UNIT: Unit ${note.unitNumber}
TOPIC: ${note.title}
FACULTY: ${note.uploadedByTeacherName}
DATE: ${new Date(note.uploadedDate).toLocaleDateString()}
================================================================================

ACADEMIC DESCRIPTION:
${note.description}

CONTENT / LECTURE NOTES SUMMARY:
${note.contentPreview || 'Detailed lecture notes and curriculum supplement.'}

================================================================================
Generated via ${branding.portalTitle}
Official Academic Repository - ${branding.regulation}
================================================================================
`;
    blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
