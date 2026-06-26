import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApartmentCard } from './ApartmentCard';

const UNIVERSITIES = [
  {
    id: 'assiut',
    name: 'Assiut University',
    shortName: 'Assiut',
    nameAr: 'جامعة أسيوط',
    description: 'The main campus of Assiut University, one of the oldest and largest in Egypt.',
    district: 'Al Hamraa',
    lat: 27.1852,
    lng: 31.1685,
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'assiut-national',
    name: 'Assiut National University',
    shortName: 'National',
    nameAr: 'جامعة أسيوط الأهلية',
    description: 'A newly established national university in New Assiut, offering advanced academic programs.',
    district: 'New Assiut',
    lat: 27.27449803550571,
    lng: 31.274759900150357,
    image: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bua',
    name: 'Badr University (BUA)',
    shortName: 'Badr',
    nameAr: 'جامعة بدر بأسيوط',
    description: 'A modern private university located in New Assiut, offering various modern programs.',
    district: 'New Assiut',
    lat: 27.2400,
    lng: 31.3300,
    image: 'https://images.unsplash.com/photo-1523050853064-889895088d22?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
];

// Helper to calculate distance between coordinates (Haversine formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export const UniversitySection = ({ allApartments, limit }) => {
  const [selectedUni, setSelectedUni] = useState(UNIVERSITIES[0]);
  const navigate = useNavigate();

  const nearbyApartments = useMemo(() => {
    if (!selectedUni || !allApartments.length) return [];

    // Calculate distance for all apartments and sort
    const withDistance = allApartments.map(apt => {
      const aptLat = apt.latitude || apt.lat;
      const aptLng = apt.longitude || apt.lng;

      let distance = getDistance(selectedUni.lat, selectedUni.lng, aptLat, aptLng);

      // Fallback: If no coordinates, check district match and assign a "close" distance
      if (distance === Infinity && apt.district) {
        if (apt.district.toLowerCase().includes(selectedUni.district.toLowerCase())) {
          distance = 2; // Arbitrary 2km for same district
        }
      }

      return { ...apt, calculatedDistance: distance };
    });

    // Sort all by closest distance
    const sorted = withDistance.sort((a, b) => a.calculatedDistance - b.calculatedDistance);
    
    // Apply limit if provided
    return limit ? sorted.slice(0, limit) : sorted;
  }, [selectedUni, allApartments, limit]);

  // Standard embed link that works without API key for basic locations
  const fallbackMapUrl = `https://maps.google.com/maps?q=${selectedUni.lat},${selectedUni.lng}&z=15&output=embed`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Education Hub</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Nearby {selectedUni.name}</h2>
          <p className="mt-2 text-slate-500 text-sm">Sorted by distance from the selected campus.</p>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full">
          {UNIVERSITIES.map((uni) => (
            <button
              key={uni.id}
              onClick={() => setSelectedUni(uni)}
              className={`px-6 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedUni.id === uni.id
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {uni.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Map & Uni Info */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 h-fit space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="h-48 w-full relative bg-slate-100">
              <iframe
                title="University Location"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={fallbackMapUrl}
                allowFullScreen
              ></iframe>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-black text-slate-900">{selectedUni.name}</h3>
                <p className="text-primary font-bold text-xs uppercase tracking-wider">{selectedUni.nameAr}</p>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {selectedUni.description}
              </p>

              <div className="mt-auto pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                  <i className="fas fa-location-dot text-primary"></i>
                  {selectedUni.district} District
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Apartments Grid */}
        <div className="lg:col-span-8">
          {nearbyApartments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nearbyApartments.map((apt) => (
                <div key={apt._id} className="relative group">
                  <ApartmentCard apartment={apt} />
                  {apt.calculatedDistance !== Infinity && (
                    <div className="absolute top-4 right-4 z-10 bg-primary text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-lg uppercase tracking-wider">
                      {apt.calculatedDistance < 1 
                        ? `${(apt.calculatedDistance * 1000).toFixed(0)} m away`
                        : `${apt.calculatedDistance.toFixed(1)} km away`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center rounded-[32px] bg-white border border-slate-200 p-12 text-center shadow-sm">
              <div>
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-building-circle-exclamation text-slate-300 text-2xl"></i>
                </div>
                <h4 className="text-slate-900 font-bold">No apartments available</h4>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">We couldn't find any apartments near this university yet.</p>
                <button
                  onClick={() => navigate('/apartments')}
                  className="mt-6 text-primary font-bold text-sm hover:underline"
                >
                  Browse all apartments
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
