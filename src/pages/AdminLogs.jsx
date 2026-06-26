import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminNavbar } from '../components/AdminNavbar';
import { usersAPI, apartmentsAPI, bookingsAPI } from '../services/api';

export const AdminLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch all main resources to build the audit log
        const [usersRes, aptsRes, bookingsRes] = await Promise.all([
          usersAPI.getUsers(),
          apartmentsAPI.getAllApartments(),
          bookingsAPI.getOwnerBookings(), // Assuming admin can see all or relevant bookings
        ]);

        const users = usersRes.data?.users || [];
        const apartments = aptsRes.data?.apartments || [];
        const bookings = bookingsRes.data?.bookings || [];

        // 1. Process User Registrations
        const userLogs = users.filter(u => u.createdAt).map(u => ({
          id: `u-${u._id}`,
          type: 'registration',
          title: 'New Registration',
          desc: `${u.fullName} joined the platform`,
          user: u.fullName,
          avatar: u.avatar,
          timestamp: new Date(u.createdAt),
          icon: u.role === 'owner' ? 'fas fa-user-tie' : 'fas fa-user-graduate',
          color: u.role === 'owner' ? 'text-violet-500' : 'text-blue-500'
        }));

        // 2. Process Apartment Listings
        const apartmentLogs = apartments.filter(a => a.createdAt).map(a => ({
          id: `a-${a._id}`,
          type: 'apartment',
          title: a.verified ? 'Listing Verified' : 'New Listing Added',
          desc: `${a.title} - ${a.district}`,
          user: a.ownerName || 'Property Owner',
          avatar: a.ownerPhotoUrl,
          timestamp: new Date(a.createdAt),
          icon: a.verified ? 'fas fa-shield-check' : 'fas fa-building',
          color: a.verified ? 'text-emerald-500' : 'text-indigo-500'
        }));

        // 3. Process Booking Activities
        const bookingLogs = bookings.filter(b => b.createdAt).map(b => ({
          id: `b-${b._id}`,
          type: 'booking',
          title: `Booking ${b.status.charAt(0).toUpperCase() + b.status.slice(1)}`,
          desc: `Unit: ${b.apartment?.title || 'Apartment'}`,
          user: b.student?.fullName || b.clientName || 'Student',
          avatar: b.student?.avatar || b.clientAvatar,
          timestamp: new Date(b.createdAt),
          icon: b.status === 'approved' || b.status === 'accepted' ? 'fas fa-check-double' : 'fas fa-calendar-alt',
          color: b.status === 'approved' || b.status === 'accepted' ? 'text-emerald-600' : 'text-amber-500'
        }));

        // Combine all events and sort by Newest First
        const combined = [...userLogs, ...apartmentLogs, ...bookingLogs]
          .sort((a, b) => b.timestamp - a.timestamp);

        setLogs(combined);
      } catch (err) {
        console.error('Error compiling audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = log.user.toLowerCase().includes(q) || 
                            log.title.toLowerCase().includes(q) ||
                            log.desc.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || log.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [logs, searchQuery, filter]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar />

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Activity Audit Logs</h1>
            <p className="text-slate-500 mt-1">Real-time tracking of every event in the Sokon ecosystem</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search by user or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 w-full md:w-72 transition shadow-sm"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="all">All Activities</option>
              <option value="registration">User Registrations</option>
              <option value="apartment">Property Actions</option>
              <option value="booking">Booking Updates</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center shadow-sm">
             <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-clipboard-list text-3xl text-slate-200"></i>
             </div>
             <h3 className="text-xl font-bold text-slate-900">No matching logs</h3>
             <p className="text-slate-500 mt-2">Adjust your filters to see historical activities</p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">System Activity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Responsible User</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-6">
                         <div className="flex items-start gap-4">
                            <div className={`h-11 w-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 ${log.color}`}>
                               <i className={log.icon}></i>
                            </div>
                            <div>
                               <p className="font-bold text-slate-900 leading-tight">{log.title}</p>
                               <p className="text-sm text-slate-500 mt-1 font-medium">{log.desc}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-slate-100 overflow-hidden border border-white shadow-sm">
                               <img src={log.avatar || `https://ui-avatars.com/api/?name=${log.user}&background=random`} alt="" className="h-full w-full object-cover" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{log.user}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <p className="text-sm font-black text-slate-900">{log.timestamp.toLocaleDateString()}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                 System Records: <span className="text-slate-900">{filteredLogs.length}</span>
               </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
