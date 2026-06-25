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
    city: '',
    district: '',
    apartmentType: '',
  });

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const searchParams = {
        q: searchQuery,
        ...filters,
      };
      const response = await apartmentsAPI.getApartments(searchParams);
      const resData = response.data;
      const apartmentList = Array.isArray(resData) ? resData : (resData?.apartments || []);
      setApartments(apartmentList);
    } catch (error) {
      console.error('Error searching apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

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

  <div className="flex items-center justify-between mb-6">

  <div>
  <h1 className="text-3xl font-bold">
  Search Apartments
  </h1>

  <p className="text-gray-500 mt-1">
  Find your perfect place
  </p>
  </div>

  <button
  onClick={()=>{
  setSearchQuery("");

  setFilters({
  minPrice:"",
  maxPrice:"",
  beds:"",
  city:"",
  district:"",
  apartmentType:""
  })
  }}
  className="
  px-5
  py-3
  rounded-xl
  bg-gray-200
  hover:bg-gray-300
  duration-300"
  >
  Clear Filters
  </button>

  </div>


  <div className="space-y-5">

  {/* Search Input */}

  <div className="relative">

  <i className="fas fa-search absolute pt-1 left-4 top-4 text-gray-400"></i>

  <input type="text" placeholder="Search apartments..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className=" w-full pl-12 p-4 rounded-xl border focus:outline-none focus:ring-2"/>

  </div>


  <div className="grid md:grid-cols-3 gap-5">

  <div>

  <label className="block mb-2 font-medium">
  Min Price
  </label>

  <input
  type="number"
  value={filters.minPrice}
  onChange={(e)=>
  setFilters({
  ...filters,
  minPrice:e.target.value
  })
  }
  className="
  w-full
  p-4
  border
  rounded-xl"
  />

  </div>


  <div>

  <label className="block mb-2 font-medium">
  Max Price
  </label>

  <input
  type="number"
  value={filters.maxPrice}
  onChange={(e)=>
  setFilters({
  ...filters,
  maxPrice:e.target.value
  })
  }
  className="
  w-full
  p-4
  border
  rounded-xl"
  />

  </div>


  <div>

  <label className="block mb-2 font-medium">
  Bedrooms
  </label>

  <select
  value={filters.beds}
  onChange={(e)=>
  setFilters({
  ...filters,
  beds:e.target.value
  })
  }
  className="
  w-full
  p-4
  border
  rounded-xl"
  >

  <option value="">
  Any
  </option>

  <option value="1">
  1 Bedroom
  </option>

  <option value="2">
  2 Bedrooms
  </option>

  <option value="3">
  3+ Bedrooms
  </option>

  </select>

  </div>


  <div>

  <label className="block mb-2 font-medium">
  City
  </label>

  <input
  value="Asyut"
  disabled
  className="
  w-full
  p-4
  bg-gray-100
  border
  rounded-xl"
  />

  </div>


  <div>

  <label className="block mb-2 font-medium">
  District
  </label>

  <select
  value={filters.district}
  onChange={(e)=>
  setFilters({
  ...filters,
  district:e.target.value
  })
  }
  className="
  w-full
  p-4
  border
  rounded-xl"
  >

  <option value="">
  All Districts
  </option>

  <option value="فريال">
  فريال
  </option>

  <option value="سيد">
  سيد
  </option>

  <option value="قلتة">
  قلتة
  </option>

  <option value="سيتي">
  سيتي
  </option>

  <option value="الجمهورية">
  الجمهورية
  </option>

  </select>

  </div>


  <div>

  <label className="block mb-2 font-medium">
  Apartment Type
  </label>

  <select
  value={filters.apartmentType}
  onChange={(e)=>
  setFilters({
  ...filters,
  apartmentType:e.target.value
  })
  }
  className="
  w-full
  p-4
  border
  rounded-xl"
  >

  <option value="">
  Any
  </option>

  <option value="apartment">
  Apartment
  </option>

  <option value="studio">
  Studio
  </option>

  <option value="room">
  Room
  </option>

  </select>

  </div>

  </div>

  </div>

  </div>


  {/* Results */}

  <div>

  {loading ? (

  <div className="
  text-center
  py-20
  ">

  <div className="
  animate-spin
  rounded-full
  h-14
  w-14
  border-4
  border-gray-300
  border-t-black
  mx-auto
  "></div>

  <p className="mt-4 text-gray-500">
  Loading apartments...
  </p>

  </div>

  )

  : apartments.length>0 ? (

  <>

  <div className="
  flex
  justify-between
  items-center
  mb-6
  ">

  <h2 className="text-2xl font-bold">
  Available Apartments
  </h2>

  <span className="
  bg-white
  px-4
  py-2
  rounded-xl
  shadow-sm
  ">

  {apartments.length} found

  </span>

  </div>

  <div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-6
  ">

  {apartments.map((apartment)=>(
  <ApartmentCard
  key={apartment._id}
  apartment={apartment}
  />
  ))}

  </div>

  </>

  ):(

  <div className="
  bg-white
  rounded-3xl
  shadow-md
  p-16
  text-center">

  <i className="fas fa-house-circle-xmark text-6xl text-gray-300 mb-4"></i>

  <h3 className="
  text-xl
  font-bold
  mb-2
  ">
  No apartments found
  </h3>

  <p className="text-gray-500">
  Try changing search filters
  </p>

  </div>

  )}

  </div>

  </div>

  </div>
  );
};
