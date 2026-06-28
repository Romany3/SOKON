import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminNavbar } from '../components/AdminNavbar';
import { apartmentsAPI, usersAPI, bookingsAPI } from '../services/api';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalOwners: 0,
    totalApartments: 0,
    verifiedApartments: 0,
    activeBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [usersRes, aptsRes, bookingsRes] = await Promise.all([
          usersAPI.getUsers(),
          apartmentsAPI.getAllApartments(),
          bookingsAPI.getOwnerBookings(),
        ]);

        const users = usersRes.data?.users || [];
        const apartments = aptsRes.data?.apartments || [];
        const bookings = bookingsRes.data?.bookings || [];

        const verified = apartments.filter(a => a.verified).length;

        setStats({
          totalUsers: users.length,
          totalStudents: users.filter(u => u.role === 'student' || u.role === 'client').length,
          totalOwners: users.filter(u => u.role === 'owner').length,
          totalApartments: apartments.length,
          verifiedApartments: verified,
          unverifiedApartments: apartments.length - verified,
          activeBookings: bookings.filter(b => b.status === 'approved' || b.status === 'accepted').length,
        });

        // Process real data for Recent Activity
        const userActivity = users
          .filter(u => u.createdAt)
          .map(u => ({
            id: `u-${u._id}`,
            user: u.fullName,
            avatar: u.avatar,
            timestamp: new Date(u.createdAt),
            time: new Date(u.createdAt).toLocaleDateString(),
            desc: 'joined the platform as a new user',
            type: 'user'
          }));

        const apartmentActivity = apartments
          .filter(a => a.createdAt)
          .map(a => ({
            id: `a-${a._id}`,
            user: a.ownerName || 'An owner',
            timestamp: new Date(a.createdAt),
            time: new Date(a.createdAt).toLocaleDateString(),
            desc: `listed a new apartment: ${a.title}`,
            type: 'apartment'
          }));

        const combinedActivity = [...userActivity, ...apartmentActivity]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10); // Show top 10 recent activities

        setRecentActivity(combinedActivity);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-left flex flex-col h-full cursor-pointer transition-colors active:bg-slate-50"
    >
      <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center text-white text-xl mb-4 shadow-lg shadow-inherit/20`}>
        <i className={icon}></i>
      </div>
      <div className="mt-auto">
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">{title}</h3>
        <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Welcome back, Admin</h1>
            <p className="text-slate-500 text-lg mt-2">Manage Sokon platform from one place.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-white rounded-[32px] animate-pulse border border-slate-100 shadow-sm"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Grid - No Hover Animations (hover:-translate-y-1 and hover:shadow-xl removed) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon="fas fa-users"
                color="bg-indigo-600"
                onClick={() => navigate('/admin/users')}
              />
              <StatCard
                title="Students"
                value={stats.totalStudents}
                icon="fas fa-user-graduate"
                color="bg-blue-600"
                onClick={() => navigate('/admin/users?role=student')}
              />
              <StatCard
                title="Owners"
                value={stats.totalOwners}
                icon="fas fa-user-tie"
                color="bg-violet-600"
                onClick={() => navigate('/admin/users?role=owner')}
              />
              <StatCard
                title="Apartments"
                value={stats.totalApartments}
                icon="fas fa-building"
                color="bg-primary"
                onClick={() => navigate('/admin/apartments')}
              />
              <StatCard
                title="Verified"
                value={stats.verifiedApartments}
                icon="fas fa-check-circle"
                color="bg-emerald-600"
                onClick={() => navigate('/admin/apartments?status=verified')}
              />
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Recent Activity - Fixed logic and full width */}
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 md:p-10">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-black text-slate-900">Recent Activity</h2>
                  <button 
                    onClick={() => navigate('/admin/logs')}
                    className="px-6 py-2.5 rounded-xl bg-slate-50 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    View All Logs
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {recentActivity.length > 0 ? recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-5 group">
                      <div className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm shrink-0">
                        {item.avatar ? (
                          <img src={item.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
                            <i className={item.type === 'user' ? 'fas fa-user' : 'fas fa-building'}></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-600 leading-snug">
                          <span className="font-bold text-slate-900">{item.user}</span> {item.desc}
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5 font-bold uppercase tracking-widest">{item.time}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-10 text-center text-slate-400">
                      No recent activity found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const QuickActionButton = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className={`${color} text-white flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm hover:opacity-90 transition shadow-lg shadow-inherit/20 active:scale-95`}
  >
    <i className={icon}></i>
    {label}
  </button>
);
