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
    pending: apartments.filter((apartment) => apartment.status === 'pending_approval').length,
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

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Navbar />

      <div className="px-4 pt-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Owner workspace
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
                My Apartments
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Manage your listings, view occupancy, and edit the apartment media or location.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/add-apartment')}
              className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Add apartment
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-[24px] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total Apartments</p>
            <p className="mt-2 text-4xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-[24px] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Pending Approval</p>
            <p className="mt-2 text-4xl font-black text-amber-600">{stats.pending}</p>
          </div>
          <div className="rounded-[24px] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Active Listings</p>
            <p className="mt-2 text-4xl font-black text-emerald-600">{stats.approved}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8">
        <h2 className="mb-6 text-2xl font-black text-slate-900">My Apartments</h2>

        {loading ? (
          <div className="rounded-[28px] bg-white py-16 text-center text-slate-500 shadow-sm">
            Loading apartments...
          </div>
        ) : apartments.length > 0 ? (
          <div className="space-y-6">
            {apartments.map((apartment) => {
              const occupiedCount = Number(apartment.occupiedCount || 0);
              const capacity = Number(apartment.capacity ?? apartment.max_people ?? apartment.beds ?? 0);
              const hasCapacity = capacity > 0;
              const occupancy = hasCapacity ? Math.min((occupiedCount / capacity) * 100, 100) : 0;

              return (
                <div key={apartment._id} className="overflow-hidden rounded-[28px] bg-white shadow-sm">
                  <div className="grid gap-0 md:grid-cols-[260px_1fr]">
                    <div className="h-56 bg-slate-200 md:h-full">
                      <img
                        src={apartment.images?.[0] || APARTMENT_PLACEHOLDER}
                        alt={apartment.title || apartment.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-black text-slate-900">
                              {apartment.title || apartment.name}
                            </h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                              apartment.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : apartment.status === 'pending_approval'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                            }`}>
                              {apartment.status}
                            </span>
                          </div>

                          <p className="mt-3 text-slate-500">
                            <i className="fas fa-location-dot mr-2 text-[#245999]"></i>
                            {apartment.district}, {apartment.city}
                          </p>
                          <p className="mt-3 max-w-2xl text-slate-600">
                            {apartment.description_en || apartment.description_ar || apartment.description || ''}
                          </p>

                          <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Capacity</span>
                              <span className="mt-1 block font-semibold text-slate-900">{hasCapacity ? capacity : 'Not set'}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Occupied</span>
                              <span className="mt-1 block font-semibold text-slate-900">{occupiedCount}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Requested price</span>
                              <span className="mt-1 block font-semibold text-slate-900">${apartment.price}/mo</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Availability</span>
                              <span className="mt-1 block font-semibold text-slate-900">{apartment.availability}</span>
                            </div>
                          </div>

                          <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                              <span>Occupancy</span>
                              <span>{hasCapacity ? `${occupiedCount} / ${capacity}` : 'Capacity not set'}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${occupancy >= 100 ? 'bg-rose-500' : 'bg-[#245999]'}`}
                                style={{ width: `${occupancy}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="min-w-[180px]">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Location</p>
                            <p className="mt-1 font-semibold text-slate-900">{apartment.location}</p>
                          </div>

                          <div className="mt-4 flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/apartment/${apartment._id}`)}
                              className="rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/edit-apartment/${apartment._id}`)}
                              className="rounded-2xl bg-[#245999] px-4 py-3 font-semibold text-white transition hover:bg-[#1f4f86]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteApartment(apartment._id)}
                              className="rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-700"
                            >
                              Delete
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
          <div className="rounded-[28px] bg-white py-20 text-center shadow-sm">
            <i className="fas fa-building text-6xl text-slate-300 mb-5"></i>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">No apartments yet</h3>
            <p className="text-slate-500 mb-5">Create your first listing to start receiving bookings.</p>
            <button
              type="button"
              onClick={() => navigate('/add-apartment')}
              className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Add your first apartment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
