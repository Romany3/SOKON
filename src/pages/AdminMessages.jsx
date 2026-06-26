import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminNavbar } from '../components/AdminNavbar';
import { chatAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

export const AdminMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatWithId = searchParams.get('chatWith');

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await chatAPI.getChats(user?._id);
      const list = res.data?.conversations || res.data?.chats || [];
      setConversations(list);
      
      // If chatWith param exists, try to find or create that chat
      if (chatWithId) {
        handleStartNewChat(chatWithId, list);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = async (targetUserId, existingChats) => {
    try {
      const targetUserRes = await usersAPI.getUserById(targetUserId);
      const targetUser = targetUserRes.data;
      
      if (!targetUser) return;

      const res = await chatAPI.getOrCreateConversation({
        participantIds: [user._id, targetUserId],
        participants: [
          { _id: user._id, fullName: user.fullName, avatar: user.avatar },
          { _id: targetUser._id, fullName: targetUser.fullName, avatar: targetUser.avatar }
        ]
      });
      
      const newChat = res.data?.conversation || res.data;
      if (newChat) {
        setSelectedChat(newChat);
        fetchMessages(newChat._id);
        // Refresh list to show new chat at top
        const resList = await chatAPI.getChats(user?._id);
        setConversations(resList.data?.conversations || []);
      }
    } catch (err) {
      console.error('Error starting new chat:', err);
    }
  };

  useEffect(() => {
    if (user?._id) fetchConversations();
  }, [user?._id]);

  const fetchMessages = async (chatId) => {
    setMsgLoading(true);
    try {
      const res = await chatAPI.getConversation(chatId);
      setMessages(res.data?.conversation?.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Polling for new messages if a chat is selected
  useEffect(() => {
    if (!selectedChat) return;
    const interval = setInterval(() => {
      fetchMessages(selectedChat._id);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedChat?._id]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedChat) return;

    setSending(true);
    try {
      await chatAPI.sendMessage(selectedChat._id, { text: inputText.trim() });
      setText('');
      fetchMessages(selectedChat._id);
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
        {/* Sidebar: Chat List */}
        <div className="w-full md:w-[400px] flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-10rem)]">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-xl font-black text-slate-900">Support Inbox</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Direct Communications</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 bg-slate-50 rounded"></div>
                      <div className="h-3 w-3/4 bg-slate-50 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-12 text-center">
                 <i className="fas fa-comments-alt text-4xl text-slate-100 mb-4"></i>
                 <p className="text-slate-400 text-sm font-medium">No active conversations</p>
              </div>
            ) : (
              conversations.map((chat) => {
                const lastMsg = chat.lastMessage;
                const previewText = lastMsg ? (lastMsg.text || (lastMsg.images?.length > 0 ? "📷 Photo" : "No messages yet")) : "No messages yet";

                return (
                  <button
                    key={chat._id}
                    onClick={() => {
                      setSelectedChat(chat);
                      fetchMessages(chat._id);
                    }}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition border-l-4 ${
                      selectedChat?._id === chat._id ? 'bg-primary/5 border-primary' : 'border-transparent'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-white shadow-sm">
                      <img src={chat.otherParticipant?.avatar || AVATAR_SM_PLACEHOLDER} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="font-bold text-slate-900 truncate text-sm">{chat.otherParticipant?.fullName}</h4>
                        <span className="text-[10px] font-bold text-slate-400">
                          {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {previewText}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/40"></div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-10rem)]">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-2xl overflow-hidden bg-slate-100">
                      <img src={selectedChat.otherParticipant?.avatar || AVATAR_SM_PLACEHOLDER} alt="" className="h-full w-full object-cover" />
                   </div>
                   <div>
                      <h3 className="font-black text-slate-900 leading-none">{selectedChat.otherParticipant?.fullName}</h3>
                      <p className="text-xs text-emerald-500 font-bold mt-1.5 flex items-center gap-1.5 uppercase tracking-tighter">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active Session
                      </p>
                   </div>
                </div>
                <button 
                  onClick={() => navigate(`/admin/users/${selectedChat.otherParticipant?._id}`)}
                  className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition border border-slate-100"
                >
                  User Profile
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                <div className="space-y-6">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?._id;
                    const hasOnlyImages = !msg.text && msg.images?.length > 0;
                    
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                           <div className="h-8 w-8 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-white mt-auto">
                              <img src={isMe ? user.avatar : selectedChat.otherParticipant?.avatar || AVATAR_SM_PLACEHOLDER} alt="" className="h-full w-full object-cover" />
                           </div>
                           <div className={`p-4 rounded-[24px] shadow-sm text-sm ${
                             isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                           }`}>
                              {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                              
                              {msg.images?.length > 0 && (
                                <div className={`grid gap-2 ${msg.text ? 'mt-3' : ''} ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                  {msg.images.map((image, index) => (
                                    <img
                                      key={`${msg._id}-${index}`}
                                      src={image}
                                      alt="Attachment"
                                      className={`rounded-xl object-cover cursor-pointer hover:opacity-90 transition ${hasOnlyImages ? 'max-h-[300px]' : 'max-h-60'}`}
                                      onClick={() => window.open(image, '_blank')}
                                    />
                                  ))}
                                </div>
                              )}

                              <p className={`text-[10px] mt-2 font-bold uppercase tracking-tighter ${isMe ? 'text-white/50' : 'text-slate-300'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-slate-100 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type a support message..."
                      value={inputText}
                      onChange={(e) => setText(e.target.value)}
                      className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition"
                    />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                       <i className="far fa-face-smile"></i>
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !inputText.trim()}
                    className="h-[58px] w-[58px] rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:opacity-90 transition disabled:opacity-50 disabled:shadow-none"
                  >
                    {sending ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <i className="fas fa-paper-plane"></i>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-12">
               <div>
                  <div className="h-24 w-24 rounded-[32px] bg-slate-50 flex items-center justify-center text-slate-200 text-4xl mx-auto mb-6">
                     <i className="fas fa-comments"></i>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Select a Conversation</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">Choose a user from the sidebar to view your message history or start a new chat from the users page.</p>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
