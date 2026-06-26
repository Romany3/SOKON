import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminNavbar } from '../components/AdminNavbar';
import { apartmentsAPI } from '../services/api';
import apiClient from '../services/apiClient';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

export const AdminApartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  useEffect(() => {
    const fetchApartment = async () => {
      setLoading(true);
      try {
        const res = await apartmentsAPI.getApartment(id);
        setApartment(res.data);
      } catch (err) {
        console.error('Error fetching apartment details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApartment();
  }, [id]);

  const handleVerifyToggle = async () => {
    setActionLoading(true);
    try {
      const newStatus = !apartment.verified;
      await apiClient.patch(`/apartments/${id}/verify`, {
        verified: newStatus
      });
      setApartment({ ...apartment, verified: newStatus });
      setIsVerifyModalOpen(false);
    } catch (err) {
      console.error('Error updating verification:', err);
      alert('Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

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

  if (!apartment) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <AdminNavbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
           <h2 className="text-2xl font-bold text-slate-900">Apartment not found</h2>
           <button onClick={() => navigate('/admin/apartments')} className="mt-4 text-primary font-bold">Back to listings</button>
        </div>
      </div>
    );
  }

  const isVerified = apartment.verified;
  const mediaUrl = apartment.videoUrl || apartment.video_url || '';

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <button
            onClick={() => navigate('/admin/apartments')}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Apartment Management
          </button>

          <div className="flex gap-3">
             {isVerified ? (
               <button 
                onClick={() => setIsVerifyModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-amber-50 text-amber-600 font-bold hover:bg-amber-100 transition flex items-center gap-2"
               >
                 <i className="fas fa-shield-exclamation"></i>
                 Remove Verification
               </button>
             ) : (
               <button 
                onClick={() => setIsVerifyModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:opacity-90 transition shadow-lg shadow-emerald-200 flex items-center gap-2"
               >
                 <i className="fas fa-shield-check"></i>
                 Verify Listing
               </button>
             )}
             <button className="px-6 py-3 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition flex items-center gap-2">
               <i className="fas fa-trash-alt"></i>
               Delete
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Title and verification badge */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
               <div className="flex flex-wrap items-center gap-4 mb-4">
                  <h1 className="text-3xl font-black text-slate-900">{apartment.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {isVerified ? 'Verified' : 'Pending Verification'}
                  </span>
               </div>
               <p className="flex items-center gap-2 text-slate-500 font-medium">
                  <i className="fas fa-location-dot text-primary"></i>
                  {apartment.address}, {apartment.district}, {apartment.city}
               </p>
            </div>

            {/* Media Section */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
               <div className="aspect-video w-full bg-slate-900">
                  {mediaUrl ? (
                    <video controls src={mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                       <i className="fas fa-video-slash text-6xl"></i>
                    </div>
                  )}
               </div>
               <div className="p-6 grid grid-cols-4 gap-4">
                  {apartment.images?.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                       <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
               </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
               <h2 className="text-xl font-black text-slate-900 mb-6">Property Description</h2>
               <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {apartment.description_en || apartment.description}
               </p>
            </div>

            {/* Stats/Details */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
               <h2 className="text-xl font-black text-slate-900 mb-8">Unit Features</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <FeatureItem label="Bedrooms" value={apartment.bedrooms} icon="fas fa-bed" />
                  <FeatureItem label="Bathrooms" value={apartment.bathrooms} icon="fas fa-bath" />
                  <FeatureItem label="Rooms" value={apartment.rooms} icon="fas fa-door-open" />
                  <FeatureItem label="Floor" value={apartment.floor} icon="fas fa-layer-group" />
                  <FeatureItem label="Max Capacity" value={apartment.max_people} icon="fas fa-users" />
                  <FeatureItem label="Available" value={apartment.available_people} icon="fas fa-user-check" />
                  <FeatureItem label="Price" value={`$${apartment.price}`} icon="fas fa-tag" />
                  <FeatureItem label="Location" value={apartment.district} icon="fas fa-map-marked-alt" />
               </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
             {/* Owner Card */}
             <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                <h3 className="text-lg font-black text-slate-900 mb-6">Listed by</h3>
                <div className="flex items-center gap-4 mb-8">
                   <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                      <img src={apartment.ownerPhotoUrl || AVATAR_SM_PLACEHOLDER} alt="" className="h-full w-full object-cover" />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-900">{apartment.ownerName}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Property Owner</p>
                   </div>
                </div>
                <div className="space-y-4 mb-8">
                   <div className="flex items-center gap-3 text-sm text-slate-600">
                      <i className="fas fa-envelope w-5 text-primary"></i>
                      <span>{apartment.owner?.email || 'email@example.com'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-600">
                      <i className="fas fa-phone w-5 text-primary"></i>
                      <span>{apartment.owner?.phone || 'No phone provided'}</span>
                   </div>
                </div>
                <button 
                  onClick={() => navigate(`/admin/messages?chatWith=${apartment.ownerId}`)}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:opacity-90 transition shadow-lg shadow-slate-200"
                >
                   Contact Owner
                </button>
             </div>

             {/* Admin Status Log (Mock) */}
             <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                <h3 className="text-lg font-black text-slate-900 mb-6">Activity Log</h3>
                <div className="space-y-6">
                   <LogEntry 
                    action="Unit Registered" 
                    time={new Date(apartment.createdAt).toLocaleDateString()} 
                    user={apartment.ownerName}
                   />
                   {isVerified && (
                     <LogEntry 
                      action="Admin Verified" 
                      time="Recently" 
                      user="Super Admin"
                      active
                     />
                   )}
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Verification Confirmation Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl">
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl mb-6 ${
              !isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <i className={!isVerified ? 'fas fa-shield-check' : 'fas fa-shield-exclamation'}></i>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {!isVerified ? 'Verify Apartment' : 'Remove Verification'}
            </h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to change the verification status of <span className="font-bold text-slate-900">{apartment.title}</span>? 
              This will be visible to all users immediately.
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
                onClick={handleVerifyToggle}
                disabled={actionLoading}
                className={`flex-1 py-4 rounded-2xl text-white font-bold transition shadow-lg flex items-center justify-center gap-2 ${
                  !isVerified ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' : 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'
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

const FeatureItem = ({ label, value, icon }) => (
  <div className="flex flex-col gap-2">
    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary text-sm shadow-sm">
      <i className={icon}></i>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-slate-900 font-bold text-sm mt-0.5">{value || 'N/A'}</p>
    </div>
  </div>
);

const LogEntry = ({ action, time, user, active }) => (
  <div className="flex gap-4 relative">
     <div className="flex flex-col items-center">
        <div className={`h-3 w-3 rounded-full ${active ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-200'} z-10`}></div>
        <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>
     </div>
     <div className="pb-4">
        <p className="text-sm font-bold text-slate-900 leading-none">{action}</p>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">{time} by {user}</p>
     </div>
  </div>
);
