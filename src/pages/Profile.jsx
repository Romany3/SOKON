import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  
  const isOwner = user?.role === 'owner';

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: null,
    gender: user?.gender || '',
    faculty: user?.faculty || '',
    university: user?.university || '',
    preferredLanguage: user?.preferredLanguage || 'en',
  });

  const [preview, setPreview] = useState(
    user?.avatar ||
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23e2e8f0%22/%3E%3Ccircle cx=%22100%22 cy=%2280%22 r=%2240%22 fill=%22%2394a3b8%22/%3E%3Cellipse cx=%22100%22 cy=%22175%22 rx=%2260%22 ry=%2240%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: null,
        gender: user.gender || '',
        faculty: user.faculty || '',
        university: user.university || '',
        preferredLanguage: user.preferredLanguage || 'en',
      });
      setPreview(
        user.avatar ||
        'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23e2e8f0%22/%3E%3Ccircle cx=%22100%22 cy=%2280%22 r=%2240%22 fill=%22%2394a3b8%22/%3E%3Cellipse cx=%22100%22 cy=%22175%22 rx=%2260%22 ry=%2240%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E'
      );
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const updateData = {
        fullName: formData.fullName,
        phone: formData.phone,
        gender: formData.gender,
        preferredLanguage: formData.preferredLanguage,
      };

      if (!isOwner) {
        updateData.faculty = formData.faculty;
        updateData.university = formData.university;
      }

      if (formData.avatar) {
        updateData.avatar = formData.avatar;
      }

      const response = await usersAPI.updateProfile(updateData);
      setUser(response.data);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error?.message || error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccountSubmit = async (e) => {
    if (e) e.preventDefault();
    setDeleteError('');

    if (!deletePassword.trim()) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }

    setDeleteLoading(true);
    try {
      await usersAPI.deleteProfile(deletePassword);
      setDeleteSuccess('Your account has been deleted successfully');
      
      setTimeout(async () => {
        if (isSupabaseConfigured && supabase) {
          await supabase.auth.signOut();
        }
        logout();
        navigate('/login');
      }, 2000);
    } catch (error) {
      setDeleteError('Incorrect password');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              message.includes("successfully")
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <i className={`fas ${message.includes("successfully") ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          {/* Sidebar */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 h-fit">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <img
                  src={preview}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover border-4 border-slate-50 shadow-md group-hover:opacity-90 transition"
                />
                {isEditing && (
                  <label className="absolute bottom-1 right-1 bg-primary text-white p-3 rounded-full cursor-pointer shadow-lg hover:scale-110 transition">
                    <i className="fas fa-camera"></i>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
              </div>

              <h1 className="mt-6 text-2xl font-black text-slate-900 text-center line-clamp-1">{user?.fullName}</h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <i className={`fas ${isOwner ? 'fa-user-tie' : 'fa-user-graduate'} text-primary`}></i>
                {user?.role}
              </div>

              {!isEditing && (
                <div className="w-full space-y-3 mt-8">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
                  >
                    Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      setDeletePassword('');
                      setDeleteError('');
                      setDeleteSuccess('');
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full bg-red-50 text-red-600 py-3.5 rounded-2xl font-bold hover:bg-red-100 transition"
                  >
                    Delete Account
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Details Content */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-10">
            {!isEditing ? (
              <>
                <h2 className="text-2xl font-black text-slate-900 mb-8">Account Information</h2>
                <div className="grid grid-cols-1 gap-y-8">
                  <InfoItem label="Full Name" value={user?.fullName} icon="fa-user" />
                  <InfoItem label="Email Address" value={user?.email} icon="fa-envelope" />
                  <InfoItem label="Phone Number" value={user?.phone || user?.phoneNumber || "Not provided"} icon="fa-phone" />
                  <InfoItem label="Gender" value={user?.gender || "Not specified"} icon="fa-venus-mars" className="capitalize" />
                  <InfoItem label="Account Type" value={user?.role} icon="fa-shield-halved" className="capitalize" />
                  {!isOwner && <InfoItem label="Faculty" value={user?.faculty || "Not specified"} icon="fa-building-columns" />}
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 mb-8">Edit Profile</h2>

                <div className="grid grid-cols-1 gap-6">
                  <div className="col-span-full">
                    <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition font-bold"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition font-bold"
                    />
                  </div>

                  {!isOwner && (
                    <div>
                      <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Faculty</label>
                      <input
                        type="text"
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleChange}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition font-bold"
                        placeholder="e.g. Engineering"
                      />
                    </div>
                  )}
                  
                  <div className="opacity-60">
                    <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                    <input
                      value={formData.email}
                      disabled
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-bold"
                    />
                  </div>

                  <div className="opacity-60">
                    <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                    <input
                      value={formData.gender}
                      disabled
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed capitalize font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold hover:opacity-95 transition shadow-xl shadow-primary/20"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </span>
                    ) : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal with Password Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
              <i className="fas fa-user-slash"></i>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">Confirm Account Deletion</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              This action is permanent and will delete all your data. Please enter your password to continue.
            </p>

            {deleteError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-bold flex items-center gap-2 border border-red-100 animate-in shake-1">
                <i className="fas fa-circle-exclamation"></i>
                {deleteError}
              </div>
            )}

            {deleteSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center gap-2 border border-emerald-100">
                <i className="fas fa-circle-check"></i>
                {deleteSuccess}
              </div>
            )}

            {!deleteSuccess && (
              <form onSubmit={handleDeleteAccountSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your account password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-slate-950 font-bold focus:outline-none focus:ring-4 focus:ring-red-500/5 transition"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={deleteLoading}
                    className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading}
                    className="flex-1 rounded-2xl bg-red-600 py-4 font-bold text-white hover:bg-red-700 transition shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                  >
                    {deleteLoading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Confirm Delete'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value, icon, className = "" }) => (
  <div className="flex gap-4">
    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary shadow-sm border border-slate-100/50">
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <h3 className={`mt-1 text-lg font-black text-slate-900 truncate ${className}`}>{value || "—"}</h3>
    </div>
  </div>
);
