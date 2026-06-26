import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

export const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Function to load conversation data
  const loadConversation = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const response = await chatAPI.getConversation(conversationId);
      const data = response.data?.conversation || response.data;
      
      if (data) {
        setConversation(prev => {
          // Only update if message count changed to avoid unnecessary re-renders
          if (prev?.messages?.length === data.messages?.length) return prev;
          return data;
        });
        await chatAPI.markConversationAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      if (!isBackground) setConversation(null);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    if (conversationId) {
      loadConversation(false);
    }
  }, [conversationId, loadConversation]);

  // Polling for new messages every 4 seconds (Chat only)
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      loadConversation(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [conversationId, loadConversation]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If user is within 100px of bottom, enable auto-scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
  };

  // Scroll to bottom when messages change AND user is at bottom
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages?.length, shouldAutoScroll]);

  const otherParticipant = useMemo(() => {
    if (!conversation?.participants?.length) {
      return null;
    }
    return conversation.participants.find((participant) => participant._id !== user?._id) || conversation.participants[0];
  }, [conversation, user?._id]);

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    setAttachments((current) => [...current, ...files]);
    event.target.value = '';
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSendMessage = async () => {
    if ((!text.trim() && attachments.length === 0) || !conversationId) {
      return;
    }

    setSending(true);
    try {
      await chatAPI.sendMessage(conversationId, {
        text: text.trim(),
        images: attachments,
      });

      setText('');
      setAttachments([]);
      setShouldAutoScroll(true); // Force scroll on own message
      await loadConversation(true);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const messageList = conversation?.messages || [];

  return (
    <div className="min-h-screen bg-[#f6f7fb] flex flex-col">
      <Navbar />

      <div className="flex-1 px-4 py-6">
        <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-5xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/messages')}
                className="rounded-full bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
                aria-label="Back to messages"
              >
                <i className="fas fa-arrow-left" />
              </button>

              <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={otherParticipant?.avatar || AVATAR_SM_PLACEHOLDER}
                  alt={otherParticipant?.fullName || 'Participant'}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h1 className="text-xl font-black text-slate-900">
                  {otherParticipant?.fullName || 'Conversation'}
                </h1>
                <p className="text-sm text-slate-500">
                  {otherParticipant?.role || 'Participant'}
                  {conversation?.apartment ? ` · ${conversation.apartment.title || conversation.apartment.name}` : ''}
                </p>
              </div>
            </div>

            {conversation?.apartment && (
              <button
                type="button"
                onClick={() => navigate(`/apartment/${conversation.apartment._id}`)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                View apartment
              </button>
            )}
          </div>

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6 md:px-6 scroll-smooth"
          >
            {loading && !conversation ? (
              <div className="flex h-full items-center justify-center">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : !conversation ? (
              <div className="flex h-full items-center justify-center text-center text-slate-500">
                <div>
                  <i className="fas fa-comments text-6xl text-slate-300 mb-4"></i>
                  <p className="text-lg font-semibold text-slate-700">Conversation not found</p>
                  <button
                    type="button"
                    onClick={() => navigate('/messages')}
                    className="mt-4 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                  >
                    Back to inbox
                  </button>
                </div>
              </div>
            ) : messageList.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-slate-400">
                <div>
                  <i className="fas fa-message text-5xl mb-4"></i>
                  <p className="text-sm">Start your conversation by sending a message below.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messageList.map((message) => {
                  const isMe = message.senderId === user?._id;
                  const senderAvatar = message.sender?.avatar || message.sender?.photoUrl || otherParticipant?.avatar || AVATAR_SM_PLACEHOLDER;
                  
                  return (
                    <div key={message._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] items-end gap-3 md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMe && (
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-200 shadow-sm border border-white">
                            <img src={senderAvatar} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}

                        <div
                          className={`min-w-0 rounded-[24px] px-4 py-3 shadow-sm ${
                            isMe ? 'rounded-br-md bg-[#245999] text-white' : 'rounded-bl-md bg-white text-slate-800 border border-slate-100'
                          }`}
                        >
                          {message.text && <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>}

                          {message.images?.length > 0 && (
                            <div className={`mt-3 grid gap-2 ${message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {message.images.map((image, index) => (
                                <img
                                  key={`${message._id}-${index}`}
                                  src={image}
                                  alt=""
                                  className="w-full rounded-xl object-cover max-h-64 cursor-pointer hover:opacity-90 transition"
                                  onClick={() => window.open(image, '_blank')}
                                />
                              ))}
                            </div>
                          )}

                          <p
                            className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                              isMe ? 'text-white/60' : 'text-slate-400'
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-4 md:px-6">
            {attachments.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 animate-in slide-in-from-bottom-2 duration-300">
                {attachments.map((file, index) => {
                  const previewUrl = URL.createObjectURL(file);

                  return (
                    <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-2xl bg-slate-100 aspect-square shadow-sm">
                      <img
                        src={previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition"
                      >
                        <i className="fas fa-times text-xs" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-end gap-3">
              <label className="h-[52px] w-[52px] flex items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 cursor-pointer shrink-0 shadow-sm border border-slate-200/50">
                <i className="fas fa-image text-lg" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentChange}
                />
              </label>

              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows="1"
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition font-medium"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sending || (!text.trim() && attachments.length === 0)}
                className="h-[52px] px-6 rounded-2xl bg-[#245999] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-lg shadow-primary/20 active:scale-95 shrink-0"
              >
                {sending ? (
                   <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
