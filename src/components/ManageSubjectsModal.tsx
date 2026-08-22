import React, { useState } from 'react';
import { Subject, Branch } from '../types';
import { getSubjectsByBranch, addSubject, deleteSubject, updateSubject } from '../services/storage';
import { BookOpen, Plus, Trash2, Edit3, X, Check, Layers, AlertCircle } from 'lucide-react';

interface ManageSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  onUpdate: () => void;
}

export const ManageSubjectsModal: React.FC<ManageSubjectsModalProps> = ({
  isOpen,
  onClose,
  branch,
  onUpdate,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>(getSubjectsByBranch(branch.id));
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('Semester 3');
  const [year, setYear] = useState('2nd Year');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    setSubjects(getSubjectsByBranch(branch.id));
    onUpdate();
  };

  const handleStartAdd = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setSemester('Semester 3');
    setYear('2nd Year');
    setDescription('');
    setIsAdding(true);
    setError(null);
  };

  const handleStartEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setCode(sub.code);
    setName(sub.name);
    setSemester(sub.semester);
    setYear(sub.year);
    setDescription(sub.description);
    setIsAdding(true);
    setError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Please provide both subject code and subject name.');
      return;
    }

    if (editingSubject) {
      updateSubject({
        ...editingSubject,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        semester,
        year,
        description: description.trim() || `Course study material for ${name.trim()}`,
      });
    } else {
      const newSubject: Subject = {
        id: `sub-${branch.id}-${Date.now()}`,
        branchId: branch.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        semester,
        year,
        description: description.trim() || `Course study material for ${name.trim()}`,
        totalUnits: 5,
      };
      addSubject(newSubject);
    }

    setIsAdding(false);
    setEditingSubject(null);
    refreshList();
  };

  const handleDelete = (subjectId: string, subName: string) => {
    if (window.confirm(`Are you sure you want to delete "${subName}" and its associated notes?`)) {
      deleteSubject(subjectId);
      refreshList();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Manage Subjects — {branch.code}
              </h2>
              <p className="text-xs text-slate-500">
                Curriculum courses for {branch.name}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {!isAdding ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-700">
                  Existing Subjects ({subjects.length})
                </span>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Subject
                </button>
              </div>

              <div className="space-y-2.5">
                {subjects.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-600 font-semibold">No subjects registered yet for {branch.code}</p>
                    <p className="text-slate-400 mt-1">Click Add New Subject above to create courses for this branch.</p>
                  </div>
                ) : (
                  subjects.map(sub => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 flex items-center justify-between gap-3 transition-colors shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px]">
                            {sub.code}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{sub.name}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {sub.year} ({sub.semester}) • 5 Units Structure
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sub)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Subject"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id, sub.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingSubject ? 'Edit Subject Details' : 'Add New Subject'}
              </h3>

              {error && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CS301PC or EC402PC"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase text-slate-900 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subject / Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Compiler Design"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Academic Year & Semester
                  </label>
                  <select
                    value={`${year}|${semester}`}
                    onChange={(e) => {
                      const [y, s] = e.target.value.split('|');
                      setYear(y);
                      setSemester(s);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs"
                  >
                    <option value="1st Year|Semester 1">1st Year (Semester 1)</option>
                    <option value="1st Year|Semester 2">1st Year (Semester 2)</option>
                    <option value="2nd Year|Semester 3">2nd Year (Semester 3)</option>
                    <option value="2nd Year|Semester 4">2nd Year (Semester 4)</option>
                    <option value="3rd Year|Semester 5">3rd Year (Semester 5)</option>
                    <option value="3rd Year|Semester 6">3rd Year (Semester 6)</option>
                    <option value="4th Year|Semester 7">4th Year (Semester 7)</option>
                    <option value="4th Year|Semester 8">4th Year (Semester 8)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Syllabus Outline (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Course objectives..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  {editingSubject ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          )}

        </div>

        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
