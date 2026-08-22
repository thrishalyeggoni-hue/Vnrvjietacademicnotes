import React, { useState, useEffect, useRef } from 'react';
import { AcademicNote, Branch, FileFormat, Subject } from '../types';
import { getBranches, getSubjectsByBranch, saveNote, saveMultipleNotes, getBranding, addSubject } from '../services/storage';
import { 
  Upload, 
  FileText, 
  Share2, 
  Lock, 
  X, 
  Check, 
  AlertCircle, 
  Plus, 
  Trash2,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Zap,
  CheckCircle2,
  File
} from 'lucide-react';

interface UploadedFileItem {
  id: string;
  file?: File;
  fileName: string;
  fileType: FileFormat;
  fileSize: string;
  title: string;
  description: string;
  fileData?: string;
  contentPreview?: string;
  isImportant?: boolean;
}

interface UploadNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBranchId: string;
  initialSubjectId?: string;
  initialUnitNumber?: number;
  editingNote?: AcademicNote | null;
  onSuccess?: () => void;
}

export const UploadNoteModal: React.FC<UploadNoteModalProps> = ({
  isOpen,
  onClose,
  initialBranchId,
  initialSubjectId,
  initialUnitNumber,
  editingNote,
  onSuccess,
}) => {
  const branches = getBranches();
  const branding = getBranding();

  const [branchId, setBranchId] = useState(initialBranchId || 'branch-cse');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState(initialSubjectId || '');
  const [unitNumber, setUnitNumber] = useState<number>(initialUnitNumber || 1);
  
  // Multiple files list for the unit
  const [pendingFiles, setPendingFiles] = useState<UploadedFileItem[]>([]);
  
  // Single note edit fields
  const [singleTitle, setSingleTitle] = useState('');
  const [singleDescription, setSingleDescription] = useState('');
  const [singleFileType, setSingleFileType] = useState<FileFormat>('pdf');
  const [singleFileName, setSingleFileName] = useState('');
  const [singleFileSize, setSingleFileSize] = useState('');
  const [singleFileData, setSingleFileData] = useState<string>('');
  const [singleContentPreview, setSingleContentPreview] = useState('');
  const [singleIsImportant, setSingleIsImportant] = useState(false);

  // Global sharing mode for this upload batch (Private Vault vs Live)
  const [isShared, setIsShared] = useState<boolean>(false);
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Quick subject creation
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const branchSubs = getSubjectsByBranch(branchId);
    setSubjects(branchSubs);
    if (!subjectId || !branchSubs.find(s => s.id === subjectId)) {
      if (branchSubs.length > 0) {
        setSubjectId(branchSubs[0].id);
      } else {
        setSubjectId('');
      }
    }
  }, [branchId]);

  useEffect(() => {
    if (editingNote) {
      setBranchId(editingNote.branchId);
      setSubjectId(editingNote.subjectId);
      setUnitNumber(editingNote.unitNumber);
      setSingleTitle(editingNote.title);
      setSingleDescription(editingNote.description);
      setSingleFileType(editingNote.fileType);
      setSingleFileName(editingNote.fileName);
      setSingleFileSize(editingNote.fileSize);
      setSingleFileData(editingNote.fileData || '');
      setSingleContentPreview(editingNote.contentPreview || '');
      setIsShared(editingNote.isShared);
      setTagsInput(editingNote.tags ? editingNote.tags.join(', ') : '');
      setSingleIsImportant(!!editingNote.isImportant);
      setPendingFiles([]);
    } else {
      setBranchId(initialBranchId || 'branch-cse');
      if (initialSubjectId) setSubjectId(initialSubjectId);
      if (initialUnitNumber) setUnitNumber(initialUnitNumber);
      setSingleTitle('');
      setSingleDescription('');
      setSingleFileType('pdf');
      setSingleFileName('');
      setSingleFileSize('');
      setSingleFileData('');
      setSingleContentPreview('');
      setIsShared(false); // Vault by default
      setTagsInput('');
      setSingleIsImportant(false);
      setPendingFiles([]);
    }
  }, [editingNote, initialBranchId, initialSubjectId, initialUnitNumber, isOpen]);

  if (!isOpen) return null;

  const detectFormat = (filename: string): FileFormat => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['doc', 'docx'].includes(ext)) return 'docx';
    if (['ppt', 'pptx'].includes(ext)) return 'pptx';
    if (['xls', 'xlsx'].includes(ext)) return 'xlsx';
    if (['txt', 'md', 'c', 'cpp', 'py', 'java'].includes(ext)) return 'txt';
    if (['jpg', 'jpeg'].includes(ext)) return 'jpg';
    if (['png'].includes(ext)) return 'png';
    if (['zip', 'rar'].includes(ext)) return 'zip';
    return 'pdf';
  };

  const formatFileSize = (bytes: number): string => {
    const sizeInKb = bytes / 1024;
    if (sizeInKb > 1024) {
      return `${(sizeInKb / 1024).toFixed(1)} MB`;
    }
    return `${Math.round(sizeInKb)} KB`;
  };

  const handleProcessFiles = (files: FileList | File[]) => {
    const newItems: UploadedFileItem[] = [];
    Array.from(files).forEach((file, idx) => {
      const detected = detectFormat(file.name);
      const sizeStr = formatFileSize(file.size);
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanTitle = `Unit ${unitNumber}: ${baseName.replace(/[-_]/g, ' ')}`;

      const item: UploadedFileItem = {
        id: `file-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        file,
        fileName: file.name,
        fileType: detected,
        fileSize: sizeStr,
        title: cleanTitle,
        description: `Lecture material & study reference for Unit ${unitNumber}.`,
        isImportant: false,
      };

      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        item.fileData = result;
        if (file.type.startsWith('text/') || detected === 'txt') {
          item.contentPreview = result;
        } else {
          item.contentPreview = `# ${file.name}\n\nFile attached (${sizeStr}, ${detected.toUpperCase()}) for Unit ${unitNumber}.`;
        }
      };

      if (file.type.startsWith('text/') || detected === 'txt') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }

      newItems.push(item);
    });

    setPendingFiles(prev => [...prev, ...newItems]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpdatePendingFile = (id: string, updates: Partial<UploadedFileItem>) => {
    setPendingFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode || !newSubName) return;
    const newSubject: Subject = {
      id: `sub-${branchId}-${Date.now()}`,
      branchId,
      code: newSubCode.trim().toUpperCase(),
      name: newSubName.trim(),
      semester: 'Semester 3',
      year: '2nd Year',
      description: `Course material for ${newSubName}`,
      totalUnits: 5,
    };
    addSubject(newSubject);
    const updatedSubs = getSubjectsByBranch(branchId);
    setSubjects(updatedSubs);
    setSubjectId(newSubject.id);
    setIsAddingNewSubject(false);
    setNewSubCode('');
    setNewSubName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subjectId) {
      setError('Please select or create a course subject.');
      return;
    }

    const currentSubject = subjects.find(s => s.id === subjectId);
    if (!currentSubject) {
      setError('Selected subject not found.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // If Editing single note:
    if (editingNote) {
      if (!singleTitle.trim()) {
        setError('Please provide a title for the note.');
        return;
      }

      const updatedNote: AcademicNote = {
        ...editingNote,
        branchId,
        subjectId: currentSubject.id,
        subjectName: currentSubject.name,
        subjectCode: currentSubject.code,
        unitNumber,
        title: singleTitle.trim(),
        description: singleDescription.trim() || `Course study material for ${currentSubject.name} - Unit ${unitNumber}`,
        fileName: singleFileName.trim() || editingNote.fileName,
        fileType: singleFileType,
        fileSize: singleFileSize || editingNote.fileSize,
        fileData: singleFileData || editingNote.fileData,
        contentPreview: singleContentPreview || editingNote.contentPreview,
        isShared,
        tags,
        isImportant: singleIsImportant,
      };

      saveNote(updatedNote);
      if (onSuccess) onSuccess();
      onClose();
      return;
    }

    // New Multi-file Upload Mode:
    if (pendingFiles.length === 0) {
      setError('Please select or drop at least one file for Unit ' + unitNumber + '.');
      return;
    }

    const notesToCreate: AcademicNote[] = pendingFiles.map((item, idx) => ({
      id: `note-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      branchId,
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      subjectCode: currentSubject.code,
      unitNumber,
      title: item.title.trim() || `Unit ${unitNumber} Resource ${idx + 1}`,
      description: item.description.trim() || `Course material for ${currentSubject.name} - Unit ${unitNumber}`,
      fileName: item.fileName,
      fileType: item.fileType,
      fileSize: item.fileSize,
      fileData: item.fileData,
      contentPreview: item.contentPreview || `# ${item.title}\n\nAcademic notes for Unit ${unitNumber} (${currentSubject.name}).`,
      isShared,
      uploadedByTeacherName: branding.facultyName,
      uploadedByTeacherId: 'teacher-01',
      uploadedDate: new Date().toISOString(),
      downloadsCount: 0,
      tags,
      isImportant: !!item.isImportant,
    }));

    saveMultipleNotes(notesToCreate);
    if (onSuccess) onSuccess();
    onClose();
  };

  const selectedBranchObj = branches.find(b => b.id === branchId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingNote ? 'Edit Academic Note' : `Attach Files to Unit ${unitNumber} (Faculty Vault)`}
              </h2>
              <p className="text-xs text-slate-500">
                {editingNote 
                  ? 'Update note details and publish visibility.'
                  : 'Add one or multiple files (PDFs, PPTs, Docs) under this unit. Keep in private vault or publish live.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1 text-xs">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Branch & Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Academic Branch <span className="text-rose-500">*</span>
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={!!editingNote}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-semibold text-xs bg-slate-50 cursor-pointer disabled:opacity-60"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Curriculum Unit (1 to 5) <span className="text-rose-500">*</span>
              </label>
              <select
                value={unitNumber}
                onChange={(e) => setUnitNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-bold text-xs bg-slate-50 cursor-pointer"
              >
                <option value={1}>Unit 1: Fundamentals & Core Principles</option>
                <option value={2}>Unit 2: Advanced Mechanics & Analysis</option>
                <option value={3}>Unit 3: Mid-Semester Core Topics</option>
                <option value={4}>Unit 4: Specialized Applications & Design</option>
                <option value={5}>Unit 5: Case Studies & Emerging Technologies</option>
              </select>
            </div>
          </div>

          {/* Course Subject Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                Course / Subject <span className="text-rose-500">*</span>
              </label>
              {!editingNote && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewSubject(!isAddingNewSubject)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingNewSubject ? 'Cancel Subject' : '+ Quick Add Subject'}
                </button>
              )}
            </div>

            {isAddingNewSubject ? (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Subject Code (e.g. CS501PC)"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-mono uppercase"
                  />
                  <input
                    type="text"
                    placeholder="Subject Name (e.g. Operating Systems)"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateSubject}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px] hover:bg-indigo-700 cursor-pointer"
                  >
                    Save & Select Subject
                  </button>
                </div>
              </div>
            ) : (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-semibold text-xs cursor-pointer"
              >
                {subjects.length === 0 ? (
                  <option value="">No subjects found for this branch. Create one above.</option>
                ) : (
                  subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code}: {sub.name} ({sub.year})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* EDITING SINGLE NOTE MODE */}
          {editingNote ? (
            <div className="space-y-3.5 border-t border-slate-100 pt-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Note Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={singleTitle}
                  onChange={(e) => setSingleTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Topic Summary
                </label>
                <textarea
                  rows={2}
                  value={singleDescription}
                  onChange={(e) => setSingleDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-xs"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 w-full">
                  <input
                    type="checkbox"
                    checked={singleIsImportant}
                    onChange={(e) => setSingleIsImportant(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    ⭐ Mark as High Priority / Exam Essential
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* NEW MULTI-FILE UPLOAD FOR UNIT MODE */
            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Attach Multiple Files for Unit {unitNumber}
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {pendingFiles.length} file{pendingFiles.length === 1 ? '' : 's'} ready
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip"
                  className="hidden"
                />

                {/* Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-4.5 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50'
                      : pendingFiles.length > 0
                      ? 'border-indigo-300 bg-indigo-50/30'
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
                  }`}
                >
                  <Upload className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
                  <p className="font-bold text-slate-800 text-xs">
                    Click to browse or drop multiple files here
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload Part 1, Part 2, Slides, Question Banks, Lab Manuals for Unit {unitNumber} together
                  </p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {pendingFiles.length > 0 && (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Files in Unit {unitNumber} Upload Bundle:</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + Add Another File
                    </button>
                  </div>

                  {pendingFiles.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px] uppercase shrink-0">
                            {item.fileType}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px] truncate">
                            {item.fileName} ({item.fileSize})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePendingFile(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-8">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdatePendingFile(item.id, { title: e.target.value })}
                            placeholder="File Title (e.g. Unit 1 Part A: Core Principles)"
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-medium"
                          />
                        </div>
                        <div className="sm:col-span-4 flex items-center">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 font-semibold">
                            <input
                              type="checkbox"
                              checked={!!item.isImportant}
                              onChange={(e) => handleUpdatePendingFile(item.id, { isImportant: e.target.checked })}
                              className="rounded text-indigo-600 w-3.5 h-3.5"
                            />
                            <span>⭐ Exam Note</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Keywords / Search Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Unit1, Mid-Exam, QuestionBank, LectureSlides"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-xs"
            />
          </div>

          {/* FACULTY VAULT VS LIVE SHARING SELECTION */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-800">
              Visibility & Publishing Control for Unit {unitNumber}
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Option 1: Private Faculty Vault */}
              <div
                onClick={() => setIsShared(false)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  !isShared
                    ? 'border-amber-500 bg-amber-50/70 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  !isShared ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Private Faculty Vault</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">Recommended</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Store securely in your repository. You can 1-click publish any or all files in Unit {unitNumber} to {selectedBranchObj?.code || 'branch'} students whenever needed without re-uploading.
                  </p>
                </div>
              </div>

              {/* Option 2: Publish Live Immediately */}
              <div
                onClick={() => setIsShared(true)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  isShared
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isShared ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    Publish Live Immediately
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Instantly visible in {selectedBranchObj?.code || 'Branch'} student portal with immediate push notification.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                isShared ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isShared ? (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>
                    {editingNote 
                      ? 'Save & Keep Published' 
                      : `Publish ${pendingFiles.length > 0 ? `${pendingFiles.length} Files` : ''} Live to Branch`}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {editingNote 
                      ? 'Save in Vault' 
                      : `Save ${pendingFiles.length > 0 ? `${pendingFiles.length} Files` : ''} to Private Vault`}
                  </span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
