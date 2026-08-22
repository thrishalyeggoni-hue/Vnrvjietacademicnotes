import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  setPersistence,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  getDocFromServer,
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AcademicNote, StudentNotification, StudentUser, TeacherUser } from '../types';

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with multi-persistence fallback to prevent IndexedDB closing/hidden errors
let authInstance: ReturnType<typeof getAuth>;
try {
  if (getApps().length > 0) {
    try {
      authInstance = getAuth(app);
    } catch {
      authInstance = initializeAuth(app, {
        persistence: [browserLocalPersistence, browserSessionPersistence, indexedDBLocalPersistence, inMemoryPersistence]
      });
    }
  } else {
    authInstance = initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence, indexedDBLocalPersistence, inMemoryPersistence]
    });
  }
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Initialize Firestore with custom database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Google Auth Provider with account selection
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Error handling enum and interface as per Firebase integration specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test as required by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase is in offline mode or network unavailable.');
    }
    return false;
  }
}

// ----------------- GOOGLE AUTHENTICATION HELPERS -----------------

/**
 * Sign in with Google Popup with automated IndexedDB resilience and error recovery
 */
export async function signInWithGoogle(): Promise<{
  firebaseUser: FirebaseUser | { uid: string; email: string | null; displayName: string | null; photoURL: string | null };
  email: string;
  displayName: string;
  photoURL: string;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      firebaseUser: user,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || '',
    };
  } catch (error: any) {
    console.warn('Google Sign In popup encountered environment constraint:', error);
    
    const errMsg = String(error?.message || error || '').toLowerCase();
    const errCode = String(error?.code || '').toLowerCase();

    // If popup was cancelled or closed intentionally by user, pass it through
    if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
      throw error;
    }

    // Attempt persistence switch if IndexedDB was closing or encountered internal error
    if (
      errMsg.includes('database is closing') ||
      errMsg.includes('database is hidden') ||
      errMsg.includes('indexeddb') ||
      errMsg.includes('internal-error') ||
      errCode.includes('internal-error') ||
      errCode.includes('unauthorized-domain')
    ) {
      try {
        await setPersistence(auth, inMemoryPersistence);
        const retryResult = await signInWithPopup(auth, googleProvider);
        const retryUser = retryResult.user;
        return {
          firebaseUser: retryUser,
          email: retryUser.email || '',
          displayName: retryUser.displayName || retryUser.email?.split('@')[0] || 'User',
          photoURL: retryUser.photoURL || '',
        };
      } catch (retryErr: any) {
        console.warn('Google Sign In popup unavailable in sandboxed domain:', retryErr);
        // Throw categorized error for clean UI fallback without alarm
        const fallbackError = new Error('GOOGLE_POPUP_RESTRICTED');
        (fallbackError as any).code = 'GOOGLE_POPUP_RESTRICTED';
        throw fallbackError;
      }
    }

    throw error;
  }
}

/**
 * Sign out current Firebase user
 */
export async function logOutFirebaseUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
}

// ----------------- USER PROFILES & REGISTERED STUDENTS -----------------

/**
 * Sync Student Profile to Firestore
 */
export async function syncStudentProfileToFirestore(student: StudentUser): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', student.id);
    await setDoc(userDocRef, {
      uid: student.googleUid || student.id,
      id: student.id,
      email: student.email,
      name: student.name,
      role: 'student',
      rollNo: student.rollNo,
      branchId: student.branchId,
      branchCode: student.branchCode,
      year: student.year,
      semester: student.semester,
      photoUrl: student.photoUrl || '',
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Could not sync student profile to Firestore:', error);
  }
}

/**
 * Sync Teacher Profile to Firestore
 */
export async function syncTeacherProfileToFirestore(teacher: TeacherUser): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', teacher.id);
    await setDoc(userDocRef, {
      uid: teacher.googleUid || teacher.id,
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      role: 'teacher',
      employeeId: teacher.employeeId,
      designation: teacher.designation,
      department: teacher.department,
      managedBranchIds: teacher.managedBranchIds,
      activeBranchId: teacher.activeBranchId,
      photoUrl: teacher.photoUrl || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Could not sync teacher profile to Firestore:', error);
  }
}

/**
 * Fetch User Profile from Firestore by UID
 */
export async function fetchUserProfileFromFirestore(uid: string): Promise<any | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.warn('Could not fetch user profile from Firestore:', error);
    return null;
  }
}

/**
 * Fetch all registered students from Firestore for Faculty Directory
 */
export async function fetchRegisteredStudentsFromFirestore(): Promise<StudentUser[]> {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const snap = await getDocs(q);
    const students: StudentUser[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      students.push({
        id: data.id || docSnap.id,
        googleUid: data.uid,
        role: 'student',
        name: data.name || 'Student',
        rollNo: data.rollNo || 'N/A',
        email: data.email || '',
        branchId: data.branchId || 'branch-cse',
        branchCode: data.branchCode || 'CSE',
        year: data.year || '2nd Year',
        semester: data.semester || 'Semester 3',
        photoUrl: data.photoUrl || undefined,
        createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
        bookmarkedNoteIds: [],
      });
    });
    return students;
  } catch (error) {
    console.warn('Could not fetch registered students list from Firestore:', error);
    return [];
  }
}

/**
 * Realtime listener for all registered students
 */
export function subscribeToRegisteredStudents(callback: (students: StudentUser[]) => void): () => void {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students: StudentUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        students.push({
          id: data.id || docSnap.id,
          googleUid: data.uid,
          role: 'student',
          name: data.name || 'Student',
          rollNo: data.rollNo || 'N/A',
          email: data.email || '',
          branchId: data.branchId || 'branch-cse',
          branchCode: data.branchCode || 'CSE',
          year: data.year || '2nd Year',
          semester: data.semester || 'Semester 3',
          photoUrl: data.photoUrl || undefined,
          createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
          bookmarkedNoteIds: [],
        });
      });
      callback(students);
    }, (err) => {
      console.warn('Students snapshot listener error:', err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach students listener:', err);
    return () => {};
  }
}

// ----------------- NOTES FIRESTORE CLOUD SYNC -----------------

/**
 * Sync note to Firestore in background without blocking UI
 */
export async function syncNoteToFirestore(note: AcademicNote): Promise<void> {
  try {
    const noteDocRef = doc(db, 'notes', note.id);
    await setDoc(noteDocRef, {
      ...note,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Could not sync note to Firestore:', error);
  }
}

/**
 * Delete note from Firestore in background
 */
export async function deleteNoteFromFirestore(noteId: string): Promise<void> {
  try {
    const noteDocRef = doc(db, 'notes', noteId);
    await deleteDoc(noteDocRef);
  } catch (error) {
    console.warn('Could not delete note from Firestore:', error);
  }
}

// Boot connection check
if (typeof window !== 'undefined') {
  testConnection();
}
