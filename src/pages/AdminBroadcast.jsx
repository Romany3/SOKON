import React, { useState, useEffect } from 'react';
import { AdminNavbar } from '../components/AdminNavbar';
import { notificationsAPI } from '../services/api';

export const AdminBroadcast = () => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'admin_announcement',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      // Fetch notifications sent to "all" users
      const res = await notificationsAPI.getNotifications('all');
      const notifications = res.data?.notifications || [];
      // Filter only for admin announcements to show in history
      const announcements = notifications.filter(n => n.type === 'admin_announcement' || n.receiverId === 'all');
      setHistory(announcements);
    } catch (err) {
      console.error('Error fetching broadcast history:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;
    
    setLoading(true);
    setSuccess('');

    try {
      await notificationsAPI.createNotification({
        title: formData.title.trim(),
        body: formData.body.trim(),
        type: formData.type,
        receiverId: 'all'
      });
      
      setSuccess('Announcement broadcasted successfully to all users!');
      setFormData({ title: '', body: '', type: 'admin_announcement' });
      fetchHistory();
      
      // Auto hide success message
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Broadcast error:', err);
      alert('Failed to send broadcast message. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar />

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900">Broadcast Center</h1>
          <p className="text-slate-500 mt-1">Send global announcements and platform updates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Announcement Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10">
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <i className="fas fa-paper-plane text-primary"></i>
                Create New Announcement
              </h2>

              {success && (
                <div className="mb-8 p-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <i className="fas fa-check text-sm"></i>
                  </div>
                  <p className="font-bold">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Announcement Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition font-medium"
                    placeholder="e.g., Scheduled System Maintenance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Message Content *</label>
                  <textarea
                    required
                    rows="6"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition resize-none font-medium"
                    placeholder="Type your message to all users here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-4 ml-1">Category & Urgency</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <TypeOption 
                      label="General" 
                      active={formData.type === 'admin_announcement'} 
                      onClick={() => setFormData({...formData, type: 'admin_announcement'})}
                     />
                     <TypeOption 
                      label="Update" 
                      active={formData.type === 'update'} 
                      onClick={() => setFormData({...formData, type: 'update'})}
                     />
                     <TypeOption 
                      label="Warning" 
                      active={formData.type === 'alert'} 
                      onClick={() => setFormData({...formData, type: 'alert'})}
                     />
                     <TypeOption 
                      label="Maintenance" 
                      active={formData.type === 'maintenance'} 
                      onClick={() => setFormData({...formData, type: 'maintenance'})}
                     />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:opacity-95 transition shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <i className="fas fa-bullhorn text-lg"></i>
                    )}
                    Send Broadcast Message
                  </button>
                  <p className="text-center text-[11px] text-slate-400 mt-4 font-bold uppercase tracking-widest leading-relaxed">
                    Caution: This message will be sent instantly to <span className="text-slate-900">all registered accounts</span> and cannot be undone.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
              <h2 className="text-xl font-black text-slate-900 mb-8">Broadcast History</h2>

              {fetchingHistory ? (
                <div className="space-y-4">
                   {[...Array(4)].map((_, i) => (
                     <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse"></div>
                   ))}
                </div>
              ) : history.length === 0 ? (
                <div className="py-20 text-center">
                   <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fas fa-history text-2xl text-slate-200"></i>
                   </div>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No broadcast history</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((msg) => (
                    <div key={msg._id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-primary/20 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                         <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                           msg.type === 'maintenance' ? 'bg-amber-100 text-amber-600' :
                           msg.type === 'alert' ? 'bg-red-100 text-red-600' :
                           'bg-primary/10 text-primary'
                         }`}>
                           {msg.type?.replace('_', ' ') || 'General'}
                         </div>
                         <span className="text-[10px] font-bold text-slate-400">
                           {new Date(msg.createdAt).toLocaleDateString()}
                         </span>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">{msg.title}</h4>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{msg.message}</p>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-100/50">
                         <i className="fas fa-users text-[12px]"></i>
                         <span>All Users Reach</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const TypeOption = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${
      active 
        ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
    }`}
  >
    {label}
  </button>
);
