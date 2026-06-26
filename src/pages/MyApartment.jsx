import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { apartmentsAPI } from '../services/api';
import { useStoreVersion } from '../hooks/useStoreVersion';
import { APARTMENT_PLACEHOLDER } from '../utils/placeholders';

export const MyApartment = () => {
  const navigate = useNavigate();
  const storeVersion = useStoreVersion();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApartments = async () => {
      setLoading(true);

      try {
        const response = await apartmentsAPI.getMyApartments();
        const data = response.data;
        setApartments(Array.isArray(data) ? data : (data?.apartments || []));
      } catch (error) {
        console.error('Error fetching apartments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApartments();
  }, [storeVersion]);

  const stats = useMemo(() => ({
    total: apartments.length,
    pending: apartments.filter((apartment) => apartment.status === 'pending_approval' || apartment.status === 'pending').length,
    approved: apartments.filter((apartment) => apartment.status === 'approved').length,
  }), [apartments]);

  const handleDeleteApartment = async (id) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this apartment?');
    if (!shouldDelete) {
      return;
    }

    try {
      await apartmentsAPI.deleteApartment(id);
    } catch (error) {
      console.error('Error deleting apartment:', error);
    }
  };

  const truncateDescription = (text) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= 20) return text;
    return words.slice(0, 20).join(' ') + '...';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="px-4 pt-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Owner workspace
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
                My Apartments
              </h1>
              <p className="mt-2 max-w-2xl text-slate-500 font-medium text-lg">
                Manage your listings, view occupancy, and edit property details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/add-apartment')}
              className="rounded-2xl bg-primary px-8 py-4 font-black text-white transition hover:opacity-90 shadow-lg shadow-primary/20"
            >
              Add New Apartment
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-[28px] bg-white p-6 border border-slate-100 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Units</p>
            <p className="mt-2 text-4xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-[28px] bg-white p-6 border border-slate-100 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending</p>
            <p className="mt-2 text-4xl font-black text-amber-600">{stats.pending}</p>
          </div>
          <div className="rounded-[28px] bg-white p-6 border border-slate-100 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Live</p>
            <p className="mt-2 text-4xl font-black text-emerald-600">{stats.approved}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="mb-8 text-2xl font-black text-slate-900">Unit Database</h2>

        {loading ? (
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse border border-slate-100"></div>
            ))}
          </div>
        ) : apartments.length > 0 ? (
          <div className="space-y-6">
            {apartments.map((apartment) => {
              const occupiedCount = Number(apartment.occupiedCount || 0);
              const capacity = Number(apartment.capacity ?? apartment.max_people ?? apartment.beds ?? 0);
              const hasCapacity = capacity > 0;
              const occupancy = hasCapacity ? Math.min((occupiedCount / capacity) * 100, 100) : 0;

              return (
                <div key={apartment._id} className="overflow-hidden rounded-[32px] bg-white shadow-sm border border-slate-100">
                  <div className="grid gap-0 md:grid-cols-[300px_1fr]">
                    <div className="h-64 bg-slate-200 md:h-full relative overflow-hidden">
                      <img
                        src={apartment.images?.[0] || APARTMENT_PLACEHOLDER}
                        alt={apartment.title || apartment.name}
                        className="h-full w-full object-cover transition transform hover:scale-105 duration-700"
                      />
                      <div className="absolute top-4 left-4">
                         <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${
                           apartment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                         }`}>
                           {apartment.status?.replace('_', ' ')}
                         </span>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-black text-slate-900 truncate">
                            {apartment.title || apartment.name}
                          </h3>

                          <p className="mt-2 text-slate-500 font-bold flex items-center gap-2">
                            <i className="fas fa-location-dot text-primary"></i>
                            {apartment.district}, {apartment.city}
                          </p>
                          
                          <div className="mt-4">
                            <p className="text-slate-600 leading-relaxed font-medium inline">
                              {truncateDescription(apartment.description_en || apartment.description_ar || apartment.description)}
                            </p>
                            {(apartment.description_en || apartment.description_ar || apartment.description)?.split(' ').length > 20 && (
                              <button 
                                onClick={() => navigate(`/apartment/${apartment._id}`)}
                                className="text-primary font-black text-sm ml-2 hover:underline"
                              >
                                Read More
                              </button>
                            )}
                          </div>

                          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <SmallInfoTile label="Total Capacity" value={hasCapacity ? `${capacity} Students` : 'Not set'} />
                            <SmallInfoTile label="Current Occupancy" value={`${occupiedCount} Occupied`} />
                            <SmallInfoTile label="Monthly Price" value={`$${apartment.price}`} />
                            <SmallInfoTile label="District" value={apartment.district} />
                          </div>

                          <div className="mt-8">
                            <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                              <span>Occupancy Rate</span>
                              <span>{hasCapacity ? `${occupiedCount} / ${capacity}` : 'N/A'}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-50">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${occupancy >= 100 ? 'bg-rose-500' : 'bg-primary'}`}
                                style={{ width: `${occupancy}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="lg:w-48 shrink-0 space-y-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/apartment/${apartment._id}`)}
                            className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 shadow-sm"
                          >
                            View Public Page
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/edit-apartment/${apartment._id}`)}
                            className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-white transition hover:opacity-90 shadow-md shadow-primary/10"
                          >
                            Edit Listing
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteApartment(apartment._id)}
                            className="w-full rounded-2xl bg-rose-50 px-4 py-3.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
                          >
                            Delete Unit
                          </button>
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
            <i className="fas fa-building text-5xl text-slate-200 mb-6"></i>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No units registered yet</h3>
            <p className="text-slate-400 font-medium mb-8">List your first property to start receiving student bookings.</p>
            <button
              type="button"
              onClick={() => navigate('/add-apartment')}
              className="rounded-2xl bg-primary px-10 py-4 font-black text-white transition hover:opacity-95 shadow-xl shadow-primary/20"
            >
              Get Started Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SmallInfoTile = ({ label, value }) => (
  <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 shadow-inner">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="mt-0.5 font-bold text-slate-900 text-sm truncate">{value}</p>
  </div>
);
