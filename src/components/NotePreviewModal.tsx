import React, { useState } from 'react';
import { AcademicNote } from '../types';
import { triggerFileDownload } from '../services/storage';
import { 
  X, 
  Download, 
  FileText, 
  FileCode, 
  FileSpreadsheet, 
  FileArchive, 
  Image as ImageIcon, 
  Printer, 
  Calendar, 
  User, 
  Layers, 
  Eye, 
  Copy, 
  Check, 
  BookOpen, 
  Maximize2, 
  Minimize2, 
  Share2
} from 'lucide-react';

interface NotePreviewModalProps {
  note: AcademicNote | null;
  isOpen: boolean;
  onClose: () => void;
  onShareToggle?: (noteId: string, isShared: boolean) => void;
  isTeacher?: boolean;
}

export const NotePreviewModal: React.FC<NotePreviewModalProps> = ({
  note,
  isOpen,
  onClose,
  onShareToggle,
  isTeacher = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen || !note) return null;

  const handleDownload = () => {
    triggerFileDownload(note);
  };

  const handleCopyText = () => {
    const textToCopy = `${note.title}\n\nSubject: ${note.subjectName} (Unit ${note.unitNumber})\nFaculty: ${note.uploadedByTeacherName}\n\n${note.description}\n\n${note.contentPreview || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  const getFileIcon = () => {
    switch (note.fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'pptx':
        return <FileText className="w-5 h-5 text-amber-600" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'txt':
        return <FileCode className="w-5 h-5 text-slate-600" />;
      case 'jpg':
      case 'png':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case 'zip':
        return <FileArchive className="w-5 h-5 text-indigo-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className={`bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 transition-all duration-200 ${
          isFullScreen 
            ? 'fixed inset-3 max-w-none max-h-none h-[calc(100vh-24px)]' 
            : 'max-w-4xl w-full max-h-[90vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
              {getFileIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                  Unit {note.unitNumber}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                  {note.fileType.toUpperCase()}
                </span>
                {note.isShared ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Published to Students
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    🔒 Private / Teacher Draft
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 truncate mt-0.5">
                {note.title}
              </h2>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
              title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handlePrint}
              className="hidden sm:flex p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
              title="Print Note"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">Subject</span>
                <span className="font-semibold text-slate-800 truncate block">{note.subjectName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">Uploaded By</span>
                <span className="font-semibold text-slate-800 truncate block">{note.uploadedByTeacherName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">Date Uploaded</span>
                <span className="font-semibold text-slate-800 block">{new Date(note.uploadedDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">File Size & Downloads</span>
                <span className="font-semibold text-slate-800 block">{note.fileSize} • {note.downloadsCount} downloads</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Academic Topic Overview
            </h4>
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-slate-800 text-sm leading-relaxed">
              {note.description}
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">Keywords:</span>
              {note.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Document Content View / Markdown Simulation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-600" />
                Lecture Content & Curriculum Notes
              </h4>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Summary
                  </>
                )}
              </button>
            </div>

            {/* Note document frame */}
            <div className="border border-slate-200 rounded-xl p-6 bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto shadow-inner whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
              {note.contentPreview || 'Full document content attached. Please click Download File below for the original syllabus reference.'}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4 rounded-b-2xl flex-wrap">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">{note.fileName}</span>
            <span>({note.fileSize})</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isTeacher && onShareToggle && (
              <button
                type="button"
                onClick={() => onShareToggle(note.id, !note.isShared)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  note.isShared
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                {note.isShared ? 'Unshare Note' : 'Share with Students'}
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Academic Note
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
