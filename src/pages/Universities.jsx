import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { UniversitySection } from '../components/UniversitySection';
import { apartmentsAPI } from '../services/api';

export const Universities = () => {
  const [allApartments, setAllApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApartments = async () => {
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
      <div className="pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-black text-slate-900">Universities in Assiut</h1>
          <p className="text-slate-500 mt-2">Find the best housing options near your academic institution.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <p className="text-slate-400">Loading university data...</p>
        </div>
      ) : (
        <UniversitySection allApartments={allApartments} />
      )}
    </div>
  );
};
