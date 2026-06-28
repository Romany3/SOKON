import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminNavbar } from '../components/AdminNavbar';
import { usersAPI, bookingsAPI } from '../services/api';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';
import { getApiErrorMessage } from '../services/apiClient';

export const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, bookingsRes] = await Promise.all([
        usersAPI.getUserById(userId),
        bookingsAPI.getStudentBookings(userId),
      ]);
      setUser(userRes.data);
      setBookings(bookingsRes.data?.bookings || []);
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <AdminNavbar />
        <div className="flex items-center justify-center py-32">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <AdminNavbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
           <h2 className="text-2xl font-bold text-slate-900">User not found</h2>
           <button onClick={() => navigate('/admin/users')} className="mt-4 text-primary font-bold">Back to users</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-slate-500 font-bold mb-8 hover:text-slate-900 transition"
        >
          <i className="fas fa-arrow-left"></i>
          Back to User Management
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 text-center">
              <div className="h-32 w-32 rounded-3xl overflow-hidden mx-auto border-4 border-slate-50 shadow-md mb-6">
                <img src={user.avatar || AVATAR_SM_PLACEHOLDER} alt="" className="h-full w-full object-cover" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">{user.fullName}</h1>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                user.role === 'owner' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'
              }`}>
                <i className={user.role === 'owner' ? 'fas fa-user-tie' : 'fas fa-user-graduate'}></i>
                {user.role}
              </div>

              <div className="mt-8 space-y-3">
                 <button 
                  onClick={() => navigate(`/admin/messages?chatWith=${user._id}`)}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:opacity-90 transition shadow-lg shadow-slate-200"
                 >
                   Send Private Message
                 </button>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
              <h3 className="text-lg font-black text-slate-900 mb-6">Platform Access</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-medium">Joined Date</span>
                  <span className="text-sm font-bold text-slate-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-medium">Account Status</span>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-medium">Verified Email</span>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Info Grid */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10">
              <h2 className="text-xl font-black text-slate-900 mb-8">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                <DetailItem label="Full Name" value={user.fullName} icon="fas fa-user" />
                <DetailItem label="Email Address" value={user.email} icon="fas fa-envelope" />
                <DetailItem label="Phone Number" value={user.phoneNumber || 'Not provided'} icon="fas fa-phone" />
                <DetailItem label="Gender" value={user.gender || 'Not specified'} icon="fas fa-venus-mars" className="capitalize" />
                {user.role === 'student' && (
                  <DetailItem label="College / Faculty" value={user.college || 'Not specified'} icon="fas fa-university" />
                )}
                <DetailItem label="User ID" value={user._id} icon="fas fa-hashtag" />
              </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10">
              <h2 className="text-xl font-black text-slate-900 mb-8">
                {user.role === 'student' ? 'Rental History' : 'Managed Listings'}
              </h2>
              
              {bookings.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                   <p className="text-slate-400 font-medium italic">No activity history found for this user</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:border-primary/20 transition group">
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img src={booking.apartment?.images?.[0] || AVATAR_SM_PLACEHOLDER} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{booking.apartment?.title || 'Unknown Apartment'}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {booking.startDate || 'N/A'} — {booking.endDate || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">${booking.totalPrice}</p>
                        <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 inline-block ${
                          booking.status === 'accepted' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {booking.status}
                        </span>
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

const DetailItem = ({ label, value, icon, className = "" }) => (
  <div className="flex gap-4">
    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
      <i className={icon}></i>
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-slate-900 font-bold mt-1 break-words ${className}`}>{value}</p>
    </div>
  </div>
);
