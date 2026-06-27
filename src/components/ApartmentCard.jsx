import React from 'react';
import { Link } from 'react-router-dom';
import { APARTMENT_PLACEHOLDER } from '../utils/placeholders';

export const ApartmentCard = ({ apartment, disableLink = false, showDistance = false, distance = null }) => {
  const displayName = apartment.title || apartment.name || 'Untitled';
  const displayLocation = apartment.city && apartment.district
    ? `${apartment.district}, ${apartment.city}`
    : apartment.location || apartment.city || apartment.address || '';
  const displayImage = apartment.images?.[0] || APARTMENT_PLACEHOLDER;
  const occupiedCount = Number.isFinite(Number(apartment.occupiedCount)) ? Number(apartment.occupiedCount) : null;
  const capacityValue = apartment.capacity ?? apartment.max_people ?? null;
  const capacity = Number.isFinite(Number(capacityValue)) ? Number(capacityValue) : null;
  const isFull = Boolean(
    apartment.isFull || (capacity !== null && capacity > 0 && occupiedCount !== null && occupiedCount >= capacity),
  );
  const occupancyPercent = capacity !== null && capacity > 0
    ? Math.min((occupiedCount / capacity) * 100, 100)
    : 0;

  const CardContent = () => (
    <>
      <div className="relative h-60 overflow-hidden bg-slate-200">
        <img
          src={displayImage}
          alt={displayName}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute left-4 top-4 rounded-2xl bg-slate-900/80 backdrop-blur-md px-4 py-2 text-xs font-black text-white shadow-xl">
          {isFull ? 'Fully booked' : `${apartment.price} EGY/month`}
        </div>

        {showDistance && distance !== null && distance !== Infinity && (
          <div className="absolute top-4 right-4 z-10 bg-primary/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-wider">
            {distance.toFixed(1)} km away
          </div>
        )}

        {capacity !== null && capacity > 0 && occupiedCount !== null && (
          <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black uppercase text-slate-700 shadow-sm border border-slate-100/50">
            {occupiedCount} / {capacity} occupied
          </div>
        )}
      </div>

      <div className="p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-xl font-black text-slate-900 group-hover:text-primary transition-colors duration-300">{displayName}</h3>
            <div className="mt-2.5 flex items-center gap-2 text-sm font-bold text-slate-400">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/5 text-primary">
                <i className="fas fa-location-dot text-[10px]"></i>
              </div>
              <span className="line-clamp-1 uppercase tracking-tight text-[11px]">{displayLocation}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-y border-slate-50 py-5 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100/50 group-hover:bg-white group-hover:border-primary/20 transition-colors">
              <i className="fas fa-bed text-primary"></i>
            </div>
            <span className="text-slate-500">{apartment.beds || apartment.bedrooms || 0} <span className="hidden sm:inline">Beds</span></span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100/50 group-hover:bg-white group-hover:border-primary/20 transition-colors">
              <i className="fas fa-door-open text-primary"></i>
            </div>
            <span className="text-slate-500">{apartment.rooms || 0} <span className="hidden sm:inline">Rooms</span></span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100/50 group-hover:bg-white group-hover:border-primary/20 transition-colors">
              <i className="fas fa-bath text-primary"></i>
            </div>
            <span className="text-slate-500">{apartment.bathrooms || 0} <span className="hidden sm:inline">Bath</span></span>
          </div>
        </div>

        {capacity !== null && capacity > 0 && occupiedCount !== null && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <span>Occupancy</span>
              <span className="text-primary font-black">{Math.round(occupancyPercent)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-50">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${isFull ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );

  const cardClasses = "group overflow-hidden rounded-[40px] border border-slate-200/60 bg-white shadow-sm transition-all duration-500 " + (disableLink ? "" : "hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]");

  if (disableLink) {
    return (
      <div className={cardClasses}>
        <CardContent />
      </div>
    );
  }

  return (
    <Link
      to={`/apartment/${apartment._id}`}
      className={cardClasses}
    >
      <CardContent />
    </Link>
  );
};
