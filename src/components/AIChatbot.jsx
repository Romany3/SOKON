import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { aiAPI, apartmentsAPI } from '../services/api';
import { getApiErrorMessage } from '../services/apiClient';
import { mapApartment } from '../services/apartmentService';
import { ChatApartmentCard } from './ChatApartmentCard';

export const AIChatbot = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { 
      role: 'ai', 
      text: 'Hi! I am your SOKON AI Assistant. How can I help you find your perfect student home today?' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Hide chatbot on authentication pages
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/auth/callback' || pathname.startsWith('/forgot-password');
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(scrollToBottom, 150);
      return () => clearTimeout(timeout);
    }
  }, [chatHistory, isOpen, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setMessage('');
    setIsLoading(true);

    try {
      // 1. Get AI response for the conversational part
      const response = await aiAPI.chat(userMessage);
      const data = response.data;
      
      let aiText = data?.reply || data?.message || data?.text || data?.data?.reply || "";
      
      // 2. Extract initial results from AI if provided
      let rawResults = data?.apartments || data?.data?.apartments || data?.results || data?.data?.results || [];
      let finalApartments = Array.isArray(rawResults) ? rawResults.map(mapApartment) : [];

      // 3. Natural Language Search & Filtering Logic
      const lowercaseMsg = userMessage.toLowerCase();
      
      // Detect search intent across languages and key fields
      const isSearchIntent = lowercaseMsg.match(/(شقة|شقق|apartment|room|rent|price|beds|bedroom|location|district|في|under|below|less|أقل|ميزانية|سعر|verified|موثق|حمام|bath|people|person|شخص|طلاب|floor|دور|city|مدينة|more|أكثر|فوق|above)/i);

      if (isSearchIntent) {
        try {
          const searchRes = await apartmentsAPI.getAllApartments();
          let allApts = searchRes.data?.apartments || [];
          
          // Condition Extraction
          const filters = {};
          
          // Price filters (Max/Min)
          const maxPriceMatch = lowercaseMsg.match(/(?:under|below|less than|max|تحت|أقل من|ميزانية|سعر)\s*(\d+)/i);
          if (maxPriceMatch) filters.maxPrice = parseInt(maxPriceMatch[1]);
          
          const minPriceMatch = lowercaseMsg.match(/(?:more than|above|greater than|min|فوق|أكثر من|أعلى من)\s*(\d+)/i);
          if (minPriceMatch) filters.minPrice = parseInt(minPriceMatch[1]);

          // Bedrooms
          const bedMatch = lowercaseMsg.match(/(\d+)\s*(?:bedroom|bed|غرف نوم|غرفة|سرير)/i) || lowercaseMsg.match(/(?:bedroom|bed|غرف نوم|غرفة|سرير)s?\s*(\d+)/i);
          if (bedMatch) filters.bedrooms = parseInt(bedMatch[1] || bedMatch[2]);
          
          // Bathrooms
          const bathMatch = lowercaseMsg.match(/(\d+)\s*(?:bathroom|bath|حمام)/i) || lowercaseMsg.match(/(?:bathroom|bath|حمام)s?\s*(\d+)/i);
          if (bathMatch) filters.bathrooms = parseInt(bathMatch[1]);

          // Capacity / Occupancy
          const peopleMatch = lowercaseMsg.match(/(?:for|to|يسع|لعدد|عدد|capacity)\s*(\d+)\s*(?:people|person|students|شخص|طلاب)/i) || lowercaseMsg.match(/(\d+)\s*(?:people|person|students|شخص|طلاب)/i);
          if (peopleMatch) filters.available_people = parseInt(peopleMatch[1]);

          // Verified Status
          if (lowercaseMsg.match(/(verified|trusted|موثق|مؤكد|حقيقي)/i)) filters.verified = true;

          // Floor
          const floorMatch = lowercaseMsg.match(/(?:floor|level|دور|طابق)\s*(\d+)/i) || lowercaseMsg.match(/(\d+)(?:st|nd|rd|th)?\s*(?:floor|level|دور|طابق)/i);
          if (floorMatch) filters.floor = parseInt(floorMatch[1]);

          // Location - City
          const cities = ['assuit', 'asyut', 'أسيوط', 'cairo', 'القاهرة'];
          const mentionedCity = cities.find(c => lowercaseMsg.includes(c));
          if (mentionedCity) filters.city = mentionedCity;

          // Location - District
          const districts = ['فريال', 'سيد', 'الجمهورية', 'يسري راغب', 'قلتة', 'سيتي', 'شركة قلتة', 'feryal', 'sayed', 'gomhouria', 'qulta', 'city'];
          const mentionedDistrict = districts.find(d => lowercaseMsg.includes(d));
          if (mentionedDistrict) filters.district = mentionedDistrict;

          // Apply filters dynamically
          const filtered = allApts.filter(apt => {
            if (filters.maxPrice && apt.price > filters.maxPrice) return false;
            if (filters.minPrice && apt.price < filters.minPrice) return false;
            if (filters.bedrooms && apt.bedrooms !== filters.bedrooms && apt.beds !== filters.bedrooms) return false;
            if (filters.bathrooms && apt.bathrooms !== filters.bathrooms) return false;
            if (filters.available_people && apt.available_people < filters.available_people) return false;
            if (filters.verified && !apt.verified) return false;
            if (filters.floor !== undefined && apt.floor !== filters.floor) return false;
            
            if (filters.city) {
              const city = (apt.city || '').toLowerCase();
              if (!city.includes('assuit') && !city.includes('asyut') && !city.includes('أسيوط') && !city.includes(filters.city)) return false;
            }
            
            if (filters.district) {
              const district = (apt.district || '').toLowerCase();
              const address = (apt.address || '').toLowerCase();
              if (!district.includes(filters.district) && !address.includes(filters.district)) return false;
            }
            
            return true;
          });

          if (filtered.length > 0) {
            finalApartments = filtered.slice(0, 5);
            // If AI didn't provide a useful response, generate one
            if (!aiText || aiText.includes("brain") || aiText.length < 5) {
              aiText = `I found ${filtered.length} apartment${filtered.length > 1 ? 's' : ''} matching your criteria:`;
            }
          } else {
            finalApartments = [];
            aiText = "No apartments found matching your request.";
          }
        } catch (searchError) {
          console.error("Chat search logic failed:", searchError);
        }
      }

      // Default fallback for generic queries
      if (!aiText && finalApartments.length === 0) {
        aiText = "I found some apartments you might like:";
        try {
          const res = await apartmentsAPI.getAllApartments();
          finalApartments = (res.data?.apartments || []).slice(0, 2);
        } catch (e) {}
      }

      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: aiText,
        apartments: finalApartments
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: getApiErrorMessage(error, 'Sorry, I am having trouble connecting to my AI brain right now.') 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthPage) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[1000] h-16 w-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center animate-in zoom-in"
        >
          <i className="fas fa-robot text-2xl"></i>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[1000] w-[90vw] sm:w-[450px] h-[600px] max-h-[85vh] bg-white rounded-[32px] shadow-[0_24px_80px_rgba(0,0,0,0.18)] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          
          {/* Header */}
          <div className="bg-primary px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/10">
                <i className="fas fa-robot text-lg"></i>
              </div>
              <div>
                <h3 className="text-white font-black text-sm tracking-tight leading-none uppercase">SOKON AI</h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Assistant Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-xl hover:bg-white/10 text-white transition-colors flex items-center justify-center"
              >
                <i className="fas fa-minus text-sm"></i>
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-xl hover:bg-white/10 text-white transition-colors flex items-center justify-center"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className="space-y-4">
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] p-4 rounded-[24px] text-[14px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none font-bold' 
                      : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 font-bold'
                  }`}>
                    {msg.text}
                  </div>
                </div>
                
                {/* Render Dedicated Chat Apartment Cards */}
                {msg.apartments && msg.apartments.length > 0 && (
                  <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 px-2">
                       <span className="h-px flex-1 bg-slate-200"></span>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                         {msg.apartments.length} Recommendations
                       </p>
                       <span className="h-px flex-1 bg-slate-200"></span>
                    </div>
                    
                    <div className="space-y-3 pb-2">
                      {msg.apartments.map((apt) => (
                        <ChatApartmentCard key={apt._id || Math.random()} apartment={apt} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-[20px] rounded-tl-none border border-slate-100 shadow-sm flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
              >
                <i className="fas fa-paper-plane text-lg"></i>
              </button>
            </form>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="h-[1px] w-4 bg-slate-100"></span>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Powered by SOKON AI</p>
              <span className="h-[1px] w-4 bg-slate-100"></span>
            </div>
          </div>
        </div>
      )}

      {/* Style for the internal scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </>
  );
};
