import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../store/ToastContext';
import { 
  Clock, MessageSquare, Send, User, MessageCircle, AlertCircle
} from 'lucide-react';

const PackageTimeline = ({ pkg, onCommentAdded }) => {
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [localPkg, setLocalPkg] = useState(pkg);
  const { showToast } = useToast();

  useEffect(() => {
    setLocalPkg(pkg);
  }, [pkg]);

  if (!localPkg) return null;

  // Extract comments (from pkg.comments array OR timeline items with status === 'Comment')
  const timelineItems = localPkg.timeline || [];
  
  const commentsFromTimeline = timelineItems
    .filter(t => t.status === 'Comment' || t.type === 'Comment')
    .map(t => ({
      text: t.message,
      user: t.user || 'User',
      role: t.role || '',
      createdAt: t.time
    }));

  const arrayComments = (localPkg.comments || []).map(c => ({
    text: c.text,
    user: c.user || 'User',
    role: c.role || '',
    createdAt: c.createdAt || c.time
  }));

  // Merge and deduplicate comments by text + createdAt
  const mergedCommentsMap = new Map();
  [...arrayComments, ...commentsFromTimeline].forEach(c => {
    const key = `${c.user}-${c.text}-${new Date(c.createdAt).getTime()}`;
    if (!mergedCommentsMap.has(key)) {
      mergedCommentsMap.set(key, c);
    }
  });

  const commentsList = Array.from(mergedCommentsMap.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Status timeline events (excluding purely comment events)
  const statusEvents = timelineItems.filter(t => t.status !== 'Comment' && t.type !== 'Comment');

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const textToSubmit = commentText.trim();
    setPosting(true);

    try {
      const packageIdentifier = localPkg._id || localPkg.trackingCode;
      const res = await api.post(`/packages/${packageIdentifier}/comments`, {
        comment: textToSubmit
      });

      showToast('Comment posted successfully!', 'success');
      setCommentText('');

      const updated = res.data?.data;
      if (updated) {
        setLocalPkg(updated);
        if (onCommentAdded) onCommentAdded(updated);
      } else {
        // Fallback optimistic update
        const newCommentObj = {
          text: textToSubmit,
          user: 'You',
          role: '',
          createdAt: new Date().toISOString()
        };
        const updatedLocal = {
          ...localPkg,
          comments: [newCommentObj, ...(localPkg.comments || [])]
        };
        setLocalPkg(updatedLocal);
        if (onCommentAdded) onCommentAdded(updatedLocal);
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to post comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (r.includes('vendor')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (r.includes('dispatcher')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (r.includes('rider')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      
      {/* ─────────────────────────────────────────────────────────────────
          SECTION 1: COMMENTS & NOTES (ABOVE TIMELINE)
         ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-brand-200 rounded-2xl p-5 shadow-xs">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            Comments & Discussion
          </h4>
          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
            {commentsList.length} {commentsList.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>

        {/* ── COMMENT INPUT FORM (AT TOP) ── */}
        <form onSubmit={handlePostComment} className="mb-5">
          <div className="space-y-2">
            <div className="relative">
              <textarea
                rows={2}
                required
                placeholder="Write a comment or note on this package..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all resize-none font-medium text-slate-800 placeholder:text-slate-400"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={posting || !commentText.trim()}
                className="btn-primary px-5 py-2 flex items-center gap-1.5 text-xs font-bold shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {posting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>

        {/* ── COMMENTS LIST (ONLY COMMENTS AND TIME) ── */}
        {commentsList.length === 0 ? (
          <div className="text-center py-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
            No comments yet. Post the first comment above!
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {commentsList.map((item, idx) => (
              <div key={idx} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 transition-all hover:bg-slate-50">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {item.user}
                    </span>
                    {item.role && (
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${getRoleBadgeColor(item.role)}`}>
                        {item.role}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/60 whitespace-pre-wrap">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 2: STATUS TIMELINE (BELOW COMMENTS)
         ───────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/60">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            Status Tracking History
          </h4>
          <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
            {statusEvents.length} updates
          </span>
        </div>

        {statusEvents.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">No status history recorded yet.</div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {statusEvents.map((event, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-brand-600" />
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-xs">{event.status}</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {event.time ? new Date(event.time).toLocaleString() : ''}
                    </span>
                  </div>
                  {event.message && (
                    <p className="text-xs text-slate-600 mt-1">{event.message}</p>
                  )}
                  {event.user && event.user !== 'System' && (
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">Updated by: {event.user}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default PackageTimeline;
