import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { chatAPI } from '../services/api';
import { useStoreVersion } from '../hooks/useStoreVersion';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

export const Messages = () => {
  const navigate = useNavigate();
  const storeVersion = useStoreVersion();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const response = await chatAPI.getConversations();
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.conversations || []);
      
      setConversations(prev => {
        // Simple optimization to avoid re-renders if list hasn't effectively changed
        if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
        return list;
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations(false);
  }, [loadConversations, storeVersion]);

  // Periodic refresh for the inbox list (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Navbar />

      <div className="px-4 pt-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Real-time chat
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
                Messages
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600 font-medium">
                Communicate directly with students or owners. New messages update automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/apartments')}
              className="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-800 shadow-lg shadow-slate-200"
            >
              Browse Apartments
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {loading && conversations.length === 0 ? (
          <div className="space-y-4">
             {[...Array(3)].map((_, i) => (
               <div key={i} className="h-24 bg-white rounded-[28px] animate-pulse border border-slate-100 shadow-sm"></div>
             ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const lastMsg = conversation.lastMessage;
              const previewText = lastMsg ? (lastMsg.text || (lastMsg.images?.length > 0 ? "📷 Shared a photo" : "No messages yet")) : "No messages yet";

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => navigate(`/messages/${conversation._id}`)}
                  className="w-full rounded-[28px] border border-slate-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                      <img
                        src={conversation.otherParticipant?.avatar || AVATAR_SM_PLACEHOLDER}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black text-slate-900 truncate">
                          {conversation.otherParticipant?.fullName || 'User'}
                        </h3>
                        {conversation.apartment && (
                          <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary">
                            {conversation.apartment.title || conversation.apartment.name}
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-sm text-slate-500 truncate font-medium">
                        {previewText}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                        {conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString() : ''}
                      </p>
                      <div className="mt-2 text-primary opacity-0 group-hover:opacity-100 transition duration-300">
                         <i className="fas fa-chevron-right text-xs"></i>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[40px] bg-white py-24 text-center shadow-sm border border-slate-100">
            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
               <i className="fas fa-comments text-4xl"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Your inbox is empty</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">Start a conversation from an apartment detail page to chat with the owner.</p>
          </div>
        )}
      </div>
    </div>
  );
};
