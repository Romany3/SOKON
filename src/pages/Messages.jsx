import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);

      try {
        const response = await chatAPI.getConversations();
        const data = response.data;
        setConversations(Array.isArray(data) ? data : (data?.conversations || []));
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [storeVersion]);

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
              <p className="mt-2 max-w-2xl text-slate-600">
                Students and owners can message each other here. Image attachments are supported.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/home')}
              className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Browse apartments
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <div className="rounded-[28px] bg-white py-20 text-center text-slate-500 shadow-sm">
            Loading conversations...
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <button
                key={conversation._id}
                type="button"
                onClick={() => navigate(`/messages/${conversation._id}`)}
                className="w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                    <img
                      src={conversation.otherParticipant?.avatar || AVATAR_SM_PLACEHOLDER}
                      alt={conversation.otherParticipant?.fullName || 'Participant'}
                      className="h-full w-full object-cover"
                    />
                    {conversation.unreadCount > 0 && (
                      <span className="absolute right-1 top-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-black text-slate-900">
                        {conversation.otherParticipant?.fullName || 'Conversation'}
                      </h3>
                      {conversation.apartment && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {conversation.apartment.title || conversation.apartment.name}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {conversation.lastMessage?.text
                        ? conversation.lastMessage.text
                        : conversation.lastMessage?.images?.length
                          ? `Shared ${conversation.lastMessage.images.length} image${conversation.lastMessage.images.length > 1 ? 's' : ''}`
                          : 'No messages yet'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-400">
                      {conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString() : ''}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Open chat
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white py-20 text-center shadow-sm">
            <i className="fas fa-comments text-6xl text-slate-300 mb-5"></i>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">No conversations yet</h3>
            <p className="text-slate-500">Start a chat from an apartment detail page.</p>
          </div>
        )}
      </div>
    </div>
  );
};
