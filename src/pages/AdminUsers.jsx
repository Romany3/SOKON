import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminNavbar } from '../components/AdminNavbar';
import { usersAPI } from '../services/api';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

export const AdminUsers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFilter = searchParams.get('role');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(roleFilter || 'all');
  const [sortOrder, setSortSortOrder] = useState('newest');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'suspend' or 'ban'

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await usersAPI.getUsers();
        setUsers(res.data?.users || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.fullName.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        u.phoneNumber?.includes(q)
      );
    }

    if (selectedRole !== 'all') {
      result = result.filter(u => u.role === selectedRole);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [users, searchQuery, selectedRole, sortOrder]);

  const handleAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const confirmAction = async () => {
    // In a real app, call API to suspend/ban
    console.log(`${actionType} user:`, selectedUser._id);
    setIsActionModalOpen(false);
    // Refresh or update local state
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900">User Management</h1>
            <p className="text-slate-500 mt-1">Review and manage platform members</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 w-full md:w-64 transition"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="owner">Owners</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortSortOrder(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-slate-100 p-20 text-center shadow-sm">
             <i className="fas fa-users-slash text-6xl text-slate-200 mb-4"></i>
             <h3 className="text-xl font-bold text-slate-900">No users found</h3>
             <p className="text-slate-500 mt-2">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <div key={user._id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 hover:shadow-xl transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
                    <img src={user.avatar || AVATAR_SM_PLACEHOLDER} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 truncate">{user.fullName}</h3>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase mt-1 tracking-wider ${
                      user.role === 'owner' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <i className={user.role === 'owner' ? 'fas fa-user-tie' : 'fas fa-user-graduate'}></i>
                      {user.role}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <i className="fas fa-envelope w-4 text-slate-300"></i>
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <i className="fas fa-phone w-4 text-slate-300"></i>
                    <span>{user.phoneNumber || 'Not provided'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/admin/users/${user._id}`)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:opacity-90 transition"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => navigate(`/admin/messages?chatWith=${user._id}`)}
                    className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition"
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Action Confirmation Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl">
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl mb-6 ${
              actionType === 'ban' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <i className={actionType === 'ban' ? 'fas fa-user-slash' : 'fas fa-user-clock'}></i>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {actionType === 'ban' ? 'Ban User Permanently' : 'Suspend User'}
            </h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to {actionType} <span className="font-bold text-slate-900">{selectedUser?.fullName}</span>? 
              {actionType === 'ban' ? ' This action will permanently remove their access to the platform.' : ' This will temporarily disable their account.'}
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction}
                className={`flex-1 py-4 rounded-2xl text-white font-bold transition shadow-lg ${
                  actionType === 'ban' ? 'bg-red-600 shadow-red-200 hover:bg-red-700' : 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'
                }`}
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
