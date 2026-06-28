import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APARTMENT_PLACEHOLDER } from '../utils/placeholders';

/**
 * A dedicated compact card for displaying apartment results within the AI Chatbot.
 * Designed with a horizontal layout to feel like a chat message.
 */
export const ChatApartmentCard = ({ apartment }) => {
  const navigate = useNavigate();

  if (!apartment) return null;

  const title = apartment.title || apartment.name || 'Apartment';
  const image = (apartment.images && apartment.images[0]) || APARTMENT_PLACEHOLDER;
  const price = apartment.price || 0;
  const location = apartment.district || apartment.city || 'Assuit';
  const beds = apartment.beds || apartment.bedrooms || 0;
  const available = apartment.available_people || 0;

  const handleCardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/apartment/${apartment._id || apartment.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="flex items-center gap-3 bg-white p-2.5 rounded-[22px] border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group w-full animate-in fade-in slide-in-from-right-2 duration-300"
    >
      {/* Apartment Image - Left Side */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-[16px] overflow-hidden bg-slate-50 border border-slate-100/50">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
      </div>

      {/* Apartment Information - Right Side */}
      <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between min-h-[64px] sm:min-h-[80px]">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8px] font-black uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded-full">
              Best Match
            </span>
            <div className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
               <span className="text-[9px] font-bold">Details</span>
               <i className="fas fa-chevron-right text-[8px]"></i>
            </div>
          </div>
          
          <h4 className="text-sm font-bold text-slate-900 truncate mt-1 group-hover:text-primary transition-colors">
            {title}
          </h4>
          
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-black text-primary">{price} EGY</span>
            <span className="text-[8px] font-medium text-slate-400 uppercase tracking-tighter">/ month</span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 min-w-0">
            <i className="fas fa-location-dot text-primary/40 text-[8px] shrink-0"></i>
            <span className="truncate">{location}</span>
          </div>
          
          <div className="flex items-center gap-2 border-l border-slate-100 pl-2 shrink-0">
            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
              <i className="fas fa-bed text-primary/30 text-[8px]"></i> {beds}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
              <i className="fas fa-user-check text-primary/30 text-[8px]"></i> {available}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
