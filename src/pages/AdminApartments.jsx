import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminNavbar } from '../components/AdminNavbar';
import { ApartmentCard } from '../components/ApartmentCard';
import { apartmentsAPI } from '../services/api';
import apiClient from '../services/apiClient';

export const AdminApartments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || 'all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApartments = async () => {
    setLoading(true);
    try {
      const res = await apartmentsAPI.getAllApartments();
      setApartments(res.data?.apartments || []);
    } catch (err) {
      console.error('Error fetching apartments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  const stats = useMemo(() => {
    return {
      total: apartments.length,
      verified: apartments.filter(a => a.verified).length,
      unverified: apartments.filter(a => !a.verified).length,
    };
  }, [apartments]);

  const filteredApartments = useMemo(() => {
    let result = [...apartments];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title?.toLowerCase().includes(q) || 
        a.address?.toLowerCase().includes(q) ||
        a.district?.toLowerCase().includes(q)
      );
    }

    if (selectedStatus === 'verified') {
      result = result.filter(a => a.verified);
    } else if (selectedStatus === 'unverified') {
      result = result.filter(a => !a.verified);
    }

    result.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortOrder === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortOrder === 'price-high') return b.price - a.price;
      if (sortOrder === 'price-low') return a.price - b.price;
      return 0;
    });

    return result;
  }, [apartments, searchQuery, selectedStatus, sortOrder]);

  const handleVerifyToggle = (apartment, status) => {
    setSelectedApartment(apartment);
    setTargetStatus(status);
    setIsVerifyModalOpen(true);
  };

  const confirmVerification = async () => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/apartments/${selectedApartment._id}/verify`, {
        verified: targetStatus
      });
      await fetchApartments();
      setIsVerifyModalOpen(false);
    } catch (err) {
      console.error('Error updating verification:', err);
      alert('Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Apartment Management</h1>
            <p className="text-slate-500 mt-1">Verify listings and manage property database</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 w-full md:w-64 transition"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Highest Price</option>
              <option value="price-low">Lowest Price</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
           <button 
             onClick={() => setSelectedStatus('all')}
             className={`p-6 rounded-3xl border transition-all flex items-center gap-4 text-left ${selectedStatus === 'all' ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900 hover:border-slate-200'}`}
           >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${selectedStatus === 'all' ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                 <i className="fas fa-building"></i>
              </div>
              <div>
                 <p className={`text-[10px] font-black uppercase tracking-widest ${selectedStatus === 'all' ? 'text-white/60' : 'text-slate-400'}`}>Total Units</p>
                 <p className="text-2xl font-black">{stats.total}</p>
              </div>
           </button>
           <button 
             onClick={() => setSelectedStatus('verified')}
             className={`p-6 rounded-3xl border transition-all flex items-center gap-4 text-left ${selectedStatus === 'verified' ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-200 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900 hover:border-slate-200'}`}
           >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${selectedStatus === 'verified' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
                 <i className="fas fa-check-circle"></i>
              </div>
              <div>
                 <p className={`text-[10px] font-black uppercase tracking-widest ${selectedStatus === 'verified' ? 'text-white/60' : 'text-slate-400'}`}>Verified</p>
                 <p className="text-2xl font-black">{stats.verified}</p>
              </div>
           </button>
           <button 
             onClick={() => setSelectedStatus('unverified')}
             className={`p-6 rounded-3xl border transition-all flex items-center gap-4 text-left ${selectedStatus === 'unverified' ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-100 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900 hover:border-slate-200'}`}
           >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${selectedStatus === 'unverified' ? 'bg-white/20' : 'bg-amber-50 text-amber-600'}`}>
                 <i className="fas fa-clock"></i>
              </div>
              <div>
                 <p className={`text-[10px] font-black uppercase tracking-widest ${selectedStatus === 'unverified' ? 'text-white/60' : 'text-slate-400'}`}>Pending</p>
                 <p className="text-2xl font-black">{stats.unverified}</p>
              </div>
           </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-white rounded-[32px] animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : filteredApartments.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-slate-100 p-20 text-center shadow-sm">
             <i className="fas fa-house-circle-xmark text-6xl text-slate-200 mb-4"></i>
             <h3 className="text-xl font-bold text-slate-900">No apartments found</h3>
             <p className="text-slate-500 mt-2">No properties match your current search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredApartments.map((apartment) => (
              <div key={apartment._id} className="flex flex-col">
                <ApartmentCard apartment={apartment} disableLink={true} />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/apartments/${apartment._id}`)}
                    className="flex-1 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:opacity-90 transition"
                  >
                    Apartment Details
                  </button>
                  {apartment.verified ? (
                    <button
                      onClick={() => handleVerifyToggle(apartment, false)}
                      className="flex-1 py-3 rounded-2xl bg-amber-50 text-amber-600 text-sm font-bold hover:bg-amber-100 transition"
                    >
                      Unverify
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerifyToggle(apartment, true)}
                      className="flex-1 py-3 rounded-2xl bg-emerald-50 text-emerald-600 text-sm font-bold hover:bg-emerald-100 transition"
                    >
                      Verify Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl">
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl mb-6 ${
              targetStatus ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <i className={targetStatus ? 'fas fa-shield-check' : 'fas fa-shield-exclamation'}></i>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Change Verification Status
            </h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to change apartment verification status for <span className="font-bold text-slate-900">{selectedApartment?.title}</span>?
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmVerification}
                disabled={actionLoading}
                className={`flex-1 py-4 rounded-2xl text-white font-bold transition shadow-lg flex items-center justify-center gap-2 ${
                  targetStatus ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' : 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'
                }`}
              >
                {actionLoading && <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
