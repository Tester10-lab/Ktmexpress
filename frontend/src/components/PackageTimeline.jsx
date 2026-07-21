import React, { useState } from 'react';
import api from '../api/axios';
import { useToast } from '../store/ToastContext';
import { 
  Clock, MessageSquare, Send, User, ShieldCheck, Truck, Store, 
  CheckCircle2, Package as PackageIcon, Info, MessageCircle, AlertCircle
} from 'lucide-react';

const PackageTimeline = ({ pkg, onCommentAdded }) => {
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const { showToast } = useToast();

  if (!pkg) return null;

  const timelineEvents = pkg.timeline || [];

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPosting(true);
    try {
      const res = await api.post(`/packages/${pkg._id}/comments`, {
        comment: commentText.trim()
      });
      showToast('Comment added to timeline!', 'success');
      setCommentText('');
      if (onCommentAdded) {
        onCommentAdded(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to post comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (r.includes('vendor')) return 'bg-brand-100 text-brand-700 border-brand-200';
    if (r.includes('dispatcher')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (r.includes('rider')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      
      {/* ── TIMELINE CONTAINER ────────────────────────────────────────── */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/60">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            Package Timeline & Discussions
          </h4>
          <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
            {timelineEvents.length} events
          </span>
        </div>

        {timelineEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No timeline events recorded yet.</div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timelineEvents.map((item, idx) => {
              const isComment = item.status === 'Comment' || item.type === 'Comment';
              const eventDate = item.time ? new Date(item.time) : null;
              
              return (
                <div key={idx} className="relative group">
                  
                  {/* Timeline Point Dot/Icon */}
                  <div className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center border text-xs shadow-xs transition-transform group-hover:scale-110 ${
                    isComment 
                      ? 'bg-brand-600 text-white border-brand-700' 
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}>
                    {isComment ? (
                      <MessageSquare className="w-3 h-3" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-brand-600" />
                    )}
                  </div>

                  {/* Timeline Card */}
                  {isComment ? (
                    /* ── USER COMMENT BUBBLE ─────────────────────────── */
                    <div className="bg-white border border-brand-200/80 rounded-xl p-4 shadow-xs relative hover:border-brand-300 transition-all">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-brand-600" />
                            {item.user || 'Anonymous'}
                          </span>
                          {item.role && (
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${getRoleBadgeColor(item.role)}`}>
                              {item.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {eventDate ? eventDate.toLocaleString() : item.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-brand-50/40 p-2.5 rounded-lg border border-brand-100/50 mt-1 whitespace-pre-wrap">
                        {item.message}
                      </p>
                    </div>
                  ) : (
                    /* ── SYSTEM EVENT ENTRY ─────────────────────────── */
                    <div className="bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">{item.status}</span>
                          {item.user && item.user !== 'System' && (
                            <span className="text-[11px] text-slate-500 font-medium">by {item.user}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {eventDate ? eventDate.toLocaleString() : item.time}
                        </span>
                      </div>
                      {item.message && (
                        <p className="text-xs text-slate-600 mt-0.5">{item.message}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── COMMENT INPUT FORM ────────────────────────────────────────── */}
        <form onSubmit={handlePostComment} className="mt-6 pt-4 border-t border-slate-200/80">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-brand-600" />
            Add a comment to this package timeline
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Type a comment or note visible to admin, vendor, dispatcher, and rider..."
              className="input-field text-xs py-2 w-full bg-white border-slate-300 focus:border-brand-500"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              disabled={posting || !commentText.trim()}
              className="btn-primary btn-sm px-4 py-2 flex items-center gap-1.5 text-xs whitespace-nowrap shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PackageTimeline;
