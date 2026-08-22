import React, { useState, useMemo, useEffect } from 'react';
import { AcademicNote, Branch, Subject, TeacherUser, FileFormat, StudentUser } from '../types';
import { 
  getBranches, 
  getNotesByBranch, 
  getSubjectsByBranch, 
  toggleNoteShare, 
  bulkToggleUnitNotesShare,
  deleteNote, 
  triggerFileDownload, 
  getNotificationsForBranch,
  getBranding,
  subscribeToStorage,
  getSavedStudents
} from '../services/storage';
import { fetchRegisteredStudentsFromFirestore, subscribeToRegisteredStudents } from '../services/firebase';
import { 
  ShieldCheck, 
  Upload, 
  BookOpen, 
  Share2, 
  Lock, 
  Eye, 
  Download, 
  Edit3, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Bell, 
  Check, 
  UserCheck, 
  Building2,
  FileText,
  ArrowLeft,
  Users,
  GraduationCap,
  Mail,
  Calendar,
  FileDown,
  RefreshCw,
  Zap,
  CheckCircle2,
  Sparkles,
  Unlock
} from 'lucide-react';
import { UploadNoteModal } from './UploadNoteModal';
import { NotePreviewModal } from './NotePreviewModal';
import { ManageSubjectsModal } from './ManageSubjectsModal';

interface TeacherDashboardProps {
  teacher: TeacherUser;
  onSwitchBranch: (branchId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacher,
  onSwitchBranch,
}) => {
  const branches = getBranches();
  const branding = getBranding();

  const activeBranch = branches.find(b => b.id === teacher.activeBranchId) || branches[0] || {
    id: 'branch-cse',
    code: 'CSE',
    name: 'Computer Science and Engineering',
    color: '#3B82F6',
  };

  const [activeTab, setActiveTab] = useState<'notes' | 'subjects' | 'broadcasts' | 'students'>('notes');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'all'>('all');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'shared' | 'private'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'unit-matrix'>('unit-matrix');
  const [searchQuery, setSearchQuery] = useState('');

  // Student directory filters
  const [studentBranchFilter, setStudentBranchFilter] = useState<string>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [registeredStudents, setRegisteredStudents] = useState<StudentUser[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Storage update counter to trigger instantaneous re-renders
  const [storageVersion, setStorageVersion] = useState(0);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialSubjectId, setUploadInitialSubjectId] = useState<string | undefined>(undefined);
  const [uploadInitialUnitNumber, setUploadInitialUnitNumber] = useState<number | undefined>(undefined);
  const [editingNote, setEditingNote] = useState<AcademicNote | null>(null);
  const [previewNote, setPreviewNote] = useState<AcademicNote | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isManageSubjectsOpen, setIsManageSubjectsOpen] = useState(false);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<AcademicNote | null>(null);

  // Success toast for 1-click share
  const [shareSuccessToast, setShareSuccessToast] = useState<{ message: string; branchCode: string } | null>(null);

  // Subscribe to storage changes for instant zero-delay updates across all tabs
  useEffect(() => {
    const unsubscribe = subscribeToStorage(() => {
      setStorageVersion(v => v + 1);
    });
    return unsubscribe;
  }, []);

  // Fetch registered students from Firestore + local cache
  const loadStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const localSaved = getSavedStudents();
      const remoteStudents = await fetchRegisteredStudentsFromFirestore();
      
      // Merge unique by rollNo / email / id
      const studentMap = new Map<string, StudentUser>();
      localSaved.forEach(s => studentMap.set(s.rollNo.toUpperCase() || s.id, s));
      remoteStudents.forEach(s => studentMap.set(s.rollNo.toUpperCase() || s.id, s));

      const merged = Array.from(studentMap.values());
      setRegisteredStudents(merged);
    } catch (e) {
      console.warn('Error loading registered students:', e);
      setRegisteredStudents(getSavedStudents());
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();

    // Attach real-time listener for registered students from Firestore
    const unsubStudents = subscribeToRegisteredStudents((remoteStudents) => {
      const localSaved = getSavedStudents();
      const studentMap = new Map<string, StudentUser>();
      localSaved.forEach(s => studentMap.set(s.rollNo.toUpperCase() || s.id, s));
      remoteStudents.forEach(s => studentMap.set(s.rollNo.toUpperCase() || s.id, s));
      setRegisteredStudents(Array.from(studentMap.values()));
    });

    return unsubStudents;
  }, []);

  // Retrieve subjects and notes for active branch (re-evaluates immediately on storageVersion change)
  const subjects = useMemo(() => getSubjectsByBranch(activeBranch.id), [activeBranch.id, storageVersion]);
  const branchNotes = useMemo(() => getNotesByBranch(activeBranch.id, false), [activeBranch.id, storageVersion]);
  const branchNotifications = useMemo(() => getNotificationsForBranch(activeBranch.id), [activeBranch.id, storageVersion]);

  // Active selected subject object if filtered
  const activeSubjectObj = useMemo(() => {
    return selectedSubjectId !== 'all' ? subjects.find(s => s.id === selectedSubjectId) : null;
  }, [selectedSubjectId, subjects]);

  // Statistics for active branch
  const stats = useMemo(() => {
    const published = branchNotes.filter(n => n.isShared).length;
    const privateDrafts = branchNotes.filter(n => !n.isShared).length;
    return {
      published,
      privateDrafts,
      subjectsCount: subjects.length,
    };
  }, [branchNotes, subjects]);

  // Filtered notes for teacher list
  const filteredNotes = useMemo(() => {
    return branchNotes.filter(note => {
      if (selectedSubjectId !== 'all' && note.subjectId !== selectedSubjectId) {
        return false;
      }
      if (selectedUnitFilter !== 'all' && note.unitNumber !== selectedUnitFilter) {
        return false;
      }
      if (statusFilter === 'shared' && !note.isShared) {
        return false;
      }
      if (statusFilter === 'private' && note.isShared) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(q);
        const matchDesc = note.description.toLowerCase().includes(q);
        const matchSub = note.subjectName.toLowerCase().includes(q) || note.subjectCode.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSub) {
          return false;
        }
      }
      return true;
    });
  }, [branchNotes, selectedSubjectId, selectedUnitFilter, statusFilter, searchQuery]);

  // Filtered registered students for Faculty Directory
  const filteredStudents = useMemo(() => {
    return registeredStudents.filter(student => {
      if (studentBranchFilter !== 'all' && student.branchId !== studentBranchFilter) {
        return false;
      }
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase();
        const matchName = (student.name || '').toLowerCase().includes(q);
        const matchRoll = (student.rollNo || '').toLowerCase().includes(q);
        const matchEmail = (student.email || '').toLowerCase().includes(q);
        const matchBranch = (student.branchCode || '').toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchEmail && !matchBranch) {
          return false;
        }
      }
      return true;
    });
  }, [registeredStudents, studentBranchFilter, studentSearchQuery]);

  // Branch-wise distribution count
  const studentsCountByBranch = useMemo(() => {
    const counts: Record<string, number> = {};
    branches.forEach(b => {
      counts[b.id] = 0;
    });
    registeredStudents.forEach(s => {
      if (counts[s.branchId] !== undefined) {
        counts[s.branchId] += 1;
      } else {
        counts[s.branchId] = 1;
      }
    });
    return counts;
  }, [registeredStudents, branches]);

  // 1-Click Instant Share / Unshare (0ms local + background firestore sync)
  const handleToggleShare = (noteId: string, currentSharedState: boolean) => {
    const note = branchNotes.find(n => n.id === noteId);
    toggleNoteShare(noteId, !currentSharedState);

    if (!currentSharedState && note) {
      setShareSuccessToast({
        message: `Unit ${note.unitNumber} (${note.title}) is now live for ${activeBranch.code} students!`,
        branchCode: activeBranch.code,
      });
      setTimeout(() => setShareSuccessToast(null), 4000);
    }
  };

  // Bulk toggle for all files under a specific unit of a course
  const handleBulkToggleUnit = (subjectId: string, unitNumber: number, share: boolean, subjectCode: string) => {
    bulkToggleUnitNotesShare(subjectId, unitNumber, share);
    setShareSuccessToast({
      message: `All Unit ${unitNumber} files for ${subjectCode} are now ${share ? `live for ${activeBranch.code} students` : 'moved to private vault'}!`,
      branchCode: activeBranch.code,
    });
    setTimeout(() => setShareSuccessToast(null), 4000);
  };

  const handleOpenPreview = (note: AcademicNote) => {
    setPreviewNote(note);
    setIsPreviewOpen(true);
  };

  const handleOpenEdit = (note: AcademicNote) => {
    setEditingNote(note);
    setUploadInitialSubjectId(note.subjectId);
    setUploadInitialUnitNumber(note.unitNumber);
    setIsUploadOpen(true);
  };

  const handleOpenUpload = (subId?: string, unit?: number) => {
    setEditingNote(null);
    setUploadInitialSubjectId(subId);
    setUploadInitialUnitNumber(unit);
    setIsUploadOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmNote) {
      deleteNote(deleteConfirmNote.id);
      setDeleteConfirmNote(null);
    }
  };

  const handleExportStudentsCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['Name', 'Roll Number', 'Branch Code', 'Year', 'Semester', 'Google Email', 'Registration Date'];
    const rows = filteredStudents.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.rollNo}"`,
      `"${s.branchCode || ''}"`,
      `"${s.year || ''}"`,
      `"${s.semester || ''}"`,
      `"${s.email || ''}"`,
      `"${s.createdAt ? new Date(s.createdAt).toLocaleString() : 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registered_students_${studentBranchFilter === 'all' ? 'all_branches' : studentBranchFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFormatBadge = (type: FileFormat) => {
    switch (type) {
      case 'pdf':
        return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] uppercase">PDF</span>;
      case 'docx':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px] uppercase">DOCX</span>;
      case 'pptx':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px] uppercase">PPTX</span>;
      case 'xlsx':
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase">XLSX</span>;
      case 'txt':
        return <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px] uppercase">TXT</span>;
      case 'jpg':
      case 'png':
        return <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[10px] uppercase">IMG</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">

      {/* Floating 1-Click Instant Share Notification Banner */}
      {shareSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-emerald-100 px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>Published Instantly to {shareSuccessToast.branchCode} Students</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <p className="text-emerald-200/90 text-[11px] mt-0.5">{shareSuccessToast.message}</p>
          </div>
          <button
            onClick={() => setShareSuccessToast(null)}
            className="text-emerald-400 hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Branch Management Switcher Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Faculty Management Console
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-700">{branding.facultyName}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            Managing Branch: <span className="text-emerald-700">{activeBranch.code} ({activeBranch.name})</span>
          </h1>
        </div>

        {/* Branch Switcher Select & Upload Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Switch Branch:</label>
          <select
            value={activeBranch.id}
            onChange={(e) => onSwitchBranch(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs text-slate-900 cursor-pointer"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.code} — {b.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleOpenUpload()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Attach Note to Vault
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics Grid (Without Total Notes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Published Live Units */}
        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span>Live for Students</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{stats.published}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Active in {activeBranch.code} portal</div>
        </div>

        {/* Card 2: Private Faculty Vault */}
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="text-xs font-bold text-amber-800 flex items-center justify-between">
            <span>Private Faculty Vault</span>
            <Lock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1">{stats.privateDrafts}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Ready to 1-click share without re-uploading</div>
        </div>

        {/* Card 3: Enrolled Students */}
        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="text-xs font-bold text-blue-800 flex items-center justify-between">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1">
            {studentsCountByBranch[activeBranch.id] || 0}
          </div>
          <div className="text-[11px] text-blue-700 mt-0.5">
            {registeredStudents.length} total in university directory
          </div>
        </div>

        {/* Card 4: Academic Subjects */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Curriculum Subjects</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.subjectsCount}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsManageSubjectsOpen(true)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 text-left mt-1 hover:underline cursor-pointer"
          >
            + Manage Courses &rarr;
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Unit Publishing & Faculty Vault
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {stats.published} Live / {stats.privateDrafts} Vault
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            Registered Students Directory
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              {registeredStudents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'subjects'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Curriculum Courses ({subjects.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcasts')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'broadcasts'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Branch Broadcasts ({branchNotifications.length})
          </button>
        </div>
      </div>

      {/* TAB 1: MANAGE NOTES & 5-UNITS AUTO-PUBLISHING MANAGER */}
      {activeTab === 'notes' && (
        <div className="space-y-5">

          {/* Unit-by-Unit Auto-Publishing Workflow Guide Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                  <span>Unit-by-Unit Selective Publishing (Private Faculty Vault)</span>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">Zero Re-uploading Required</span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  You can prepare and store all 5 units in your private vault in advance. Whenever a unit starts in class, click <strong>"1-Click Share"</strong> to make it instantly visible to {activeBranch.code} students with automated broadcast notifications.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'unit-matrix' ? 'list' : 'unit-matrix')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {viewMode === 'unit-matrix' ? (
                  <>
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Switch to List View</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Switch to 5-Units Hub</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes by title, topic, or subject..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Subject filter */}
              <div className="md:col-span-4">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">All Subjects ({subjects.length})</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="md:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">All Visibility (Live & Vault)</option>
                  <option value="shared">🟢 Live / Shared with Students ({stats.published})</option>
                  <option value="private">🔒 Private Vault Drafts ({stats.privateDrafts})</option>
                </select>
              </div>
            </div>

            {/* Sub-Filters / Unit Filters */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-semibold mr-1">Filter Unit:</span>
              <button
                type="button"
                onClick={() => setSelectedUnitFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedUnitFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Units
              </button>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedUnitFilter(num)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedUnitFilter === num
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Unit {num}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-3 text-xs">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <strong>{stats.published}</strong> Live
                </span>
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  <strong>{stats.privateDrafts}</strong> in Vault
                </span>
              </div>
            </div>
          </div>

          {/* VIEW 1: INTERACTIVE 5-UNITS PUBLISHING HUB */}
          {viewMode === 'unit-matrix' && (
            <div className="space-y-6">
              {(selectedSubjectId === 'all' ? subjects : subjects.filter(s => s.id === selectedSubjectId)).map(subject => {
                const subjectNotes = branchNotes.filter(n => n.subjectId === subject.id);
                const publishedUnitsCount = subjectNotes.filter(n => n.isShared).length;

                return (
                  <div key={subject.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                    
                    {/* Subject Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          {subject.code.substring(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700 text-xs">{subject.code}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{subject.year} / {subject.semester}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">{subject.name}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                          {publishedUnitsCount} / 5 Units Shared
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenUpload(subject.id)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Attach Note</span>
                        </button>
                      </div>
                    </div>

                    {/* 5-Units Multi-File Progression Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                      {[1, 2, 3, 4, 5].map(unitNum => {
                        const unitNotes = subjectNotes.filter(n => n.unitNumber === unitNum);
                        const totalCount = unitNotes.length;
                        const liveCount = unitNotes.filter(n => n.isShared).length;
                        const vaultCount = unitNotes.filter(n => !n.isShared).length;

                        return (
                          <div
                            key={unitNum}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between min-h-[220px] ${
                              totalCount === 0
                                ? 'bg-slate-50/70 border-dashed border-slate-200'
                                : liveCount > 0 && vaultCount === 0
                                ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                                : liveCount === 0 && vaultCount > 0
                                ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                                : 'bg-indigo-50/30 border-indigo-200 shadow-2xs'
                            }`}
                          >
                            <div>
                              {/* Unit Header Badge */}
                              <div className="flex items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-slate-200/60">
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                  <span>Unit {unitNum}</span>
                                  {totalCount > 1 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
                                      {totalCount} files
                                    </span>
                                  )}
                                </span>

                                {totalCount === 0 ? (
                                  <span className="text-[10px] text-slate-400 font-medium">Empty</span>
                                ) : liveCount > 0 && vaultCount === 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    {totalCount === 1 ? 'Live' : `${totalCount} Live`}
                                  </span>
                                ) : liveCount === 0 && vaultCount > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-0.5">
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    {totalCount === 1 ? 'Vault' : `${totalCount} in Vault`}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px]">
                                    {liveCount} Live • {vaultCount} Vault
                                  </span>
                                )}
                              </div>

                              {/* Unit Content: Multiple Files List */}
                              {totalCount === 0 ? (
                                <div className="py-5 text-center">
                                  <p className="text-[11px] text-slate-400 italic">
                                    No files attached for Unit {unitNum} yet.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                                  {unitNotes.map((note) => (
                                    <div
                                      key={note.id}
                                      className={`p-2 rounded-lg border text-xs transition-all ${
                                        note.isShared
                                          ? 'bg-white border-emerald-200 hover:border-emerald-400 shadow-2xs'
                                          : 'bg-white border-amber-200 hover:border-amber-400 shadow-2xs'
                                      }`}
                                    >
                                      {/* Note Title & Format */}
                                      <div className="flex items-start justify-between gap-1.5">
                                        <div className="min-w-0">
                                          <div className="font-semibold text-slate-900 text-[11px] line-clamp-2 leading-tight flex items-center gap-1">
                                            {note.isImportant && (
                                              <span title="Exam Essential" className="text-amber-500 shrink-0">⭐</span>
                                            )}
                                            <span>{note.title}</span>
                                          </div>
                                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                            {getFormatBadge(note.fileType)}
                                            <span className="truncate">{note.fileSize}</span>
                                          </div>
                                        </div>

                                        {/* Action Icon buttons */}
                                        <div className="flex items-center gap-0.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenPreview(note)}
                                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 cursor-pointer"
                                            title="Preview File"
                                          >
                                            <Eye className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => triggerFileDownload(note)}
                                            className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100 cursor-pointer"
                                            title="Download File"
                                          >
                                            <Download className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEdit(note)}
                                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                                            title="Edit Note"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeleteConfirmNote(note)}
                                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                            title="Delete File"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Individual 1-Click Share Toggle */}
                                      <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                                        {note.isShared ? (
                                          <button
                                            type="button"
                                            onClick={() => handleToggleShare(note.id, true)}
                                            className="w-full py-1 px-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                                            title="Move this file to private faculty vault"
                                          >
                                            <Lock className="w-2.5 h-2.5 text-amber-600" />
                                            <span>Live (Click to Vault)</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleToggleShare(note.id, false)}
                                            className="w-full py-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                            title={`Publish to ${activeBranch.code} students immediately`}
                                          >
                                            <Zap className="w-2.5 h-2.5 text-emerald-200" />
                                            <span>1-Click Share</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions / Unit Bottom Toolbar */}
                            <div className="pt-2 border-t border-slate-200/60 mt-2 space-y-1.5">
                              {/* Quick Attach More Files Trigger */}
                              <button
                                type="button"
                                onClick={() => handleOpenUpload(subject.id, unitNum)}
                                className={`w-full py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  totalCount === 0
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200'
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>{totalCount === 0 ? `Attach Notes` : `+ Add File`}</span>
                              </button>

                              {/* Bulk Unit Actions (when 2 or more files exist in this unit) */}
                              {totalCount >= 2 && (
                                <div className="flex items-center gap-1 pt-0.5">
                                  {vaultCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleBulkToggleUnit(subject.id, unitNum, true, subject.code)}
                                      className="flex-1 py-1 px-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                                      title="Publish all files under this unit to students at once"
                                    >
                                      <Zap className="w-2.5 h-2.5 text-emerald-700" />
                                      <span>Share All ({totalCount})</span>
                                    </button>
                                  )}

                                  {liveCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleBulkToggleUnit(subject.id, unitNum, false, subject.code)}
                                      className="flex-1 py-1 px-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                                      title="Move all files under this unit to private vault"
                                    >
                                      <Lock className="w-2.5 h-2.5 text-amber-700" />
                                      <span>Vault All ({totalCount})</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: COMPREHENSIVE NOTES LIST */}
          {viewMode === 'list' && (
            <div>
              {filteredNotes.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <BookOpen className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    No course notes match your filter
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Pre-load notes into your private faculty vault or attach a note to any course.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenUpload()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Attach Note to Vault
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all bg-white shadow-2xs ${
                        note.isShared
                          ? 'border-emerald-200 hover:border-emerald-300'
                          : 'border-amber-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        {/* Note details */}
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            note.isShared ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {note.fileType === 'pdf' ? (
                              <FileText className="w-5 h-5 text-rose-600" />
                            ) : (
                              <BookOpen className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {getFormatBadge(note.fileType)}
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                {note.subjectCode}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                Unit {note.unitNumber}
                              </span>
                              {note.isShared ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Live for Students
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Private Faculty Vault
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                              {note.title}
                            </h3>

                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {note.description}
                            </p>

                            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 flex-wrap">
                              <span>File: <strong className="text-slate-600">{note.fileName}</strong> ({note.fileSize})</span>
                              <span>•</span>
                              <span>Uploaded: {new Date(note.uploadedDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>Downloads: {note.downloadsCount || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Toolbar with 1-Click Share */}
                        <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex-wrap sm:flex-nowrap justify-end">
                          
                          {/* 1-Click Instant Share button */}
                          <button
                            type="button"
                            onClick={() => handleToggleShare(note.id, note.isShared)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                              note.isShared
                                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                            title={note.isShared ? 'Move to private vault' : 'Publish to branch students with 1-click'}
                          >
                            {note.isShared ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Move to Vault</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 text-emerald-200" />
                                <span>1-Click Share to Students</span>
                              </>
                            )}
                          </button>

                          {/* Preview button */}
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewNote(note);
                              setIsPreviewOpen(true);
                            }}
                            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                            title="Preview Note"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Download button */}
                          <button
                            type="button"
                            onClick={() => triggerFileDownload(note)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                            title="Download Note File"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(note)}
                            className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                            title="Edit Note Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmNote(note)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: REGISTERED STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          
          {/* Header & Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Official Student Enrolment & Profiles
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time database of students authenticated via Google Sign-In with mandatory Roll No and Branch assignment.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={loadStudents}
                  disabled={isLoadingStudents}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Refresh Student Roster"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStudents ? 'animate-spin' : ''}`} />
                  <span>Sync Directory</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportStudentsCSV}
                  disabled={filteredStudents.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Export Roster CSV</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
              {/* Search */}
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search students by name, roll no / hall ticket, email..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Branch Filter */}
              <div className="md:col-span-6">
                <select
                  value={studentBranchFilter}
                  onChange={(e) => setStudentBranchFilter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All Branches ({registeredStudents.length} Students Total)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name} ({studentsCountByBranch[b.id] || 0} registered)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Branch Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-500 font-semibold shrink-0 mr-1">Filter Branch:</span>
              <button
                type="button"
                onClick={() => setStudentBranchFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                  studentBranchFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Branches ({registeredStudents.length})
              </button>
              {branches.map(b => {
                const count = studentsCountByBranch[b.id] || 0;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setStudentBranchFilter(b.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      studentBranchFilter === b.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{b.code}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${studentBranchFilter === b.id ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Roster Table / Cards */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No registered students found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {studentBranchFilter !== 'all'
                  ? `No students have authenticated with Google and selected this branch yet.`
                  : `No students have registered yet. As students sign in via Google and complete their roll numbers, their full profiles will appear here automatically in real time.`}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Displaying {filteredStudents.length} Registered Students</span>
                <span className="text-slate-400 font-normal">Official Academic Database</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Student Profile</th>
                      <th className="py-3 px-4">Roll / Hall Ticket No</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Academic Year</th>
                      <th className="py-3 px-4">Google Account</th>
                      <th className="py-3 px-4 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => {
                      const branchObj = branches.find(b => b.id === student.branchId);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* Student Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {student.photoUrl ? (
                                <img
                                  src={student.photoUrl}
                                  alt={student.name}
                                  className="w-9 h-9 rounded-full object-cover border border-blue-300 shadow-2xs"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{student.name}</span>
                                  {student.googleUid && (
                                    <span title="Verified Google Account" className="inline-block">
                                      <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24">
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
                                <div className="text-[11px] text-slate-400 font-mono">ID: {student.id.substring(0, 16)}</div>
                              </div>
                            </div>
                          </td>

                          {/* Roll Number / Hall Ticket */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-mono font-bold text-xs tracking-wider">
                              {student.rollNo}
                            </span>
                          </td>

                          {/* Branch Badge */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">
                                {branchObj ? branchObj.code : student.branchCode}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                {branchObj?.name || 'Department'}
                              </span>
                            </div>
                          </td>

                          {/* Academic Year & Semester */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-medium">
                              {student.year}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold">
                              {student.semester}
                            </div>
                          </td>

                          {/* Google Email */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{student.email || 'N/A'}</span>
                            </div>
                          </td>

                          {/* Date Registered */}
                          <td className="py-3.5 px-4 text-right text-slate-500">
                            {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Active'}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: CURRICULUM SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Curriculum Courses for {activeBranch.code}
              </h2>
              <p className="text-xs text-slate-500">
                {subjects.length} subjects defined for {activeBranch.name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsManageSubjectsOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add / Modify Subjects
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub) => {
              const subNotes = branchNotes.filter(n => n.subjectId === sub.id);
              const publishedCount = subNotes.filter(n => n.isShared).length;
              const vaultCount = subNotes.length - publishedCount;

              return (
                <div
                  key={sub.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-xs">
                      {sub.code}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{sub.year}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {sub.name}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {sub.description}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-bold">{publishedCount} Shared</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-amber-700 font-bold">{vaultCount} in Vault</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubjectId(sub.id);
                          setViewMode('unit-matrix');
                          setActiveTab('notes');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3 h-3" /> 5-Units Hub
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenUpload(sub.id)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Pre-load Note
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST NOTIFICATIONS LOG */}
      {activeTab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Targeted Broadcast Notifications Log
              </h2>
              <p className="text-xs text-slate-500">
                Whenever you share notes with {activeBranch.code}, students in this branch receive instant notifications.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {branchNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No notifications logged for {activeBranch.code} yet.
              </div>
            ) : (
              branchNotifications.map(notif => (
                <div key={notif.id} className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs">{notif.title}</span>
                      <span className="text-[10px] text-slate-400">{new Date(notif.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>Target: <strong className="text-slate-700 font-semibold">{activeBranch.code} Students</strong></span>
                      <span>•</span>
                      <span>Sent by: {notif.teacherName}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upload Note Modal */}
      <UploadNoteModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setEditingNote(null);
          setUploadInitialSubjectId(undefined);
          setUploadInitialUnitNumber(undefined);
        }}
        initialBranchId={activeBranch.id}
        initialSubjectId={uploadInitialSubjectId}
        initialUnitNumber={uploadInitialUnitNumber}
        editingNote={editingNote}
        onSuccess={() => {
          setStorageVersion(v => v + 1);
        }}
      />

      {/* Note Preview Modal */}
      <NotePreviewModal
        note={previewNote}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onShareToggle={handleToggleShare}
        isTeacher={true}
      />

      {/* Manage Subjects Modal */}
      <ManageSubjectsModal
        isOpen={isManageSubjectsOpen}
        onClose={() => setIsManageSubjectsOpen(false)}
        branch={activeBranch}
        onUpdate={() => {
          setStorageVersion(v => v + 1);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Delete Academic Note?
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-semibold">"{deleteConfirmNote.title}"</strong>?
              This will remove the file and make it inaccessible to students.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmNote(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Yes, Delete Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
