export type BranchCode = 
  | 'CSE'
  | 'CS-DS'
  | 'CS-AIML'
  | 'AI & DS'
  | 'CS-CyS'
  | 'CS-IOT'
  | 'CSBS'
  | 'IT'
  | 'ECE'
  | 'ECE-VLSI'
  | 'EEE'
  | 'EIE'
  | 'ME'
  | 'CE'
  | 'AE'
  | 'R&AI'
  | 'Bio-Tech';

export interface Branch {
  id: string;
  code: BranchCode | string;
  name: string;
  shortName: string;
  category: 'Computing' | 'Circuits & Systems' | 'Core Engineering' | 'Applied Science';
  description: string;
  color: string;
  totalStudentsCount?: number;
}

export interface Subject {
  id: string;
  branchId: string;
  code: string;
  name: string;
  semester: string;
  year: string;
  description: string;
  syllabusOverview?: string;
  credits?: number;
  totalUnits: number;
}

export interface Unit {
  unitNumber: number; // 1, 2, 3, 4, 5
  title: string;
  description?: string;
  topics?: string[];
}

export type FileFormat = 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'txt' | 'jpg' | 'png' | 'zip';

export interface AcademicNote {
  id: string;
  branchId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  unitNumber: number; // 1 to 5
  title: string;
  description: string;
  fileName: string;
  fileType: FileFormat;
  fileSize: string;
  fileData?: string; // Base64 or rich sample text for download & preview
  contentPreview?: string;
  isShared: boolean; // True = Published to Students, False = Private / Draft
  uploadedByTeacherName: string;
  uploadedByTeacherId: string;
  uploadedDate: string; // ISO string
  lastModifiedDate?: string;
  downloadsCount: number;
  tags?: string[];
  isImportant?: boolean;
}

export interface StudentNotification {
  id: string;
  targetBranchId: string; // ONLY students in this branch receive it!
  title: string;
  message: string;
  noteId: string;
  subjectId: string;
  subjectName: string;
  unitNumber: number;
  teacherName: string;
  timestamp: string;
  readByStudentIds: string[]; // List of student IDs who marked it read
}

export interface StudentUser {
  id: string;
  role: 'student';
  name: string;
  rollNo: string;
  email: string;
  branchId: string;
  branchCode: string;
  year: string;
  semester: string;
  bookmarkedNoteIds: string[];
  photoUrl?: string;
  googleUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherUser {
  id: string;
  role: 'teacher';
  name: string;
  employeeId: string;
  email: string;
  designation: string;
  department: string;
  managedBranchIds: string[];
  activeBranchId: string;
  photoUrl?: string;
  googleUid?: string;
}

export interface BrandingConfig {
  facultyName: string;
  facultyTitle: string;
  designation: string;
  department: string;
  institution: string;
  institutionShort: string;
  portalTitle: string;
  tagline: string;
  announcement: string;
  contactEmail: string;
  officeRoom: string;
  academicYear: string;
  regulation: string; // e.g. "R25 / Autonomous"
}
