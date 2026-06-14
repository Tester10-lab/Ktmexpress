import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, Package, Calendar, DollarSign, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/vendor/packages/${id}`);
      setPkg(res.data.data);
    } catch (err) {
      showToast('Failed to load package details', 'error');
      navigate('/vendor/packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await api.post(`/vendor/packages/${id}/comments`, { text: newComment });
      setNewComment('');
      showToast('Comment added successfully', 'success');
      fetchDetails(); // Refresh
    } catch (err) {
      showToast('Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pkg) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vendor/packages')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              {pkg.trackingCode}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                pkg.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                pkg.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                pkg.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {pkg.status}
              </span>
            </h2>
            <p className="text-sm text-gray-500">Invoice: {pkg.invoiceId} • Created {new Date(pkg.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {pkg.status === 'Pending' && (
            <button className="btn btn-outline flex items-center gap-2">
              <AlertCircle size={16} /> Request Return
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setTimeout(() => window.print(), 200)}>
            Print Label
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'timeline', 'comments'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recipient Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={18} className="text-blue-500"/> Recipient Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Name</p>
                <p className="text-gray-900 font-medium">{pkg.customerName}</p>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Contact</p>
                  <p className="text-gray-900">{pkg.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Delivery Address</p>
                  <p className="text-gray-900">{pkg.address}</p>
                  <p className="text-gray-500 text-sm">{pkg.city} {pkg.outOfValley ? '(Out of Valley)' : '(Inside Valley)'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Package & Finance Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Package size={18} className="text-blue-500"/> Package Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Weight</p>
                <p className="text-gray-900">{pkg.weight} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Type</p>
                <p className="text-gray-900 capitalize">{pkg.packageAccess}</p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4 border-t border-gray-100 pt-6 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500"/> Financials</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500">Cash on Delivery (COD)</span>
                <span className="font-semibold text-gray-900">Rs. {pkg.amount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500">Delivery Charge</span>
                <span className="text-gray-900">Rs. {pkg.deliveryCharge}</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded-lg">
                <span className="text-gray-700 font-medium">Net Settlement Amount</span>
                <span className="font-bold text-emerald-600 text-lg">Rs. {pkg.amount - pkg.deliveryCharge}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Delivery Timeline</h3>
          <div className="relative border-l border-gray-200 ml-3 space-y-8 pb-4">
            {pkg.timeline && pkg.timeline.length > 0 ? (
              [...pkg.timeline].reverse().map((event, i) => (
                <div key={i} className="relative pl-6">
                  <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white ${i === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <div>
                      <h4 className="font-medium text-gray-900">{event.status}</h4>
                      <p className="text-sm text-gray-500 mt-1">{event.message}</p>
                      {event.user && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><User size={12}/> {event.user}</p>}
                    </div>
                    <div className="text-xs font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded">
                      {new Date(event.time).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 pl-6">No timeline events recorded.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><MessageSquare size={18} className="text-blue-500"/> Comments & Notes</h3>
          
          <form onSubmit={handleAddComment} className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add a note for the dispatcher or rider</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                placeholder="Type your comment here..." 
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
              <button type="submit" disabled={!newComment.trim() || submittingComment} className="btn btn-primary whitespace-nowrap">
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {pkg.commentList && pkg.commentList.length > 0 ? (
              pkg.commentList.map((comment) => (
                <div key={comment._id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm uppercase">
                        {comment.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{comment.userName}</p>
                        <p className="text-xs text-gray-500 capitalize">{comment.userRole}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-700 text-sm ml-10 whitespace-pre-wrap">{comment.text}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500 font-medium">No comments yet</p>
                <p className="text-sm text-gray-400">Be the first to add a note.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageDetails;
