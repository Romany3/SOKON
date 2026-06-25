import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ApartmentCard } from '../components/ApartmentCard';
import { apartmentsAPI } from '../services/api';
import { useStoreVersion } from '../hooks/useStoreVersion';

export const AllApartments = () => {
  const storeVersion = useStoreVersion();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApartments = async () => {
      setLoading(true);

      try {
        const response = await apartmentsAPI.getAllApartments();
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

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Marketplace</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                All Apartments
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Every approved apartment registered on the platform, including listings that are currently full.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total apartments</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{apartments.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="rounded-[28px] bg-white py-20 text-center text-slate-500 shadow-sm">
              Loading apartments...
            </div>
          ) : apartments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {apartments.map((apartment) => (
                <ApartmentCard key={apartment._id} apartment={apartment} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] bg-white py-20 text-center shadow-sm">
              <i className="fas fa-building text-6xl text-slate-300 mb-5"></i>
              <h3 className="text-2xl font-bold mb-2 text-slate-900">No apartments found</h3>
              <p className="text-slate-500">Listings will appear here once owners publish apartments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
