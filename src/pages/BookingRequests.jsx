import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { bookingsAPI, chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useStoreVersion } from '../hooks/useStoreVersion';
import { getApiErrorMessage } from '../services/apiClient';
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
  const { user } = useAuth();
  const storeVersion = useStoreVersion();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ show: false, title: '', message: '', type: '' });

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        const response = await bookingsAPI.getOwnerBookings();
        const data = response.data?.bookings || response.data || [];
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

  const showFeedback = (title, message, type) => {
    setFeedback({ show: true, title, message, type });
    setTimeout(() => setFeedback({ show: false, title: '', message: '', type: '' }), 3000);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      if (status === 'accepted') {
        await bookingsAPI.acceptBooking(id);
        showFeedback('Booking Approved', 'Booking request approved successfully', 'success');
      } else if (status === 'rejected') {
        await bookingsAPI.rejectBooking(id);
        showFeedback('Booking Declined', 'Booking request declined successfully', 'error');
      }
      
      const response = await bookingsAPI.getOwnerBookings();
      const data = response.data?.bookings || response.data || [];
      const list = Array.isArray(data) ? data : [];
      setBookings([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      alert(getApiErrorMessage(error, 'Failed to update status'));
    }
  };

  const handleChatStudent = async (booking) => {
    const student = booking.student || {};
    const apartment = booking.apartment || {};
    
    // Resolve Student ID from all possible sources
    const studentId = 
      student._id || 
      student.id || 
      booking.clientId || 
      booking.client_id || 
      booking.studentId || 
      booking.student_id || 
      booking.userId || 
      booking.user_id;

    // Resolve Student Name
    const studentName = 
      student.fullName || 
      student.name || 
      booking.studentName || 
      booking.student_name || 
      booking.clientName || 
      booking.userName || 
      'Student';

    // Resolve Student Photo
    const studentPhoto = 
      student.avatar || 
      student.photoUrl || 
      booking.studentPhoto || 
      booking.student_photo || 
      booking.clientPhoto || 
      booking.studentImage || 
      '';
    
    const ownerId = user?._id || user?.id;

    if (!studentId) {
      alert("Cannot start chat: Student ID not found.");
      return;
    }

    if (!ownerId) {
      alert("Please login to chat.");
      return;
    }

    // Role check: Don't allow owner to message themselves or other owners (security)
    if (studentId === ownerId) {
        alert("You cannot chat with yourself.");
        return;
    }

    try {
      const response = await chatAPI.getOrCreateConversation({
        participantIds: [ownerId, studentId],
        apartmentId: apartment._id || apartment.id || booking.apartmentId || booking.apartment_id,
        participants: [
          { _id: ownerId, fullName: user.fullName || user.name || 'Owner', photoUrl: user.avatar || user.photoUrl || '', role: 'owner' },
          { _id: studentId, fullName: studentName, photoUrl: studentPhoto, role: 'student' },
        ],
      });
      const conversation = response.data?.conversation || response.data;
      if (conversation?._id || conversation?.id) {
        navigate(`/messages/${conversation._id || conversation.id}`);
      }
    } catch (error) {
      alert(getApiErrorMessage(error, 'Could not start chat with student.'));
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
              const apartment = booking.apartment || {};

              // Comprehensive fallback for Apartment Image
              const aptImg = (apartment.images && apartment.images[0]) || booking.apartmentImage || booking.apartment_image || booking.image || APARTMENT_PLACEHOLDER;
              
              // Comprehensive fallback for Student Name
              const stuName = student.fullName || student.name || booking.studentName || booking.clientName || booking.userName || 'Student';
              
              // Comprehensive fallback for Student Avatar
              const stuAvatar = student.avatar || student.photoUrl || booking.studentPhoto || booking.student_photo || booking.clientPhoto || booking.studentImage || AVATAR_SM_PLACEHOLDER;

              // Comprehensive fallback for Faculty
              const stuFaculty = student.faculty || student.college || booking.studentFaculty || booking.student_faculty || booking.faculty || booking.college || 'Faculty not specified';

              return (
                <div key={booking._id} className="overflow-hidden rounded-[32px] bg-white shadow-sm border border-slate-100">
                  <div className="grid gap-0 md:grid-cols-[300px_1fr]">
                    <div className="h-64 bg-slate-200 md:h-auto relative">
                      <img src={aptImg} className="h-full w-full object-cover" alt="" />
                      <div className="absolute top-4 left-4">
                         <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${style}`}>
                           {booking.status}
                         </span>
                      </div>
                    </div>

                    <div className="p-8 flex flex-col justify-between">
                      <div className="flex flex-col lg:flex-row gap-8 justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 mb-4">Student Information</h3>
                          <div className="flex items-center gap-4">
                             <div className="h-16 w-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                               <img src={stuAvatar} className="h-full w-full object-cover" alt="" />
                             </div>
                             <div className="min-w-0">
                               <h4 className="text-2xl font-black text-slate-900 truncate">{stuName}</h4>
                               <p className="text-slate-400 font-bold text-xs uppercase tracking-tight mt-1">{stuFaculty}</p>
                             </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-slate-50">
                             <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Requested Apartment</p>
                             <h3 className="text-xl font-black text-slate-900">{apartment.title || booking.apartmentName || 'Apartment'}</h3>
                             <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                               <i className="fas fa-location-dot text-primary text-xs"></i> {apartment.district || booking.apartmentAddress || 'District unknown'}, {apartment.city || booking.city || 'Asyut'}
                             </p>
                          </div>
                        </div>

                        <div className="lg:w-64 space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                              <DataTile label="Duration" value={booking.startDate + ' to ' + booking.endDate} full />
                              <DataTile label="Occupants" value={booking.people_count + ' Person'} />
                              <DataTile label="Payout" value={booking.totalPrice + ' EGY'} highlight />
                           </div>

                           <div className="flex flex-col gap-2 pt-2">
                             {booking.status === 'pending' && (
                               <div className="flex gap-2">
                                 <button onClick={() => handleUpdateStatus(booking._id, 'accepted')} className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs uppercase hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">Approve</button>
                                 <button onClick={() => handleUpdateStatus(booking._id, 'rejected')} className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-bold text-xs uppercase hover:bg-rose-700 transition shadow-lg shadow-rose-200">Decline</button>
                               </div>
                             )}
                             <button 
                                onClick={() => handleChatStudent(booking)}
                                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                             >
                               <i className="fas fa-comment-dots"></i>
                               Chat Student
                             </button>
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

      {/* Feedback Popup */}
      {feedback.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
           <div className={`rounded-3xl shadow-2xl px-8 py-6 flex items-center gap-4 border ${
             feedback.type === 'success' ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'
           }`}>
             <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${
               feedback.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
             }`}>
               <i className={`fas ${feedback.type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
             </div>
             <div>
               <h4 className="text-lg font-black text-slate-900">{feedback.title}</h4>
               <p className="text-slate-500 font-medium text-sm">{feedback.message}</p>
             </div>
           </div>
        </div>
      )}
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
