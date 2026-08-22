import React, { useState, useRef, useEffect } from 'react';
import { StudentNotification } from '../types';
import { 
  getNotificationsForBranch, 
  getUnreadNotificationCount, 
  markAllNotificationsRead, 
  markNotificationRead 
} from '../services/storage';
import { Bell, CheckCheck, Clock, BookOpen, ExternalLink, Sparkles } from 'lucide-react';

interface NotificationCenterProps {
  branchId: string;
  branchCode: string;
  studentId: string;
  onNavigateToNote?: (noteId: string, subjectId: string, unitNumber: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  branchId,
  branchCode,
  studentId,
  onNavigateToNote,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    if (!branchId) return;
    const branchNotifs = getNotificationsForBranch(branchId);
    setNotifications(branchNotifs);
    setUnreadCount(getUnreadNotificationCount(branchId, studentId));
  };

  useEffect(() => {
    loadNotifications();
  }, [branchId, studentId]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    loadNotifications();
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(branchId, studentId);
    loadNotifications();
  };

  const handleNotificationClick = (notif: StudentNotification) => {
    markNotificationRead(notif.id, studentId);
    loadNotifications();
    if (onNavigateToNote) {
      onNavigateToNote(notif.noteId, notif.subjectId, notif.unitNumber);
      setIsOpen(false);
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button with Badge */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-center"
        aria-label="Notifications"
        title="Academic Notifications"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown / Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Panel Header */}
          <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold tracking-tight">
                {branchCode} Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500 text-white rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                Mark all read
              </button>
            )}
          </div>

          {/* Branch isolation disclaimer */}
          <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Branch Filter: <strong className="text-slate-800 font-semibold">{branchCode}</strong></span>
            <span className="text-[10px] text-slate-400">Strictly isolated</span>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Bell className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                  When your faculty publishes new notes for {branchCode}, they will appear right here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isRead = notif.readByStudentIds.includes(studentId);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                      isRead ? 'bg-white hover:bg-slate-50/80 opacity-80' : 'bg-indigo-50/40 hover:bg-indigo-50/80 border-l-4 border-indigo-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      <BookOpen className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          Unit {notif.unitNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-0.5">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-indigo-600 font-medium pt-1 border-t border-slate-100">
                        <span className="truncate text-slate-500 text-[10px]">{notif.subjectName}</span>
                        <span className="flex items-center gap-1 hover:underline shrink-0">
                          Open Note <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
            Clicking a notification jumps directly to that note.
          </div>

        </div>
      )}
    </div>
  );
};
