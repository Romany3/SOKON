import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { UniversitySection } from '../components/UniversitySection';
import { apartmentsAPI } from '../services/api';

export const Universities = () => {
  const [allApartments, setAllApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApartments = async () => {
      setLoading(true);
      try {
        const response = await apartmentsAPI.getAllApartments();
        setAllApartments(Array.isArray(response.data) ? response.data : (response.data?.apartments || []));
      } catch (error) {
        console.error('Error fetching apartments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApartments();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#f6f7fb]">
      <Navbar />

      {/* Header Section matching Home Page style */}
      <div className="relative overflow-hidden px-4 pt-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_70%)]" />
        <div className="max-w-7xl mx-auto rounded-[32px] border border-slate-200 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)] px-6 py-8 md:px-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              University Hub
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Find housing close to your campus.
            </h1>
            <p className="mt-4 text-slate-500 text-lg">
              We calculate the exact distance between each apartment and university to help you find the most convenient stay.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-32 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading university data...</p>
        </div>
      ) : (
        <UniversitySection allApartments={allApartments} />
      )}
    </div>
  );
};
