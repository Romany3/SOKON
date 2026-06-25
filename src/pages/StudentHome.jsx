import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ApartmentCard } from '../components/ApartmentCard';
import { UniversitySection } from '../components/UniversitySection';
import { apartmentsAPI } from '../services/api';
import { useStoreVersion } from '../hooks/useStoreVersion';

export const StudentHome = () => {
  const navigate = useNavigate();
  const storeVersion = useStoreVersion();
  const [apartments, setApartments] = useState([]);
  const [allApartments, setAllApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    beds: '',
    rooms: '',
  });

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [featuredResponse, allResponse] = await Promise.all([
          apartmentsAPI.getApartments({
            q: searchQuery,
            ...filters,
          }),
          apartmentsAPI.getAllApartments(),
        ]);

        const featuredData = featuredResponse.data;
        const allData = allResponse.data;

        let featuredList = Array.isArray(featuredData) ? featuredData : (featuredData?.apartments || []);
        const allList = Array.isArray(allData) ? allData : (allData?.apartments || []);

        // Frontend fallback filtering for Featured section
        featuredList = featuredList.filter(apt => {
          const matchesMinPrice = !filters.minPrice || apt.price >= Number(filters.minPrice);
          const matchesMaxPrice = !filters.maxPrice || apt.price <= Number(filters.maxPrice);
          const matchesBeds = !filters.beds || (apt.beds >= Number(filters.beds) || apt.bedrooms >= Number(filters.beds));
          const matchesRooms = !filters.rooms || (apt.rooms >= Number(filters.rooms) || apt.living_rooms >= Number(filters.rooms));
          
          return matchesMinPrice && matchesMaxPrice && matchesBeds && matchesRooms;
        });

        setApartments(featuredList);
        setAllApartments(allList);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      loadHomeData();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters, searchQuery, storeVersion]);

  const topLocations = useMemo(() => {
    const locationCounts = allApartments.reduce((accumulator, apartment) => {
      const locationName = apartment.district || apartment.location || apartment.city || 'Unknown';
      accumulator[locationName] = (accumulator[locationName] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }
        return left.name.localeCompare(right.name);
      });
  }, [allApartments]);

  const handleSearch = (event) => {
    event.preventDefault();
  };

  const visibleApartments = apartments.slice(0, 6);

  return (
    <div className="w-full min-h-screen bg-[#f6f7fb]">
      <Navbar />

      <div className="relative overflow-hidden px-4 pt-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_70%)]" />
        <div className="max-w-7xl mx-auto rounded-[32px] border border-slate-200 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)] px-6 py-8 md:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Student Housing
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                Find apartments by availability, occupancy, and location.
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:w-[420px]">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Listings</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{allApartments.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Featured</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{apartments.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Locations</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{topLocations.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full</p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {allApartments.filter((apartment) => apartment.isFull).length}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-8 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-black/60"></i>
                <input
                  type="text"
                  placeholder="Search apartments, districts, or descriptions..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#245999]/20"
                />
              </div>

              <button
                type="submit"
                className="rounded-2xl bg-primary px-8 py-4 font-bold text-white transition hover:opacity-90"
              >
                Search
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block mb-1 text-xs font-bold text-slate-500 uppercase ml-2">Min Price</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={filters.minPrice}
                  onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-bold text-slate-500 uppercase ml-2">Max Price</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={filters.maxPrice}
                  onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-bold text-slate-500 uppercase ml-2">Rooms</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={filters.rooms}
                  onChange={(event) => setFilters((current) => ({ ...current, rooms: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Featured Apartments</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/apartments')}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            Loading apartments...
          </div>
        ) : visibleApartments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleApartments.map((apartment) => (
              <ApartmentCard key={apartment._id} apartment={apartment} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white py-16 text-center shadow-sm">
            <p className="text-slate-500">No apartments found</p>
          </div>
        )}
      </div>

      <UniversitySection allApartments={allApartments} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Top Locations</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Most active districts</h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/locations')}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View All
          </button>
        </div>

        {topLocations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topLocations.slice(0, 6).map((location) => (
              <button
                key={location.name}
                type="button"
                onClick={() => navigate(`/search?district=${encodeURIComponent(location.name)}`)}
                className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Location</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">{location.name}</h3>
                  </div>

                  <div className="rounded-2xl bg-primary/10 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-wide text-primary/60">Units</p>
                    <p className="text-2xl font-black text-primary">{location.count}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                  <span>Explore this area</span>
                  <i className="fas fa-arrow-right transition group-hover:translate-x-1"></i>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white py-16 text-center shadow-sm">
            <p className="text-slate-500">No locations available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
