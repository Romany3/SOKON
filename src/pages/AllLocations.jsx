import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
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
    if (!locations.length) return;
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
    <div className="min-h-screen bg-[#f1f5f9]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header Section */}
        <div className="rounded-[24px] border border-slate-200 bg-white px-10 py-12 shadow-sm mb-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Location explorer</p>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">All Locations</h1>
              <p className="text-slate-500 font-medium">
                Explore each district and the apartments registered inside it.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f8fafc] border border-slate-100 p-8 min-w-[200px] flex flex-col items-center justify-center relative">
               <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 absolute top-4">Location</p>
               <p className="text-5xl font-black text-slate-900 mt-2">{locations.length}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Sidebar: Locations List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-900">Locations</h2>
              <span className="rounded-full bg-slate-200/50 px-3 py-1 text-[10px] font-black uppercase text-slate-500 tracking-wider">Sorted by count</span>
            </div>

            <div className="space-y-4">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 rounded-[24px] bg-white animate-pulse border border-slate-100"></div>
                ))
              ) : locations.map((location) => (
                <button
                  key={location.name}
                  onClick={() => {
                    setSelectedLocation(location.name);
                    setSearchParams({ location: location.name });
                  }}
                  className={`group relative flex w-full items-center justify-between rounded-[20px] border p-6 text-left transition-all duration-300 ${
                    selectedLocation === location.name
                      ? 'border-transparent bg-[#245999] text-white shadow-xl shadow-blue-900/20 translate-x-2'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-blue-200 hover:shadow-lg'
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className="text-xl font-black leading-none">{location.name}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${
                      selectedLocation === location.name ? 'text-white/60' : 'text-slate-400'
                    }`}>
                      Click to view apartments
                    </p>
                  </div>

                  <div className={`rounded-xl px-4 py-3 text-center min-w-[100px] transition-colors ${
                    selectedLocation === location.name ? 'bg-white/20 border border-white/10' : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <p className={`text-[9px] font-black uppercase tracking-tight ${
                      selectedLocation === location.name ? 'text-white/70' : 'text-slate-400'
                    }`}>
                      Apartments
                    </p>
                    <p className="text-2xl font-black">{location.count}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content: Apartment Grid */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-sm min-h-[600px]">
            <div className="mb-10 flex flex-col gap-4 border-b border-slate-100 pb-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  {selectedLocation || 'Select Location'}
                </h2>
              </div>
              <div className="rounded-full bg-[#245999] px-6 py-2">
                 <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                   {selectedLocationCount} Apartments
                 </p>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-[24px] bg-slate-100 animate-pulse"></div>
                ))}
              </div>
            ) : selectedApartments.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2">
                {selectedApartments.map((apt) => (
                  <LocationApartmentCard key={apt._id} apartment={apt} navigate={navigate} />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                 <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                   <i className="fas fa-city text-5xl"></i>
                 </div>
                 <h3 className="text-xl font-black text-slate-900">No units found</h3>
                 <p className="mt-2 text-slate-400">There are no apartments registered in this district yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LocationApartmentCard = ({ apartment, navigate }) => {
  const capacity = apartment.max_people || apartment.capacity || 0;
  const occupied = apartment.occupiedCount || 0;
  const occupancyPercent = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

  return (
    <div 
      onClick={() => navigate(`/apartment/${apartment._id}`)}
      className="group cursor-pointer overflow-hidden rounded-[28px] border border-slate-200 bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200"
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
        <img 
          src={apartment.images?.[0] || 'https://via.placeholder.com/600x400?text=No+Image'} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={apartment.title} 
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 rounded-xl bg-slate-950/80 backdrop-blur-md px-4 py-2">
          <p className="text-xs font-black text-white">${apartment.price}/month</p>
        </div>

        <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 backdrop-blur-sm px-4 py-2 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-900 uppercase">
            {occupied} / {capacity} occupied
          </p>
        </div>
      </div>

      <div className="p-7 space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{apartment.title}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-400">
            <i className="fas fa-location-dot text-[12px]"></i>
            {apartment.district}, {apartment.city}
          </p>
        </div>

        <div className="flex items-center justify-between border-y border-slate-50 py-4">
          <FeatureIcon icon="fa-bed" text={`${apartment.bedrooms || 0} Beds`} />
          <FeatureIcon icon="fa-door-open" text={`${apartment.rooms || 0} Rooms`} />
          <FeatureIcon icon="fa-bath" text={`${apartment.bathrooms || 0} Bath`} />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
             <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Occupancy</span>
             <span className="text-xs font-black text-primary">{occupancyPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-50">
            <div 
              className="h-full bg-[#245999] transition-all duration-1000 ease-out" 
              style={{ width: `${occupancyPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureIcon = ({ icon, text }) => (
  <div className="flex items-center gap-2 text-slate-600">
    <i className={`fas ${icon} text-[#245999] text-sm`}></i>
    <span className="text-[11px] font-bold">{text}</span>
  </div>
);
