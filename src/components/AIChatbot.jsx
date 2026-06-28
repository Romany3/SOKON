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
      // 1. Get AI response
      const response = await aiAPI.chat(userMessage);
      const data = response.data;
      
      const aiText = data?.reply || data?.message || data?.text || data?.data?.reply || "I found some results for you.";
      
      // 2. Extract apartments from AI response if provided directly
      let rawApartments = data?.apartments || data?.data?.apartments || data?.results || data?.data?.results || [];
      let apartments = Array.isArray(rawApartments) ? rawApartments.map(mapApartment) : [];

      // 3. Robust Fallback logic for Search
      const lowercaseMsg = userMessage.toLowerCase();
      const isSearchIntent = lowercaseMsg.match(/(شقة|شقق|apartment|room|rent|price|beds|bedroom|location|district|في|under|below|less|أقل|ميزانية|سعر)/i);
      const aiClaimsFound = aiText.match(/(لقيتلك|وجدت|found|here are|results|نتائج|كروت|تحت)/i);

      if (apartments.length === 0 && (isSearchIntent || aiClaimsFound)) {
        try {
          const searchRes = await apartmentsAPI.getAllApartments();
          let allApts = searchRes.data?.apartments || [];
          
          let filtered = [...allApts];

          // Simple keyword filtering for fallback
          const priceMatch = userMessage.match(/(under|below|less than|أقل من|تحت|ميزانية|سعر)\s*(\d+)/i);
          if (priceMatch && priceMatch[2]) {
            const maxPrice = parseInt(priceMatch[2]);
            filtered = filtered.filter(apt => apt.price <= maxPrice);
          }

          const districts = ['فريال', 'سيد', 'الجمهورية', 'يسري راغب', 'قلتة', 'سيتي', 'شركة قلتة'];
          const mentionedDistrict = districts.find(d => lowercaseMsg.includes(d));
          if (mentionedDistrict) {
            filtered = filtered.filter(apt => 
              (apt.district && apt.district.includes(mentionedDistrict)) || 
              (apt.address && apt.address.includes(mentionedDistrict))
            );
          }

          apartments = filtered.slice(0, 5);
          
          if (apartments.length === 0 && aiClaimsFound) {
            apartments = allApts.slice(0, 2);
          }
        } catch (searchError) {
          console.error("Manual search fallback failed:", searchError);
        }
      }

      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: aiText,
        apartments: apartments
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
