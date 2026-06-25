import React from 'react';
import { Link } from 'react-router-dom';
import { APARTMENT_PLACEHOLDER } from '../utils/placeholders';

export const ApartmentCard = ({ apartment }) => {
  const displayName = apartment.title || apartment.name || 'Untitled';
  const displayLocation = apartment.city && apartment.district
    ? `${apartment.district}, ${apartment.city}`
    : apartment.location || apartment.city || '';
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

  return (
    <Link
      to={`/apartment/${apartment._id}`}
      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-52 overflow-hidden bg-slate-200">
        <img
          src={displayImage}
          alt={displayName}
          className="h-full w-full object-cover"
        />

        <div className="absolute left-3 top-3 rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-white">
          {isFull ? 'Fully booked' : `$${apartment.price}/month`}
        </div>

        {capacity !== null && capacity > 0 && occupiedCount !== null && (
          <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {occupiedCount} / {capacity} occupied
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-2 text-lg font-black text-slate-900">{displayName}</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <i className="fas fa-map-marker-alt text-[#245999]"></i>
              <span className="line-clamp-1">{displayLocation}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-4 border-b border-slate-100 pb-4 text-sm text-slate-700">
          {apartment.beds ? (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-bed text-[#245999]"></i>
              <span>{apartment.beds} Beds</span>
            </div>
          ) : null}
          {apartment.rooms ? (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-door-open text-[#245999]"></i>
              <span>{apartment.rooms} Rooms</span>
            </div>
          ) : null}
          {apartment.bathrooms ? (
            <div className="flex items-center gap-1.5">
              <i className="fas fa-bath text-[#245999]"></i>
              <span>{apartment.bathrooms} Bath</span>
            </div>
          ) : null}
        </div>

        {capacity !== null && capacity > 0 && occupiedCount !== null && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>Occupancy</span>
              <span>{Math.round(occupancyPercent)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-[#245999]'}`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};
