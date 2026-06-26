import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { bookingsAPI } from '../services/api';
import { useStoreVersion } from '../hooks/useStoreVersion';
import { APARTMENT_PLACEHOLDER, AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  declined: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-600',
};

export const BookingRequests = () => {
  const navigate = useNavigate();
  const storeVersion = useStoreVersion();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        const response = await bookingsAPI.getOwnerBookings();
        const data = response.data?.bookings || response.data || [];
        // Sort newest first
        const list = Array.isArray(data) ? data : [];
        setBookings([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (error) {
        console.error('Error fetching booking requests:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [storeVersion]);

  const totals = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    approved: bookings.filter((b) => b.status === 'accepted' || b.status === 'approved').length,
  }), [bookings]);

  const handleUpdateStatus = async (id, status) => {
    const actionName = status === 'accepted' ? 'approve' : status === 'rejected' ? 'reject' : 'cancel';
    if (!window.confirm(`Are you sure you want to ${actionName} this booking?`)) return;

    try {
      if (status === 'accepted') {
        await bookingsAPI.acceptBooking(id);
      } else if (status === 'rejected') {
        await bookingsAPI.rejectBooking(id);
      } else if (status === 'cancelled') {
        await bookingsAPI.cancelBooking(id);
      }
      
      // Refresh list after update
      const response = await bookingsAPI.getOwnerBookings();
      const data = response.data?.bookings || response.data || [];
      const list = Array.isArray(data) ? data : [];
      setBookings([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="px-4 pt-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Management Console
              </div>
              <h1 className="text-4xl font-black text-slate-900 mt-4">Booking Requests</h1>
              <p className="text-slate-500 font-medium text-lg mt-2">Manage incoming rental applications for your units.</p>
            </div>
            <button onClick={() => navigate('/my-apartment')} className="rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white transition hover:bg-slate-800">
               View My Units
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label="Total Received" value={totals.total} color="text-slate-900" />
          <StatCard label="Pending" value={totals.pending} color="text-amber-600" />
          <StatCard label="Approved" value={totals.approved} color="text-emerald-600" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-slate-100 shadow-sm"></div>
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const style = statusStyles[booking.status] || statusStyles.pending;
              const student = booking.student || {};

              return (
                <div key={booking._id} className="overflow-hidden rounded-[32px] bg-white shadow-sm border border-slate-100">
                  <div className="grid gap-0 md:grid-cols-[300px_1fr]">
                    <div className="h-64 bg-slate-200 md:h-auto relative">
                      <img src={booking.apartment?.images?.[0] || APARTMENT_PLACEHOLDER} className="h-full w-full object-cover" alt="" />
                      <div className="absolute top-4 left-4">
                         <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${style}`}>
                           {booking.status}
                         </span>
                      </div>
                    </div>

                    <div className="p-8 flex flex-col justify-between">
                      <div className="flex flex-col lg:flex-row gap-8 justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Student Information</h3>
                          <div className="mt-4 flex items-center gap-4">
                             <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                               <img src={student.avatar || AVATAR_SM_PLACEHOLDER} className="h-full w-full object-cover" alt="" />
                             </div>
                             <div>
                               <h4 className="text-2xl font-black text-slate-900">{student.fullName || 'Student'}</h4>
                               <p className="text-slate-500 font-bold text-sm uppercase tracking-tighter">{student.faculty} • {student.phone}</p>
                             </div>
                          </div>

                          <div className="mt-8">
                             <h3 className="text-xl font-black text-slate-900">{booking.apartment?.title}</h3>
                             <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                               <i className="fas fa-location-dot text-primary"></i> {booking.apartment?.district}, {booking.apartment?.city}
                             </p>
                          </div>
                        </div>

                        <div className="lg:w-64 space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                              <DataTile label="Duration" value={booking.startDate + ' to ' + booking.endDate} full />
                              <DataTile label="Occupants" value={booking.people_count + ' Person'} />
                              <DataTile label="Payout" value={'$' + booking.totalPrice} highlight />
                           </div>

                           <div className="flex gap-2 pt-2">
                             {booking.status === 'pending' && (
                               <>
                                 <button onClick={() => handleUpdateStatus(booking._id, 'accepted')} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase hover:bg-emerald-700 transition">Approve</button>
                                 <button onClick={() => handleUpdateStatus(booking._id, 'rejected')} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs uppercase hover:bg-rose-700 transition">Decline</button>
                               </>
                             )}
                             {(booking.status === 'accepted' || booking.status === 'approved') && (
                               <button onClick={() => handleUpdateStatus(booking._id, 'cancelled')} className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs uppercase hover:bg-slate-200 transition">Cancel Booking</button>
                             )}
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[40px] bg-white py-24 text-center border border-slate-100 shadow-sm">
             <i className="fas fa-inbox text-5xl text-slate-200 mb-6"></i>
             <h3 className="text-2xl font-black text-slate-900">No active requests</h3>
             <p className="text-slate-400 font-medium">Student housing applications will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="rounded-[28px] bg-white p-6 border border-slate-100 shadow-sm">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
    <p className={`mt-2 text-4xl font-black ${color}`}>{value}</p>
  </div>
);

const DataTile = ({ label, value, highlight, full }) => (
  <div className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 ${full ? 'col-span-2' : ''}`}>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={`text-xs font-black mt-1 truncate ${highlight ? 'text-primary' : 'text-slate-900'}`}>{value}</p>
  </div>
);
