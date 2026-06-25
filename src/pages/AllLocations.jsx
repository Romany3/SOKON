import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ApartmentCard } from '../components/ApartmentCard';
import { apartmentsAPI } from '../services/api';
import { useStoreVersion } from '../hooks/useStoreVersion';

export const AllLocations = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const storeVersion = useStoreVersion();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');

  useEffect(() => {
    const loadApartments = async () => {
      setLoading(true);

      try {
        const response = await apartmentsAPI.getAllApartments();
        const data = response.data;
        const apartmentList = Array.isArray(data) ? data : (data?.apartments || []);
        setApartments(apartmentList);
      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApartments();
  }, [storeVersion]);

  const locations = useMemo(() => {
    const counts = apartments.reduce((accumulator, apartment) => {
      const locationName = apartment.district || apartment.location || apartment.city || 'Unknown';
      accumulator[locationName] = (accumulator[locationName] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }

        return left.name.localeCompare(right.name);
      });
  }, [apartments]);

  useEffect(() => {
    if (!locations.length) {
      return;
    }

    const selectedExists = locations.some((location) => location.name === selectedLocation);
    if (!selectedLocation || !selectedExists) {
      const nextLocation = searchParams.get('location') || locations[0].name;
      setSelectedLocation(nextLocation);
      setSearchParams({ location: nextLocation }, { replace: true });
    }
  }, [locations, searchParams, selectedLocation, setSearchParams]);

  const selectedApartments = useMemo(() => (
    apartments.filter((apartment) => {
      const locationName = apartment.district || apartment.location || apartment.city || 'Unknown';
      return locationName === selectedLocation;
    })
  ), [apartments, selectedLocation]);

  const selectedLocationCount = locations.find((location) => location.name === selectedLocation)?.count || 0;

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Location explorer</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">All Locations</h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Explore each district and the apartments registered inside it.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Locations</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{locations.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Locations</h2>
              <span className="text-sm text-slate-400">Sorted by count</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500">Loading locations...</div>
            ) : locations.length > 0 ? (
              <div className="space-y-3">
                {locations.map((location) => (
                  <button
                    key={location.name}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(location.name);
                      setSearchParams({ location: location.name }, { replace: false });
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                      selectedLocation === location.name
                        ? 'border-[#245999] bg-[#245999] text-white shadow-lg'
                        : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <h3 className="text-lg font-black">{location.name}</h3>
                      <p className={`text-sm ${selectedLocation === location.name ? 'text-white/75' : 'text-slate-500'}`}>
                        Click to view apartments
                      </p>
                    </div>

                    <div className={`rounded-2xl px-4 py-3 text-right ${
                      selectedLocation === location.name ? 'bg-white/10' : 'bg-white'
                    }`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${
                        selectedLocation === location.name ? 'text-white/70' : 'text-slate-400'
                      }`}>
                        Apartments
                      </p>
                      <p className="text-2xl font-black">{location.count}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500">No locations available yet.</div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Selected location</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  {selectedLocation || 'Choose a location'}
                </h2>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Apartments</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{selectedLocationCount}</p>
              </div>
            </div>

            {selectedApartments.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {selectedApartments.map((apartment) => (
                  <ApartmentCard key={apartment._id} apartment={apartment} />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] bg-slate-50 py-16 text-center text-slate-500">
                <i className="fas fa-location-dot text-5xl text-slate-300 mb-4"></i>
                <p className="font-semibold text-slate-700">No apartments in this location yet.</p>
                <button
                  type="button"
                  onClick={() => navigate('/apartments')}
                  className="mt-4 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  Browse all apartments
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
