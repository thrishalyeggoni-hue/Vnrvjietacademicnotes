import React, { useState, useMemo, useEffect } from 'react';
import { AcademicNote, Branch, StudentUser, Subject, FileFormat } from '../types';
import { 
  getNotesByBranch, 
  getSubjectsByBranch, 
  triggerFileDownload, 
  toggleStudentBookmark,
  subscribeToStorage 
} from '../services/storage';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Layers, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Image as ImageIcon, 
  FileArchive, 
  Calendar, 
  User, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { NotePreviewModal } from './NotePreviewModal';

export type StudentSortOption = 
  | 'date-desc' 
  | 'date-asc' 
  | 'subject-asc' 
  | 'subject-desc' 
  | 'unit-asc' 
  | 'title-asc';

interface StudentDashboardProps {
  student: StudentUser;
  branch: Branch;
  selectedNoteTarget?: { noteId: string; subjectId: string; unitNumber: number } | null;
  onClearTarget?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  branch,
  selectedNoteTarget,
  onClearTarget,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    selectedNoteTarget ? selectedNoteTarget.subjectId : null
  );
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>(
    selectedNoteTarget ? selectedNoteTarget.unitNumber : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');
  const [sortBy, setSortBy] = useState<StudentSortOption>('date-desc');

  // Preview Modal state
  const [previewNote, setPreviewNote] = useState<AcademicNote | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Storage update listener for real-time instant rendering
  const [storageVersion, setStorageVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToStorage(() => {
      setStorageVersion(v => v + 1);
    });
    return unsubscribe;
  }, []);

  // Retrieve isolated data for student's branch
  const subjects = useMemo(() => getSubjectsByBranch(student.branchId), [student.branchId, storageVersion]);
  
  // Strict student filter: only notes for student's branch AND isShared === true
  const sharedNotes = useMemo(() => {
    return getNotesByBranch(student.branchId, true);
  }, [student.branchId, storageVersion]);

  // Handle direct navigation from notification if present
  React.useEffect(() => {
    if (selectedNoteTarget) {
      setSelectedSubjectId(selectedNoteTarget.subjectId);
      setSelectedUnitFilter(selectedNoteTarget.unitNumber);
      const target = sharedNotes.find(n => n.id === selectedNoteTarget.noteId);
      if (target) {
        setPreviewNote(target);
        setIsPreviewOpen(true);
      }
      if (onClearTarget) onClearTarget();
    }
  }, [selectedNoteTarget, sharedNotes]);

  // Filtered notes based on UI controls
  const filteredNotes = useMemo(() => {
    return sharedNotes.filter(note => {
      // Subject filter
      if (selectedSubjectId && note.subjectId !== selectedSubjectId) {
        return false;
      }
      // Unit filter
      if (selectedUnitFilter !== 'all' && note.unitNumber !== selectedUnitFilter) {
        return false;
      }
      // File type filter
      if (fileTypeFilter !== 'all' && note.fileType !== fileTypeFilter) {
        return false;
      }
      // Bookmark filter
      if (activeTab === 'bookmarks' && !student.bookmarkedNoteIds?.includes(note.id)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(q);
        const matchDesc = note.description.toLowerCase().includes(q);
        const matchSub = note.subjectName.toLowerCase().includes(q) || note.subjectCode.toLowerCase().includes(q);
        const matchTag = note.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchSub && !matchTag) {
          return false;
        }
      }
      return true;
    });
  }, [sharedNotes, selectedSubjectId, selectedUnitFilter, fileTypeFilter, activeTab, student.bookmarkedNoteIds, searchQuery]);

  // Sorted notes based on selected sorting option (Date Uploaded, Subject Alphabetical, etc.)
  const sortedNotes = useMemo(() => {
    const result = [...filteredNotes];
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': {
          const timeA = new Date(a.uploadedDate || a.lastModifiedDate || 0).getTime();
          const timeB = new Date(b.uploadedDate || b.lastModifiedDate || 0).getTime();
          return timeB - timeA;
        }
        case 'date-asc': {
          const timeA = new Date(a.uploadedDate || a.lastModifiedDate || 0).getTime();
          const timeB = new Date(b.uploadedDate || b.lastModifiedDate || 0).getTime();
          return timeA - timeB;
        }
        case 'subject-asc': {
          const cmp = (a.subjectName || '').localeCompare(b.subjectName || '');
          if (cmp !== 0) return cmp;
          if (a.unitNumber !== b.unitNumber) return a.unitNumber - b.unitNumber;
          return (a.title || '').localeCompare(b.title || '');
        }
        case 'subject-desc': {
          const cmp = (b.subjectName || '').localeCompare(a.subjectName || '');
          if (cmp !== 0) return cmp;
          if (a.unitNumber !== b.unitNumber) return a.unitNumber - b.unitNumber;
          return (a.title || '').localeCompare(b.title || '');
        }
        case 'unit-asc': {
          if (a.unitNumber !== b.unitNumber) return a.unitNumber - b.unitNumber;
          return (a.title || '').localeCompare(b.title || '');
        }
        case 'title-asc': {
          return (a.title || '').localeCompare(b.title || '');
        }
        default:
          return 0;
      }
    });
  }, [filteredNotes, sortBy]);

  const handleOpenPreview = (note: AcademicNote) => {
    setPreviewNote(note);
    setIsPreviewOpen(true);
  };

  const handleDownload = (note: AcademicNote) => {
    triggerFileDownload(note);
  };

  const handleBookmarkToggle = (noteId: string) => {
    toggleStudentBookmark(student.id, noteId);
  };

  const activeSubjectObj = subjects.find(s => s.id === selectedSubjectId);

  const getFormatBadge = (type: FileFormat) => {
    switch (type) {
      case 'pdf':
        return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] tracking-wide uppercase">PDF</span>;
      case 'docx':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px] tracking-wide uppercase">DOCX</span>;
      case 'pptx':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px] tracking-wide uppercase">PPTX</span>;
      case 'xlsx':
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px] tracking-wide uppercase">XLSX</span>;
      case 'txt':
        return <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px] tracking-wide uppercase">TXT</span>;
      case 'jpg':
      case 'png':
        return <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[10px] tracking-wide uppercase">IMG</span>;
      case 'zip':
        return <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px] tracking-wide uppercase">ZIP</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] tracking-wide uppercase">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Student Welcome Banner with Branch Details */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                Active Branch: {branch.code}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 font-medium text-xs">
                {student.year} ({student.semester})
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 font-mono text-xs">
                Roll: {student.rollNo}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome, {student.name} 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Access curriculum-aligned course notes, syllabus modules, and verified lecture materials for{' '}
              <strong className="text-white font-semibold">{branch.name}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-xl border border-white/10 backdrop-blur-xs self-start md:self-auto">
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-lg font-bold text-emerald-400">{sharedNotes.length}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Available Notes</div>
            </div>
            <div className="text-center px-3">
              <div className="text-lg font-bold text-amber-400">
                {student.bookmarkedNoteIds?.length || 0}
              </div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Bookmarks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Available Study Notes
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              {sharedNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'bookmarks'
                ? 'border-amber-500 text-amber-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-amber-500" />
            Saved Bookmarks
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {student.bookmarkedNoteIds?.length || 0}
            </span>
          </button>
        </div>

        {/* Branch isolation guarantee badge */}
        <div className="text-slate-400 text-xs flex items-center gap-1.5 pb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Filtered to: <strong className="text-slate-700 font-semibold">{branch.code}</strong></span>
        </div>
      </div>

      {/* Search & Filtering Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          
          {/* Search bar */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, topics, units..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedSubjectId || 'all'}
              onChange={(e) => setSelectedSubjectId(e.target.value === 'all' ? null : e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 font-medium"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* File Format Filter */}
          <div className="lg:col-span-2">
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900"
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF Documents</option>
              <option value="docx">Word (.docx)</option>
              <option value="pptx">PowerPoint (.pptx)</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="txt">Text & Code (.txt)</option>
              <option value="zip">Archives (.zip)</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="lg:col-span-3 relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as StudentSortOption)}
              aria-label="Sort Notes Order"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-indigo-950 font-bold cursor-pointer transition-colors"
            >
              <option value="date-desc">Date: Newest First</option>
              <option value="date-asc">Date: Oldest First</option>
              <option value="subject-asc">Subject: Alphabetical (A - Z)</option>
              <option value="subject-desc">Subject: Alphabetical (Z - A)</option>
              <option value="unit-asc">Unit: 1 to 5</option>
              <option value="title-asc">Title: A to Z</option>
            </select>
          </div>

        </div>

        {/* Unit Pills Bar (1 to 5) */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold mr-1">Unit Filter:</span>
          <button
            type="button"
            onClick={() => setSelectedUnitFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              selectedUnitFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
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
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedUnitFilter === num
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unit {num}
            </button>
          ))}

          {(selectedSubjectId || selectedUnitFilter !== 'all' || fileTypeFilter !== 'all' || searchQuery || sortBy !== 'date-desc') && (
            <button
              type="button"
              onClick={() => {
                setSelectedSubjectId(null);
                setSelectedUnitFilter('all');
                setFileTypeFilter('all');
                setSearchQuery('');
                setSortBy('date-desc');
              }}
              className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filtered Subject Indicator (if selected in dropdown) */}
      {activeSubjectObj && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-mono font-bold text-xs">
              {activeSubjectObj.code}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm truncate">
                {activeSubjectObj.name}
              </h3>
              <p className="text-slate-500 text-xs truncate">
                {activeSubjectObj.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedSubjectId(null)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shrink-0 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Show All Subjects</span>
          </button>
        </div>
      )}

      {/* Notes List Section - ONLY SHOW AVAILABLE NOTES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            {activeTab === 'bookmarks' ? 'Your Saved Bookmarks' : 'Available Academic Study Notes'} ({sortedNotes.length})
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Sorted by: <strong className="text-slate-600 font-semibold">{sortBy.startsWith('date') ? 'Date' : sortBy.startsWith('subject') ? 'Subject' : sortBy.startsWith('unit') ? 'Unit' : 'Title'}</strong>
            </span>
          </div>
        </div>

        {sortedNotes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <BookOpen className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {activeTab === 'bookmarks' 
                ? 'No bookmarked notes' 
                : activeSubjectObj 
                ? `No study notes in ${activeSubjectObj.code}` 
                : 'No notes available'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeTab === 'bookmarks'
                ? 'You have not bookmarked any notes yet. Click the bookmark icon on any note to save it here.'
                : activeSubjectObj
                ? `Study notes for ${activeSubjectObj.name} may have been deleted or not yet published by faculty for ${branch.code}.`
                : 'No published study notes found matching your current filter criteria for this unit/subject.'}
            </p>
            {activeSubjectObj && (
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Show All Subjects
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedNotes.map((note) => {
              const isBookmarked = student.bookmarkedNoteIds?.includes(note.id);

              return (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all p-5 flex flex-col justify-between relative group"
                >
                  <div>
                    {/* Top Row: Unit, FileType, Bookmark */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[11px] shadow-2xs">
                          Unit {note.unitNumber}
                        </span>
                        {getFormatBadge(note.fileType)}
                        {note.isImportant && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                            ⭐ Exam Essential
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookmarkToggle(note.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50'
                        }`}
                        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Note'}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Subject Tag */}
                    <div className="text-[11px] font-semibold text-indigo-600 mb-1 truncate">
                      {note.subjectCode} • {note.subjectName}
                    </div>

                    {/* Note Title */}
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-indigo-600 transition-colors">
                      {note.title}
                    </h3>

                    {/* Note Description */}
                    <p className="text-slate-600 text-xs mt-2 line-clamp-3 leading-relaxed">
                      {note.description}
                    </p>

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-3">
                        {note.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Note Footer with Metadata & Actions */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {note.uploadedByTeacherName}
                      </span>
                      <span>•</span>
                      <span>{note.fileSize}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(note)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(note)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note Preview Modal */}
      <NotePreviewModal
        note={previewNote}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        isTeacher={false}
      />

    </div>
  );
};
