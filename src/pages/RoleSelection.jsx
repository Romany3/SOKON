import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { supabase } from '../services/supabaseClient';

export const RoleSelection = () => {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleData, setGoogleData] = useState({ gender: '', photoUrl: '' });
  const [selectedGender, setSelectedGender] = useState('');

  useEffect(() => {
    const getSupabaseData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata) {
        const metadata = session.user.user_metadata;
        const gender = metadata.gender || '';
        setGoogleData({
          gender: gender,
          photoUrl: metadata.avatar_url || metadata.picture || ''
        });
        if (gender) setSelectedGender(gender);
      }
    };
    getSupabaseData();
  }, []);

  const handleRoleSelect = async (selectedRole) => {
    if (!selectedGender) {
      setError('Please select your gender first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Update profile with role + data from Google (gender, photo)
      await usersAPI.updateProfile({
        role: selectedRole,
        gender: selectedGender,
        photoUrl: googleData.photoUrl
      });
      await fetchUser(); // reload context user with new role
      navigate('/home');
    } catch (err) {
      setError(err?.message || err.response?.data?.message || 'Failed to update account role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-[#0b1b3d] via-[#0A3D62] to-[#154674] px-4 py-12 text-white">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md shadow-2xl md:p-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl drop-shadow-md">
          Welcome to SOKON
        </h1>
        <p className="mt-4 text-white/80 text-lg">
          Complete your profile to find your perfect home
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="mt-10">
          <label className="block text-sm font-semibold uppercase tracking-widest text-white/60 mb-4">
            First, Select your Gender
          </label>
          <div className="flex justify-center gap-4 mb-10">
            <button
              onClick={() => setSelectedGender('male')}
              className={`flex-1 py-4 rounded-2xl border-2 transition-all duration-300 font-bold ${
                selectedGender === 'male'
                ? 'bg-blue-500 border-blue-400 text-white shadow-lg scale-105'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              <i className="fas fa-mars mr-2"></i> Male
            </button>
            <button
              onClick={() => setSelectedGender('female')}
              className={`flex-1 py-4 rounded-2xl border-2 transition-all duration-300 font-bold ${
                selectedGender === 'female'
                ? 'bg-pink-500 border-pink-400 text-white shadow-lg scale-105'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              <i className="fas fa-venus mr-2"></i> Female
            </button>
          </div>

          <label className="block text-sm font-semibold uppercase tracking-widest text-white/60 mb-4">
            Now, Select your Account Type
          </label>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Student Card */}
            <button
              onClick={() => handleRoleSelect('student')}
              disabled={loading}
              className="group relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center transition duration-300 hover:scale-105 hover:border-blue-400 hover:bg-white/10 disabled:opacity-50"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 transition group-hover:bg-blue-500 group-hover:text-white">
                <i className="fa-solid fa-graduation-cap text-3xl"></i>
              </div>
              <h3 className="mt-6 text-2xl font-black">Student</h3>
              <p className="mt-3 text-white/60 text-sm leading-relaxed">
                Find safe, verified housing close to your university and book rooms instantly.
              </p>
            </button>

            {/* Owner Card */}
            <button
              onClick={() => handleRoleSelect('owner')}
              disabled={loading}
              className="group relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center transition duration-300 hover:scale-105 hover:border-emerald-400 hover:bg-white/10 disabled:opacity-50"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 transition group-hover:bg-emerald-50 group-hover:text-white">
                <i className="fa-solid fa-hotel text-3xl"></i>
              </div>
              <h3 className="mt-6 text-2xl font-black">Property Owner</h3>
              <p className="mt-3 text-white/60 text-sm leading-relaxed">
                List your apartments, manage student bookings, and view analytics dashboards.
              </p>
            </button>
          </div>

          {loading && (
            <div className="mt-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
