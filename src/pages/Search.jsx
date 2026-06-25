import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { apartmentsAPI } from '../services/api';
import { ApartmentCard } from '../components/ApartmentCard';
import { useStoreVersion } from '../hooks/useStoreVersion';

export const Search = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const storeVersion = useStoreVersion();
  
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    beds: '',
    rooms: '',
    district: '',
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      // We pass the search query to the API, but we'll apply other filters strictly on the frontend
      // to avoid issues with backend implementation details.
      const response = await apartmentsAPI.getApartments({
        q: searchQuery
      });
      
      const resData = response.data;
      const apartmentList = Array.isArray(resData) ? resData : (resData?.apartments || []);
      
      // Strict Frontend Filtering
      const filteredResults = apartmentList.filter(apt => {
        // 1. Price Filtering
        // If minPrice is provided, price must be >= minPrice
        const minPriceValue = filters.minPrice !== '' ? Number(filters.minPrice) : null;
        if (minPriceValue !== null && apt.price < minPriceValue) return false;
        
        // If maxPrice is provided, price must be <= maxPrice
        const maxPriceValue = filters.maxPrice !== '' ? Number(filters.maxPrice) : null;
        if (maxPriceValue !== null && apt.price > maxPriceValue) return false;

        // 2. Exact match for Beds (as requested)
        if (filters.beds !== '') {
          const targetBeds = Number(filters.beds);
          if (apt.beds !== targetBeds && apt.bedrooms !== targetBeds) return false;
        }

        // 3. Exact match for Rooms (as requested)
        if (filters.rooms !== '') {
          const targetRooms = Number(filters.rooms);
          if (apt.rooms !== targetRooms && apt.living_rooms !== targetRooms) return false;
        }

        // 4. District Filtering
        if (filters.district !== '' && apt.district !== filters.district) return false;

        return true;
      });

      setApartments(filteredResults);
    } catch (error) {
      console.error('Error searching apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, filters, storeVersion]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Card */}
        <div className="bg-white rounded-3xl shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Search Apartments</h1>
              <p className="text-gray-500 mt-1">Find your perfect place by adjusting the filters below</p>
            </div>

            <button
              onClick={() => {
                setSearchQuery("");
                setFilters({
                  minPrice: "",
                  maxPrice: "",
                  beds: "",
                  rooms: "",
                  district: "",
                });
              }}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 duration-300 font-bold text-slate-700 transition"
            >
              Clear Filters
            </button>
          </div>

          <div className="space-y-6">
            {/* Search Input */}
            <div className="relative">
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="Search by name, location, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 p-5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition text-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block mb-2 text-sm font-bold text-slate-700 ml-1">Min Price</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-slate-700 ml-1">Max Price</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-slate-700 ml-1">Beds</label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={filters.beds}
                  onChange={(e) => setFilters({ ...filters, beds: e.target.value })}
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-slate-700 ml-1">Rooms</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={filters.rooms}
                  onChange={(e) => setFilters({ ...filters, rooms: e.target.value })}
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-slate-700 ml-1">District</label>
                <select
                  value={filters.district}
                  onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50"
                >
                  <option value="">All Districts</option>
                  <option value="فريال">فريال</option>
                  <option value="سيد">سيد</option>
                  <option value="قلتة">قلتة</option>
                  <option value="سيتي">سيتي</option>
                  <option value="الجمهورية">الجمهورية</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 border-t-primary mx-auto"></div>
              <p className="mt-4 text-slate-500 font-medium">Updating results...</p>
            </div>
          ) : apartments.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800">Available Apartments</h2>
                <span className="bg-white px-5 py-2 rounded-2xl shadow-sm text-sm font-bold text-primary">
                  {apartments.length} {apartments.length === 1 ? 'result' : 'results'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apartments.map((apartment) => (
                  <ApartmentCard key={apartment._id} apartment={apartment} />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[32px] shadow-sm p-20 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-search text-4xl text-slate-300"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No matching apartments</h3>
              <p className="text-slate-500 max-w-md mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setFilters({ minPrice: "", maxPrice: "", beds: "", rooms: "", district: "" });
                }}
                className="mt-8 text-primary font-bold hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
